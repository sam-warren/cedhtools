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
    const name = decodeURIComponent(encodedName);
    const searchParams = request.nextUrl.searchParams;
    const timePeriod = (searchParams.get("timePeriod") as TimePeriod) ?? "3_months";
    const minTournamentSize = searchParams.has("minTournamentSize")
      ? parseInt(searchParams.get("minTournamentSize")!)
      : 0;
    
    const supabase = await createClient();
    
    // Get commander
    const { data: commander, error: commanderError } = await supabase
      .from("commanders")
      .select("*")
      .eq("name", name)
      .single();
    
    if (commanderError || !commander) {
      return NextResponse.json(
        { error: "Commander not found" },
        { status: 404 }
      );
    }
    
    // Calculate date filter
    const days = getTimePeriodDays(timePeriod);
    const dateFilter = days
      ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      : null;
    
    // Get aggregate stats from pre-aggregated weekly stats table (paginated)
    // This ensures we get stats from ALL entries, not just a limited subset
    interface WeeklyStat {
      entries: number;
      top_cuts: number;
      wins: number;
      draws: number;
      losses: number;
      week_start: string;
    }
    
    const weeklyStats: WeeklyStat[] = [];
    let statsOffset = 0;
    const statsPageSize = 1000;
    
    while (true) {
      let statsQuery = supabase
        .from("commander_weekly_stats")
        .select("entries, top_cuts, wins, draws, losses, week_start")
        .eq("commander_id", commander.id)
        .order("id", { ascending: true })
        .range(statsOffset, statsOffset + statsPageSize - 1);
      
      if (dateFilter) {
        statsQuery = statsQuery.gte("week_start", dateFilter);
      }
      
      const { data, error } = await statsQuery;
      if (error) throw error;
      
      const page = data as WeeklyStat[] | null;
      if (!page || page.length === 0) break;
      
      weeklyStats.push(...page);
      statsOffset += statsPageSize;
      
      if (page.length < statsPageSize) break;
    }
    
    // Get total entries per week across ALL commanders for meta share calculation
    // Must paginate to get all rows (Supabase default limit is 1000)
    const weeklyTotals = new Map<string, number>();
    let totalsOffset = 0;
    const totalsPageSize = 1000;
    
    while (true) {
      let totalQuery = supabase
        .from("commander_weekly_stats")
        .select("week_start, entries")
        .order("id", { ascending: true })
        .range(totalsOffset, totalsOffset + totalsPageSize - 1);
      
      if (dateFilter) {
        totalQuery = totalQuery.gte("week_start", dateFilter);
      }
      
      const { data: pageStats, error: pageError } = await totalQuery;
      
      if (pageError) throw pageError;
      
      const stats = pageStats as { week_start: string; entries: number }[] | null;
      if (!stats || stats.length === 0) break;
      
      // Sum entries per week
      for (const stat of stats) {
        const current = weeklyTotals.get(stat.week_start) || 0;
        weeklyTotals.set(stat.week_start, current + stat.entries);
      }
      
      totalsOffset += totalsPageSize;
      if (stats.length < totalsPageSize) break;
    }
    
    // Aggregate from weekly stats
    let totalEntries = 0;
    let topCuts = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    
    for (const week of (weeklyStats || []) as WeeklyStat[]) {
      totalEntries += week.entries;
      topCuts += week.top_cuts;
      wins += week.wins;
      draws += week.draws;
      losses += week.losses;
    }
    
    const totalGames = wins + draws + losses;
    const winRate = totalGames > 0 ? wins / totalGames : 0;
    const conversionRate = totalEntries > 0 ? topCuts / totalEntries : 0;
    
    // Format weekly trend data with meta share
    const trendData = ((weeklyStats || []) as WeeklyStat[])
      .sort((a, b) => a.week_start.localeCompare(b.week_start))
      .map((week) => {
        const weekTotalGames = week.wins + week.draws + week.losses;
        const weekTotalEntries = weeklyTotals.get(week.week_start) || 1;
        return {
          week_start: week.week_start,
          entries: week.entries,
          top_cuts: week.top_cuts,
          conversion_rate: week.entries > 0 ? week.top_cuts / week.entries : 0,
          win_rate: weekTotalGames > 0 ? week.wins / weekTotalGames : 0,
          meta_share: week.entries / weekTotalEntries,
        };
      });
    
    // Get recent entries for display (limited to 20 most recent)
    const dateFilterISO = dateFilter ? `${dateFilter}T00:00:00.000Z` : null;
    
    let entriesQuery = supabase
      .from("entries")
      .select(`
        id,
        standing,
        wins_swiss,
        wins_bracket,
        losses_swiss,
        losses_bracket,
        draws,
        decklist,
        player:players (
          id,
          name,
          topdeck_id
        ),
        tournament:tournaments!inner (
          id,
          tid,
          name,
          tournament_date,
          size,
          top_cut
        )
      `)
      .eq("commander_id", commander.id)
      .order("id", { ascending: false }); // Order by entry ID (most recent first)
    
    if (dateFilterISO) {
      entriesQuery = entriesQuery.gte("tournament.tournament_date", dateFilterISO);
    }
    
    if (minTournamentSize > 0) {
      entriesQuery = entriesQuery.gte("tournament.size", minTournamentSize);
    }
    
    const { data: entries, error: entriesError } = await entriesQuery.limit(20);
    
    if (entriesError) throw entriesError;
    
    return NextResponse.json({
      id: commander.id,
      name: commander.name,
      color_id: commander.color_id,
      stats: {
        entries: totalEntries,
        top_cuts: topCuts,
        wins,
        draws,
        losses,
        conversion_rate: conversionRate,
        win_rate: winRate,
      },
      entries: entries?.map((e) => ({
        id: e.id,
        standing: e.standing,
        wins_swiss: e.wins_swiss,
        wins_bracket: e.wins_bracket,
        losses_swiss: e.losses_swiss,
        losses_bracket: e.losses_bracket,
        draws: e.draws,
        decklist_url: e.decklist_url,
        player: e.player,
        tournament: e.tournament,
      })) || [],
      trend: trendData,
    });
  } catch (error) {
    console.error("Error fetching commander:", error);
    return NextResponse.json(
      { error: "Failed to fetch commander" },
      { status: 500 }
    );
  }
}
