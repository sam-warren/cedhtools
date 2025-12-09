import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { getTimePeriodDateOnly, type TimePeriod } from "@/lib/time-period";

interface RouteContext {
  params: Promise<{ name: string }>;
}

interface RpcWeeklyStat {
  week_start: string;
  entries: number;
  top_cuts: number;
  expected_top_cuts: number;
  wins: number;
  draws: number;
  losses: number;
  week_total_entries: number;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { name: encodedName } = await context.params;
    const name = decodeURIComponent(encodedName);
    const searchParams = request.nextUrl.searchParams;
    const timePeriod = (searchParams.get("timePeriod") as TimePeriod) ?? "6_months";
    const minTournamentSize = searchParams.has("minTournamentSize")
      ? parseInt(searchParams.get("minTournamentSize")!)
      : 0;
    
    const supabase = await createClient();
    
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
    
    const dateFilter = getTimePeriodDateOnly(timePeriod);
    
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'get_commander_detail_stats',
      {
        commander_id_param: commander.id,
        date_filter: dateFilter
      }
    );

    if (rpcError) {
      throw new Error(`RPC error: ${rpcError.message}`);
    }
    
    const weeklyStats = (rpcData as RpcWeeklyStat[]) || [];
    
    // Aggregate from weekly stats
    let totalEntries = 0;
    let topCuts = 0;
    let expectedTopCuts = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    
    for (const week of weeklyStats) {
      totalEntries += week.entries;
      topCuts += week.top_cuts;
      expectedTopCuts += week.expected_top_cuts || 0;
      wins += week.wins;
      draws += week.draws;
      losses += week.losses;
    }
    
    const totalGames = wins + draws + losses;
    const winRate = totalGames > 0 ? wins / totalGames : 0;
    const conversionRate = totalEntries > 0 ? topCuts / totalEntries : 0;
    const conversionScore = expectedTopCuts > 0 ? (topCuts / expectedTopCuts) * 100 : 100;
    
    // Format weekly trend data with meta share
    const trendData = weeklyStats
      .sort((a, b) => a.week_start.localeCompare(b.week_start))
      .map((week) => {
        const weekTotalGames = week.wins + week.draws + week.losses;
        const weekTotalEntries = week.week_total_entries || 1;
        const weekExpectedTopCuts = week.expected_top_cuts || 0;
        return {
          week_start: week.week_start,
          entries: week.entries,
          top_cuts: week.top_cuts,
          conversion_rate: week.entries > 0 ? week.top_cuts / week.entries : 0,
          conversion_score: weekExpectedTopCuts > 0 ? (week.top_cuts / weekExpectedTopCuts) * 100 : 100,
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
      .order("id", { ascending: false });
    
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
        conversion_score: conversionScore,
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
        decklist: e.decklist,
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
