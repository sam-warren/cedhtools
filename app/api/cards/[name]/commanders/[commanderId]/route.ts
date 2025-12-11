import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { getTimePeriodDateOnly, type TimePeriod } from "@/lib/utils/time-period";

interface RouteContext {
  params: Promise<{ name: string; commanderId: string }>;
}

interface RpcWeeklyStat {
  week_start: string;
  entries: number;
  top_cuts: number;
  expected_top_cuts: number;
  wins: number;
  draws: number;
  losses: number;
  week_commander_entries: number;
  week_commander_entries_with_decklists: number;
  commander_total_entries: number;
  commander_total_entries_with_decklists: number;
  commander_total_wins: number;
  commander_total_draws: number;
  commander_total_losses: number;
  commander_total_top_cuts: number;
  commander_total_expected_top_cuts: number;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { name: encodedName, commanderId } = await context.params;
    const cardName = decodeURIComponent(encodedName);
    const searchParams = request.nextUrl.searchParams;
    const timePeriod = (searchParams.get("timePeriod") as TimePeriod) ?? "6_months";
    
    const supabase = await createClient();
    
    const { data: card, error: cardError } = await supabase
      .from("cards")
      .select("*")
      .eq("name", cardName)
      .single();
    
    if (cardError || !card) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }
    
    const { data: commander, error: commanderError } = await supabase
      .from("commanders")
      .select("*")
      .eq("id", parseInt(commanderId))
      .single();
    
    if (commanderError || !commander) {
      return NextResponse.json(
        { error: "Commander not found" },
        { status: 404 }
      );
    }
    
    const dateFilter = getTimePeriodDateOnly(timePeriod);
    
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'get_card_commander_detail_stats',
      {
        card_id_param: card.id,
        commander_id_param: commander.id,
        date_filter: dateFilter
      }
    );

    if (rpcError) {
      throw new Error(`RPC error: ${rpcError.message}`);
    }

    const weeklyStats = (rpcData as RpcWeeklyStat[]) || [];
    
    // Get commander totals from the first row
    let commanderWinRate = 0;
    let commanderConversionScore = 100;
    let playRateDenominator = 0;
    
    if (weeklyStats.length > 0) {
      const firstRow = weeklyStats[0];
      const commanderTotalWins = firstRow.commander_total_wins;
      const commanderTotalDraws = firstRow.commander_total_draws;
      const commanderTotalLosses = firstRow.commander_total_losses;
      const commanderTotalGames = commanderTotalWins + commanderTotalDraws + commanderTotalLosses;
      commanderWinRate = commanderTotalGames > 0 ? commanderTotalWins / commanderTotalGames : 0;
      
      // Calculate commander conversion score
      const commanderTotalTopCuts = firstRow.commander_total_top_cuts;
      const commanderTotalExpectedTopCuts = firstRow.commander_total_expected_top_cuts;
      commanderConversionScore = commanderTotalExpectedTopCuts > 0 
        ? (commanderTotalTopCuts / commanderTotalExpectedTopCuts) * 100 
        : 100;
      
      playRateDenominator = firstRow.commander_total_entries_with_decklists > 0
        ? firstRow.commander_total_entries_with_decklists
        : firstRow.commander_total_entries;
    }
    
    // Calculate aggregate stats
    let totalEntries = 0;
    let totalTopCuts = 0;
    let totalExpectedTopCuts = 0;
    let totalWins = 0;
    let totalDraws = 0;
    let totalLosses = 0;
    
    for (const week of weeklyStats) {
      totalEntries += week.entries;
      totalTopCuts += week.top_cuts;
      totalExpectedTopCuts += week.expected_top_cuts || 0;
      totalWins += week.wins;
      totalDraws += week.draws;
      totalLosses += week.losses;
    }
    
    const totalGames = totalWins + totalDraws + totalLosses;
    const winRate = totalGames > 0 ? totalWins / totalGames : 0;
    const conversionRate = totalEntries > 0 ? totalTopCuts / totalEntries : 0;
    const conversionScore = totalExpectedTopCuts > 0 ? (totalTopCuts / totalExpectedTopCuts) * 100 : 100;
    const playRate = playRateDenominator > 0 ? totalEntries / playRateDenominator : 0;
    
    // Format weekly trend data with play rate
    const trendData = weeklyStats.map((week) => {
      const games = week.wins + week.draws + week.losses;
      const weekExpectedTopCuts = week.expected_top_cuts || 0;
      const weekDenominator = week.week_commander_entries_with_decklists > 0
        ? week.week_commander_entries_with_decklists
        : week.week_commander_entries;
      const weekPlayRate = weekDenominator > 0 ? week.entries / weekDenominator : 0;
      
      return {
        week_start: week.week_start,
        entries: week.entries,
        commander_entries: weekDenominator,
        play_rate: weekPlayRate,
        top_cuts: week.top_cuts,
        wins: week.wins,
        draws: week.draws,
        losses: week.losses,
        win_rate: games > 0 ? week.wins / games : 0,
        conversion_rate: week.entries > 0 ? week.top_cuts / week.entries : 0,
        conversion_score: weekExpectedTopCuts > 0 ? (week.top_cuts / weekExpectedTopCuts) * 100 : 100,
      };
    });
    
    const playRateTrend = trendData.map((week) => ({
      week_start: week.week_start,
      play_rate: week.play_rate,
      entries: week.entries,
      commander_entries: week.commander_entries,
    }));
    
    return NextResponse.json({
      card: {
        id: card.id,
        name: card.name,
        oracle_id: card.oracle_id,
        type_line: card.type_line,
        mana_cost: card.mana_cost,
        cmc: card.cmc,
      },
      commander: {
        id: commander.id,
        name: commander.name,
        color_id: commander.color_id,
      },
      stats: {
        entries: totalEntries,
        top_cuts: totalTopCuts,
        wins: totalWins,
        draws: totalDraws,
        losses: totalLosses,
        play_rate: playRate,
        win_rate: winRate,
        conversion_rate: conversionRate,
        conversion_score: conversionScore,
      },
      commander_win_rate: commanderWinRate,
      commander_conversion_score: commanderConversionScore,
      trend: trendData,
      play_rate_trend: playRateTrend,
    });
  } catch (error) {
    console.error("Error fetching card/commander stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch card/commander stats" },
      { status: 500 }
    );
  }
}
