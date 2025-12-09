import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { getTimePeriodDateFilter, type TimePeriod } from "@/lib/utils/time-period";

export type SortBy = "popularity" | "conversion" | "win_rate";

interface CommanderWithStats {
  id: number;
  name: string;
  color_id: string;
  entries: number;
  top_cuts: number;
  wins: number;
  draws: number;
  losses: number;
  conversion_rate: number;
  conversion_score: number;
  win_rate: number;
  meta_share: number;
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
    const supabase = await createClient();

    const limit = searchParams.has("limit")
      ? parseInt(searchParams.get("limit")!)
      : 50;
    const offset = searchParams.has("offset")
      ? parseInt(searchParams.get("offset")!)
      : 0;
    const sortBy = (searchParams.get("sortBy") as SortBy) ?? "popularity";
    const timePeriod = (searchParams.get("timePeriod") as TimePeriod) ?? "6_months";
    const minEntries = searchParams.has("minEntries")
      ? parseInt(searchParams.get("minEntries")!)
      : 5;
    const search = searchParams.get("search") ?? undefined;

    // Note: minTournamentSize filter is not supported with pre-aggregated stats
    // The parameter is accepted but not applied

    const dateFilter = getTimePeriodDateFilter(timePeriod);
    const dateFilterDate = dateFilter ? dateFilter.split("T")[0] : null;

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'get_commander_list_stats',
      { 
        date_filter: dateFilterDate,
        search_pattern: search || null
      }
    );

    if (rpcError) {
      throw new Error(`RPC error: ${rpcError.message}`);
    }

    const stats = rpcData as RpcCommanderStats[] | null;
    if (!stats || stats.length === 0) {
      return NextResponse.json({
        commanders: [],
        total: 0,
        totalEntries: 0,
      });
    }

    const totalEntriesAll = stats[0]?.total_meta_entries || 0;

    const commandersWithStats: CommanderWithStats[] = [];

    for (const commander of stats) {
      if (commander.entries < minEntries) continue;

      const totalGames = commander.wins + commander.draws + commander.losses;
      const winRate = totalGames > 0 ? commander.wins / totalGames : 0;
      const conversionRate = commander.entries > 0 ? commander.top_cuts / commander.entries : 0;
      const conversionScore = commander.expected_top_cuts > 0 
        ? (commander.top_cuts / commander.expected_top_cuts) * 100 
        : 100;
      const metaShare = totalEntriesAll > 0 ? commander.entries / totalEntriesAll : 0;

      commandersWithStats.push({
        id: commander.commander_id,
        name: commander.name,
        color_id: commander.color_id,
        entries: commander.entries,
        top_cuts: commander.top_cuts,
        wins: commander.wins,
        draws: commander.draws,
        losses: commander.losses,
        conversion_rate: conversionRate,
        conversion_score: conversionScore,
        win_rate: winRate,
        meta_share: metaShare,
      });
    }

    commandersWithStats.sort((a, b) => {
      switch (sortBy) {
        case "popularity":
          return b.entries - a.entries;
        case "conversion":
          return b.conversion_score - a.conversion_score;
        case "win_rate":
          return b.win_rate - a.win_rate;
        default:
          return b.entries - a.entries;
      }
    });

    const paginatedCommanders = commandersWithStats.slice(offset, offset + limit);

    return NextResponse.json({
      commanders: paginatedCommanders,
      total: commandersWithStats.length,
      totalEntries: totalEntriesAll,
    });
  } catch (error) {
    console.error("Error fetching commanders:", error);
    return NextResponse.json(
      { error: "Failed to fetch commanders" },
      { status: 500 }
    );
  }
}
