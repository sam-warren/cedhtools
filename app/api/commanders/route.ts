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
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
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
    const minTournamentSize = searchParams.has("minTournamentSize")
      ? parseInt(searchParams.get("minTournamentSize")!)
      : 0;
    const search = searchParams.get("search") ?? undefined;

    const dateFilter = getTimePeriodDate(timePeriod);

    // When tournament size filter is applied, we need to query raw entries
    // Otherwise, use pre-aggregated stats for performance
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
    
    let totalEntriesAll = 0;
    const pageSize = 1000;

    if (minTournamentSize > 0) {
      // Query raw entries with tournament size filter
      interface EntryData {
        commander_id: number;
        standing: number | null;
        wins_swiss: number;
        wins_bracket: number;
        losses_swiss: number;
        losses_bracket: number;
        draws: number;
        commander: {
          id: number;
          name: string;
          color_id: string;
        };
        tournament: {
          top_cut: number;
          size: number;
        };
      }

      let entryOffset = 0;
      
      while (true) {
        let query = supabase
          .from("entries")
          .select(`
            commander_id,
            standing,
            wins_swiss,
            wins_bracket,
            losses_swiss,
            losses_bracket,
            draws,
            commander:commanders!inner (
              id,
              name,
              color_id
            ),
            tournament:tournaments!inner (
              top_cut,
              size,
              tournament_date
            )
          `)
          .gte("tournament.size", minTournamentSize)
          .not("commander_id", "is", null)
          .order("id", { ascending: true })
          .range(entryOffset, entryOffset + pageSize - 1);
        
        if (dateFilter) {
          query = query.gte("tournament.tournament_date", dateFilter);
        }
        
        if (search) {
          query = query.ilike("commander.name", `%${search}%`);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        const entries = data as unknown as EntryData[] | null;
        if (!entries || entries.length === 0) break;
        
        for (const entry of entries) {
          const commander = entry.commander as { id: number; name: string; color_id: string };
          const tournament = entry.tournament as { top_cut: number; size: number };
          
          totalEntriesAll += 1;
          
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
          
          existing.entries += 1;
          existing.wins += entry.wins_swiss + entry.wins_bracket;
          existing.draws += entry.draws;
          existing.losses += entry.losses_swiss + entry.losses_bracket;
          
          // Check if made top cut
          if (entry.standing !== null && entry.standing <= tournament.top_cut) {
            existing.top_cuts += 1;
          }
          
          commanderMap.set(commander.id, existing);
        }
        
        entryOffset += pageSize;
        if (entries.length < pageSize) break;
      }
    } else {
      // Use pre-aggregated weekly stats (faster, no size filter)
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
      
      let statsOffset = 0;
      
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
          .order("id", { ascending: true })
          .range(statsOffset, statsOffset + pageSize - 1);
        
        if (dateFilter) {
          query = query.gte("week_start", dateFilter.split("T")[0]);
        }
        
        if (search) {
          query = query.ilike("commander.name", `%${search}%`);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        const stats = data as unknown as WeeklyStat[] | null;
        if (!stats || stats.length === 0) break;
        
        for (const stat of stats) {
          const commander = stat.commander as { id: number; name: string; color_id: string };
          
          totalEntriesAll += stat.entries;
          
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
        
        statsOffset += pageSize;
        if (stats.length < pageSize) break;
      }
    }

    // Calculate rates and filter by minimum entries
    const commandersWithStats: CommanderWithStats[] = [];

    for (const commander of commanderMap.values()) {
      if (commander.entries < minEntries) continue;

      const totalGames = commander.wins + commander.draws + commander.losses;
      const winRate = totalGames > 0 ? commander.wins / totalGames : 0;
      const conversionRate = commander.entries > 0 ? commander.top_cuts / commander.entries : 0;
      const metaShare = totalEntriesAll > 0 ? commander.entries / totalEntriesAll : 0;

      commandersWithStats.push({
        ...commander,
        conversion_rate: conversionRate,
        win_rate: winRate,
        meta_share: metaShare,
      });
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
