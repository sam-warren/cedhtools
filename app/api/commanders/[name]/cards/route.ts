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
    
    const supabase = await createClient();
    
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
    
    // Get commander aggregate stats from the same time period
    interface CommanderWeeklyStat {
      entries: number;
      wins: number;
      draws: number;
      losses: number;
    }
    
    let commanderStatsQuery = supabase
      .from("commander_weekly_stats")
      .select("entries, wins, draws, losses")
      .eq("commander_id", commander.id);
    
    if (dateFilter) {
      commanderStatsQuery = commanderStatsQuery.gte("week_start", dateFilter);
    }
    
    const { data: commanderWeeklyStats } = await commanderStatsQuery;
    
    // Calculate commander totals
    let totalCommanderEntries = 0;
    let commanderWins = 0;
    let commanderDraws = 0;
    let commanderLosses = 0;
    
    for (const week of (commanderWeeklyStats || []) as CommanderWeeklyStat[]) {
      totalCommanderEntries += week.entries;
      commanderWins += week.wins;
      commanderDraws += week.draws;
      commanderLosses += week.losses;
    }
    
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
        .range(offset, offset + pageSize - 1);
      
      if (dateFilter) {
        query = query.gte("week_start", dateFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const page = data as CardStat[] | null;
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
    const cards = Array.from(cardMap.values()).map((stat) => {
      const totalGames = stat.wins + stat.draws + stat.losses;
      const winRate = totalGames > 0 ? stat.wins / totalGames : 0;
      const playRate = totalCommanderEntries > 0 ? stat.entries / totalCommanderEntries : 0;
      
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
    
    return NextResponse.json({
      commander_id: commander.id,
      commander_name: commanderName,
      total_entries: totalCommanderEntries,
      commander_win_rate: commanderWinRate,
      cards,
    });
  } catch (error) {
    console.error("Error fetching commander cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch commander cards" },
      { status: 500 }
    );
  }
}
