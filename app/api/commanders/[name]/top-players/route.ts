import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { getTimePeriodDateOnly, type TimePeriod } from "@/lib/utils/time-period";

interface RouteContext {
  params: Promise<{ name: string }>;
}

interface RpcTopPlayerRow {
  player_id: number;
  player_name: string;
  topdeck_id: string | null;
  entries: number;
  games_played: number;
  wins: number;
  draws: number;
  losses: number;
  win_rate: number;
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
    
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'get_commander_top_players',
      {
        commander_id_param: commander.id,
        date_filter: dateFilter,
        player_limit: 5
      }
    );
    
    if (rpcError) {
      throw new Error(`RPC error: ${rpcError.message}`);
    }
    
    const topPlayers = (rpcData as RpcTopPlayerRow[] | null) ?? [];
    
    return NextResponse.json({
      commander_id: commander.id,
      commander_name: commanderName,
      top_players: topPlayers.map((player) => ({
        player_id: player.player_id,
        player_name: player.player_name,
        topdeck_id: player.topdeck_id,
        entries: Number(player.entries),
        games_played: Number(player.games_played),
        wins: Number(player.wins),
        draws: Number(player.draws),
        losses: Number(player.losses),
        win_rate: Number(player.win_rate),
      })),
    });
  } catch (error) {
    console.error("Error fetching top players:", error);
    return NextResponse.json(
      { error: "Failed to fetch top players" },
      { status: 500 }
    );
  }
}

