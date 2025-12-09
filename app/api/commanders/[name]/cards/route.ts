import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { getTimePeriodDateOnly, type TimePeriod } from "@/lib/time-period";

interface RouteContext {
  params: Promise<{ name: string }>;
}

interface RpcCardStats {
  card_id: number;
  card_name: string;
  oracle_id: string | null;
  type_line: string | null;
  mana_cost: string | null;
  cmc: number | null;
  entries: number;
  top_cuts: number;
  expected_top_cuts: number;
  wins: number;
  draws: number;
  losses: number;
  commander_entries: number;
  commander_entries_with_decklists: number;
  commander_top_cuts: number;
  commander_expected_top_cuts: number;
  commander_wins: number;
  commander_draws: number;
  commander_losses: number;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { name: encodedName } = await context.params;
    const commanderName = decodeURIComponent(encodedName);
    const searchParams = request.nextUrl.searchParams;
    const timePeriod = (searchParams.get("timePeriod") as TimePeriod) ?? "6_months";
    
    // Note: minTournamentSize filter is not supported with pre-aggregated stats
    
    const supabase = await createClient();
    
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
    
    const commanderNames = commander.name.split(" / ").map((n: string) => n.trim().toLowerCase());
    
    const dateFilter = getTimePeriodDateOnly(timePeriod);
    
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'get_commander_card_stats',
      {
        commander_id_param: commander.id,
        date_filter: dateFilter
      }
    );

    if (rpcError) {
      throw new Error(`RPC error: ${rpcError.message}`);
    }

    const stats = rpcData as RpcCardStats[] | null;
    if (!stats || stats.length === 0) {
      return NextResponse.json({
        commander_id: commander.id,
        commander_name: commanderName,
        total_entries: 0,
        commander_win_rate: 0,
        commander_conversion_score: 100,
        cards: [],
      });
    }

    const firstRow = stats[0];
    const totalCommanderEntries = firstRow.commander_entries;
    const totalCommanderEntriesWithDecklists = firstRow.commander_entries_with_decklists;
    const commanderTopCuts = firstRow.commander_top_cuts;
    const commanderExpectedTopCuts = firstRow.commander_expected_top_cuts;
    const commanderWins = firstRow.commander_wins;
    const commanderDraws = firstRow.commander_draws;
    const commanderLosses = firstRow.commander_losses;

    const playRateDenominator = totalCommanderEntriesWithDecklists > 0 
      ? totalCommanderEntriesWithDecklists 
      : totalCommanderEntries;
    
    const commanderTotalGames = commanderWins + commanderDraws + commanderLosses;
    const commanderWinRate = commanderTotalGames > 0 ? commanderWins / commanderTotalGames : 0;
    const commanderConversionScore = commanderExpectedTopCuts > 0 
      ? (commanderTopCuts / commanderExpectedTopCuts) * 100 
      : 100;

    const cards = stats
      .filter(stat => !commanderNames.includes(stat.card_name.toLowerCase()))
      .map((stat) => {
        const totalGames = stat.wins + stat.draws + stat.losses;
        const winRate = totalGames > 0 ? stat.wins / totalGames : 0;
        const playRate = playRateDenominator > 0 ? stat.entries / playRateDenominator : 0;
        const conversionScore = stat.expected_top_cuts > 0 
          ? (stat.top_cuts / stat.expected_top_cuts) * 100 
          : 100;
        
        return {
          id: stat.card_id,
          name: stat.card_name,
          oracle_id: stat.oracle_id,
          type_line: stat.type_line,
          mana_cost: stat.mana_cost,
          cmc: stat.cmc,
          entries: stat.entries,
          top_cuts: stat.top_cuts,
          wins: stat.wins,
          draws: stat.draws,
          losses: stat.losses,
          play_rate: playRate,
          win_rate: winRate,
          win_rate_delta: winRate - commanderWinRate,
          conversion_rate: stat.entries > 0 ? stat.top_cuts / stat.entries : 0,
          conversion_score: conversionScore,
          conversion_score_delta: conversionScore - commanderConversionScore,
        };
      });
    
    cards.sort((a, b) => b.play_rate - a.play_rate);
    
    return NextResponse.json({
      commander_id: commander.id,
      commander_name: commanderName,
      total_entries: playRateDenominator,
      commander_win_rate: commanderWinRate,
      commander_conversion_score: commanderConversionScore,
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
