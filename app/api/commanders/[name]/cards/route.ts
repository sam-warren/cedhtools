import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";

interface RouteContext {
  params: Promise<{ name: string }>;
}

export type TimePeriod = "1_month" | "3_months" | "6_months" | "1_year" | "all_time";

function getTimePeriodDays(period: TimePeriod): number | null {
  switch (period) {
    case "1_month":
      return 30;
    case "3_months":
      return 90;
    case "6_months":
      return 180;
    case "1_year":
      return 365;
    case "all_time":
      return null;
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { name: encodedName } = await context.params;
    const commanderName = decodeURIComponent(encodedName);
    const searchParams = request.nextUrl.searchParams;
    const timePeriod = (searchParams.get("timePeriod") as TimePeriod) ?? "3_months";
    const minTournamentSize = searchParams.has("minTournamentSize")
      ? parseInt(searchParams.get("minTournamentSize")!)
      : 0;
    
    const supabase = await createClient();
    
    // Note: minTournamentSize filter requires querying raw data instead of pre-aggregated stats
    // For now, this filter is only applied when > 0 (UI can show a warning that it's slower)
    void minTournamentSize; // TODO: Implement tournament size filtering for card stats
    
    // Get commander
    const { data: commander, error: commanderError } = await supabase
      .from("commanders")
      .select("id, name")
      .eq("name", commanderName)
      .single();
    
    if (commanderError || !commander) {
      return NextResponse.json(
        { error: "Commander not found" },
        { status: 404 }
      );
    }
    
    // Extract individual commander names for filtering
    const commanderNames = commander.name.split(" / ").map((n: string) => n.trim().toLowerCase());
    
    // Calculate date filter
    const days = getTimePeriodDays(timePeriod);
    const dateFilter = days
      ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      : null;
    
    // Get commander aggregate stats from the same time period (paginated)
    // Use entries_with_decklists for play rate calculation (only count entries that have decklists)
    interface CommanderWeeklyStat {
      entries: number;
      entries_with_decklists: number;
      wins: number;
      draws: number;
      losses: number;
    }
    
    const allCommanderWeeklyStats: CommanderWeeklyStat[] = [];
    let cmdStatsOffset = 0;
    const cmdStatsPageSize = 1000;
    
    while (true) {
      let commanderStatsQuery = supabase
        .from("commander_weekly_stats")
        .select("entries, entries_with_decklists, wins, draws, losses")
        .eq("commander_id", commander.id)
        .order("id", { ascending: true })
        .range(cmdStatsOffset, cmdStatsOffset + cmdStatsPageSize - 1);
      
      if (dateFilter) {
        commanderStatsQuery = commanderStatsQuery.gte("week_start", dateFilter);
      }
      
      const { data, error } = await commanderStatsQuery;
      if (error) throw error;
      
      const page = data as CommanderWeeklyStat[] | null;
      if (!page || page.length === 0) break;
      
      allCommanderWeeklyStats.push(...page);
      cmdStatsOffset += cmdStatsPageSize;
      
      if (page.length < cmdStatsPageSize) break;
    }
    
    // Calculate commander totals
    // Use entries_with_decklists for play rate denominator (only compare against decks that have decklists)
    // Fall back to entries if entries_with_decklists hasn't been populated yet
    let totalCommanderEntriesWithDecklists = 0;
    let totalCommanderEntries = 0;
    let commanderWins = 0;
    let commanderDraws = 0;
    let commanderLosses = 0;
    
    for (const week of allCommanderWeeklyStats) {
      totalCommanderEntriesWithDecklists += week.entries_with_decklists || 0;
      totalCommanderEntries += week.entries;
      commanderWins += week.wins;
      commanderDraws += week.draws;
      commanderLosses += week.losses;
    }
    
    // Use entries_with_decklists if populated, otherwise fall back to entries
    const playRateDenominator = totalCommanderEntriesWithDecklists > 0 
      ? totalCommanderEntriesWithDecklists 
      : totalCommanderEntries;
    
    const commanderTotalGames = commanderWins + commanderDraws + commanderLosses;
    const commanderWinRate = commanderTotalGames > 0 ? commanderWins / commanderTotalGames : 0;
    
    // Get card stats from weekly stats table with pagination
    interface CardStat {
      card_id: number;
      entries: number;
      top_cuts: number;
      wins: number;
      draws: number;
      losses: number;
      card: {
        id: number;
        name: string;
        oracle_id: string | null;
        type_line: string | null;
        mana_cost: string | null;
        cmc: number | null;
      };
    }
    
    const allCardStats: CardStat[] = [];
    let offset = 0;
    const pageSize = 1000;
    
    while (true) {
      let query = supabase
        .from("card_commander_weekly_stats")
        .select(`
          card_id,
          entries,
          top_cuts,
          wins,
          draws,
          losses,
          card:cards!inner (
            id,
            name,
            oracle_id,
            type_line,
            mana_cost,
            cmc
          )
        `)
        .eq("commander_id", commander.id)
        .order("id", { ascending: true })
        .range(offset, offset + pageSize - 1);
      
      if (dateFilter) {
        query = query.gte("week_start", dateFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const page = data as unknown as CardStat[] | null;
      if (!page || page.length === 0) break;
      
      allCardStats.push(...page);
      offset += pageSize;
      
      if (page.length < pageSize) break;
    }
    
    // Aggregate stats by card
    const cardMap = new Map<number, {
      card: {
        id: number;
        name: string;
        oracle_id: string | null;
        type_line: string | null;
        mana_cost: string | null;
        cmc: number | null;
      };
      entries: number;
      top_cuts: number;
      wins: number;
      draws: number;
      losses: number;
    }>();
    
    for (const stat of allCardStats) {
      const card = stat.card;
      
      // Skip if this card is one of the commanders
      if (commanderNames.includes(card.name.toLowerCase())) {
        continue;
      }
      
      const existing = cardMap.get(card.id) || {
        card,
        entries: 0,
        top_cuts: 0,
        wins: 0,
        draws: 0,
        losses: 0,
      };
      
      existing.entries += stat.entries;
      existing.top_cuts += stat.top_cuts;
      existing.wins += stat.wins;
      existing.draws += stat.draws;
      existing.losses += stat.losses;
      
      cardMap.set(card.id, existing);
    }
    
    // Convert to array with calculated rates
    // Play rate = decks with this card / decks with decklists (or total entries as fallback)
    const cards = Array.from(cardMap.values()).map((stat) => {
      const totalGames = stat.wins + stat.draws + stat.losses;
      const winRate = totalGames > 0 ? stat.wins / totalGames : 0;
      const playRate = playRateDenominator > 0 
        ? stat.entries / playRateDenominator 
        : 0;
      
      return {
        id: stat.card.id,
        name: stat.card.name,
        oracle_id: stat.card.oracle_id,
        type_line: stat.card.type_line,
        mana_cost: stat.card.mana_cost,
        cmc: stat.card.cmc,
        entries: stat.entries,
        top_cuts: stat.top_cuts,
        wins: stat.wins,
        draws: stat.draws,
        losses: stat.losses,
        play_rate: playRate,
        win_rate: winRate,
        win_rate_delta: winRate - commanderWinRate, // Delta vs commander overall
        conversion_rate: stat.entries > 0 ? stat.top_cuts / stat.entries : 0,
      };
    });
    
    // Sort by play rate by default
    cards.sort((a, b) => b.play_rate - a.play_rate);
    
    // Find Sol Ring for debug
    const solRing = cards.find(c => c.name === 'Sol Ring');
    
    return NextResponse.json({
      commander_id: commander.id,
      commander_name: commanderName,
      total_entries: playRateDenominator,
      commander_win_rate: commanderWinRate,
      cards,
      // Debug info
      _debug: {
        total_commander_entries: totalCommanderEntries,
        total_commander_entries_with_decklists: totalCommanderEntriesWithDecklists,
        play_rate_denominator: playRateDenominator,
        weeks_counted: allCommanderWeeklyStats.length,
        date_filter: dateFilter,
        sol_ring_entries: solRing?.entries ?? 'not found',
        sol_ring_play_rate: solRing?.play_rate ?? 'not found',
        expected_play_rate_if_100_pct: solRing ? solRing.entries / playRateDenominator : 'N/A',
      },
    });
  } catch (error) {
    console.error("Error fetching commander cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch commander cards" },
      { status: 500 }
    );
  }
}
