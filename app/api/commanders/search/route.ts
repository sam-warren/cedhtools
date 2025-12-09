import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";

/**
 * Lightweight commander search endpoint for the deck analyzer combobox
 * Returns minimal data: id, name, color_id, entries
 */

interface CommanderSearchResult {
  id: number;
  name: string;
  color_id: string;
  entries: number;
}

interface RpcCommanderStats {
  commander_id: number;
  name: string;
  color_id: string;
  entries: number;
  top_cuts: number;
  expected_top_cuts: number;
  wins: number;
  draws: number;
  losses: number;
  total_meta_entries: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") ?? "";
    
    // Require at least 2 characters to search
    if (query.length < 2) {
      return NextResponse.json({ commanders: [] });
    }
    
    const supabase = await createClient();
    
    // Use the existing RPC function with search pattern
    // We'll use a 6-month window for relevance (showing active commanders)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const dateFilter = sixMonthsAgo.toISOString().split("T")[0];
    
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'get_commander_list_stats',
      { 
        date_filter: dateFilter,
        search_pattern: query
      }
    );

    if (rpcError) {
      throw new Error(`RPC error: ${rpcError.message}`);
    }

    const stats = rpcData as RpcCommanderStats[] | null;
    if (!stats || stats.length === 0) {
      return NextResponse.json({ commanders: [] });
    }

    // Sort by entries (popularity) and limit to 20 results
    const sortedStats = [...stats].sort((a, b) => b.entries - a.entries);
    const limitedStats = sortedStats.slice(0, 20);

    const commanders: CommanderSearchResult[] = limitedStats.map((s) => ({
      id: s.commander_id,
      name: s.name,
      color_id: s.color_id,
      entries: Number(s.entries),
    }));

    return NextResponse.json({ commanders });
  } catch (error) {
    console.error("Error searching commanders:", error);
    return NextResponse.json(
      { error: "Failed to search commanders" },
      { status: 500 }
    );
  }
}

