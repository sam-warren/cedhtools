import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";

export type SortBy = "popularity" | "conversion" | "win_rate";
export type TimePeriod = "1_month" | "3_months" | "6_months" | "1_year" | "all_time";

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
  win_rate: number;
  meta_share: number;
}

function getTimePeriodDate(period: TimePeriod): string | null {
  const days = {
    "1_month": 30,
    "3_months": 90,
    "6_months": 180,
    "1_year": 365,
    "all_time": null,
  }[period];
  
  if (days === null) return null;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
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
    const timePeriod = (searchParams.get("timePeriod") as TimePeriod) ?? "3_months";
    const minEntries = searchParams.has("minEntries")
      ? parseInt(searchParams.get("minEntries")!)
      : 5;
    const colorId = searchParams.get("colorId") ?? undefined;
    const search = searchParams.get("search") ?? undefined;

    const dateFilter = getTimePeriodDate(timePeriod);

    // Use pre-aggregated weekly stats table - much more efficient
    // Paginate to get all stats (not limited by Supabase's 1000 default)
    interface WeeklyStat {
      commander_id: number;
      entries: number;
      top_cuts: number;
      wins: number;
      draws: number;
      losses: number;
      commander: {
        id: number;
        name: string;
        color_id: string;
      };
    }
    
    const allStats: WeeklyStat[] = [];
    let statsOffset = 0;
    const pageSize = 1000;
    
    while (true) {
      let query = supabase
        .from("commander_weekly_stats")
        .select(`
          commander_id,
          entries,
          top_cuts,
          wins,
          draws,
          losses,
          commander:commanders!inner (
            id,
            name,
            color_id
          )
        `)
        .range(statsOffset, statsOffset + pageSize - 1);
      
      // Apply date filter at the database level
      if (dateFilter) {
        query = query.gte("week_start", dateFilter);
      }
      
      // Apply color filter
      if (colorId) {
        query = query.eq("commander.color_id", colorId);
      }
      
      // Apply search filter
      if (search) {
        query = query.ilike("commander.name", `%${search}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const page = data as WeeklyStat[] | null;
      if (!page || page.length === 0) break;
      
      allStats.push(...page);
      statsOffset += pageSize;
      
      if (page.length < pageSize) break;
    }

    // Aggregate stats by commander
    const commanderMap = new Map<number, {
      id: number;
      name: string;
      color_id: string;
      entries: number;
      top_cuts: number;
      wins: number;
      draws: number;
      losses: number;
    }>();

    for (const stat of allStats) {
      const commander = stat.commander as { id: number; name: string; color_id: string };
      const existing = commanderMap.get(commander.id) || {
        id: commander.id,
        name: commander.name,
        color_id: commander.color_id,
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

      commanderMap.set(commander.id, existing);
    }

    // Calculate rates and filter by minimum entries
    const commandersWithStats: CommanderWithStats[] = [];
    let totalEntries = 0;

    for (const commander of commanderMap.values()) {
      if (commander.entries < minEntries) continue;

      const totalGames = commander.wins + commander.draws + commander.losses;
      const winRate = totalGames > 0 ? commander.wins / totalGames : 0;
      const conversionRate = commander.entries > 0 ? commander.top_cuts / commander.entries : 0;

      commandersWithStats.push({
        ...commander,
        conversion_rate: conversionRate,
        win_rate: winRate,
        meta_share: 0, // Will calculate after we have total
      });

      totalEntries += commander.entries;
    }

    // Calculate meta share
    for (const commander of commandersWithStats) {
      commander.meta_share = totalEntries > 0 ? commander.entries / totalEntries : 0;
    }

    // Sort commanders
    commandersWithStats.sort((a, b) => {
      switch (sortBy) {
        case "popularity":
          return b.entries - a.entries;
        case "conversion":
          return b.conversion_rate - a.conversion_rate;
        case "win_rate":
          return b.win_rate - a.win_rate;
        default:
          return b.entries - a.entries;
      }
    });

    // Apply pagination
    const paginatedCommanders = commandersWithStats.slice(offset, offset + limit);

    return NextResponse.json({
      commanders: paginatedCommanders,
      total: commandersWithStats.length,
      totalEntries,
    });
  } catch (error) {
    console.error("Error fetching commanders:", error);
    return NextResponse.json(
      { error: "Failed to fetch commanders" },
      { status: 500 }
    );
  }
}
