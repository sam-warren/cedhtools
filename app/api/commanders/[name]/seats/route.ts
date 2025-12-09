import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { getTimePeriodDateOnly, type TimePeriod } from "@/lib/utils/time-period";

interface RouteContext {
  params: Promise<{ name: string }>;
}

interface SeatAggregateRow {
  seat_position: number;
  games: number;
  wins: number;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { name: encodedName } = await context.params;
    const commanderName = decodeURIComponent(encodedName);
    const searchParams = request.nextUrl.searchParams;
    const timePeriod = (searchParams.get("timePeriod") as TimePeriod) ?? "6_months";
    
    const supabase = await createClient();
    
    const { data: commander, error: commanderError } = await supabase
      .from("commanders")
      .select("id")
      .eq("name", commanderName)
      .single();
    
    if (commanderError || !commander) {
      return NextResponse.json(
        { error: "Commander not found" },
        { status: 404 }
      );
    }
    
    const dateFilter = getTimePeriodDateOnly(timePeriod);
    
    // Fetch seat stats and commander win rate in parallel
    const [seatResult, commanderStatsResult] = await Promise.all([
      supabase.rpc('get_commander_seat_stats', { 
        commander_id_param: commander.id,
        date_filter: dateFilter
      }),
      supabase.rpc('get_commander_detail_stats', {
        commander_id_param: commander.id,
        date_filter: dateFilter
      })
    ]);
    
    if (seatResult.error) {
      throw new Error(`Seat RPC error: ${seatResult.error.message}`);
    }
    
    const aggregatedData = seatResult.data as SeatAggregateRow[] | null;
    
    const seatMap = new Map<number, { games: number; wins: number }>();
    for (const row of aggregatedData || []) {
      seatMap.set(row.seat_position, { 
        games: Number(row.games), 
        wins: Number(row.wins) 
      });
    }
    
    const seats = [1, 2, 3, 4].map((position) => {
      const stat = seatMap.get(position) || { games: 0, wins: 0 };
      return {
        seat: position,
        games: stat.games,
        wins: stat.wins,
        winRate: stat.games > 0 ? stat.wins / stat.games : 0,
      };
    });
    
    const totalGames = seats.reduce((sum, s) => sum + s.games, 0);
    
    // Calculate commander's actual win rate for the time period
    let commanderWinRate = 0.25; // Default to 25% if no data
    if (commanderStatsResult.data && Array.isArray(commanderStatsResult.data)) {
      const weeklyStats = commanderStatsResult.data as { wins: number; draws: number; losses: number }[];
      let totalWins = 0;
      let totalDraws = 0;
      let totalLosses = 0;
      
      for (const week of weeklyStats) {
        totalWins += Number(week.wins) || 0;
        totalDraws += Number(week.draws) || 0;
        totalLosses += Number(week.losses) || 0;
      }
      
      const totalCommanderGames = totalWins + totalDraws + totalLosses;
      if (totalCommanderGames > 0) {
        commanderWinRate = totalWins / totalCommanderGames;
      }
    }
    
    return NextResponse.json({
      commander_id: commander.id,
      commander_name: commanderName,
      total_games: totalGames,
      expected_win_rate: commanderWinRate,
      seats,
    });
  } catch (error) {
    console.error("Error fetching seat position stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch seat position stats" },
      { status: 500 }
    );
  }
}
