import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";

interface RouteContext {
  params: Promise<{ name: string }>;
}

interface GamePlayerData {
  seat_position: number;
  player_id: number;
  game: {
    winner_player_id: number | null;
    is_draw: boolean;
  };
  entry: {
    commander_id: number;
  } | null;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { name: encodedName } = await context.params;
    const commanderName = decodeURIComponent(encodedName);
    
    const supabase = await createClient();
    
    // Get commander
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
    
    // Query game_players directly with joins to get seat position data
    // Paginate to get all records
    const allGamePlayers: GamePlayerData[] = [];
    let offset = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from("game_players")
        .select(`
          seat_position,
          player_id,
          game:games!inner (
            winner_player_id,
            is_draw
          ),
          entry:entries!inner (
            commander_id
          )
        `)
        .eq("entry.commander_id", commander.id)
        .order("id", { ascending: true })
        .range(offset, offset + pageSize - 1);
      
      if (error) throw error;
      
      const page = data as GamePlayerData[] | null;
      if (!page || page.length === 0) break;
      
      allGamePlayers.push(...page);
      offset += pageSize;
      
      if (page.length < pageSize) break;
    }
    
    // Aggregate by seat position
    const seatMap = new Map<number, { games: number; wins: number }>();
    
    for (const gp of allGamePlayers) {
      if (!gp.entry || !gp.game) continue;
      
      const existing = seatMap.get(gp.seat_position) || { games: 0, wins: 0 };
      existing.games += 1;
      
      // Check if this player won
      if (!gp.game.is_draw && gp.game.winner_player_id === gp.player_id) {
        existing.wins += 1;
      }
      
      seatMap.set(gp.seat_position, existing);
    }
    
    // Convert to array for seats 1-4
    const seats = [1, 2, 3, 4].map((position) => {
      const stat = seatMap.get(position) || { games: 0, wins: 0 };
      return {
        seat: position,
        games: stat.games,
        wins: stat.wins,
        winRate: stat.games > 0 ? stat.wins / stat.games : 0,
      };
    });
    
    // Calculate total games
    const totalGames = seats.reduce((sum, s) => sum + s.games, 0);
    
    return NextResponse.json({
      commander_id: commander.id,
      commander_name: commanderName,
      total_games: totalGames,
      expected_win_rate: 0.25, // 25% for 4 players
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
