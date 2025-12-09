import { Suspense } from "react";
import { CommanderBrowser } from "./commander-browser";
import { CommanderCardSkeleton } from "@/components/commander-card";
import { createClient } from "@/lib/db/server";
import { getTimePeriodDateFilter, type TimePeriod } from "@/lib/time-period";
import type { CommanderListItem, SortBy } from "@/types/api";

export const metadata = {
  title: "Commanders",
  description: "Browse cEDH commanders by conversion rate, popularity, and color identity.",
};

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

interface CommandersResponse {
  commanders: CommanderListItem[];
  total: number;
}

async function fetchInitialCommanders(): Promise<CommandersResponse | null> {
  try {
    const supabase = await createClient();
    const timePeriod: TimePeriod = "6_months";
    const sortBy: SortBy = "popularity";
    const limit = 100;
    const minEntries = 5;

    const dateFilter = getTimePeriodDateFilter(timePeriod);
    const dateFilterDate = dateFilter ? dateFilter.split("T")[0] : null;

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'get_commander_list_stats',
      { 
        date_filter: dateFilterDate,
        search_pattern: null
      }
    );

    if (rpcError) {
      console.error("Error fetching commanders:", rpcError);
      return null;
    }

    const stats = rpcData as RpcCommanderStats[] | null;
    if (!stats || stats.length === 0) {
      return { commanders: [], total: 0 };
    }

    const totalEntriesAll = stats[0]?.total_meta_entries || 0;

    const commandersWithStats: CommanderListItem[] = [];

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

    // Sort by default sort (popularity)
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

    const paginatedCommanders = commandersWithStats.slice(0, limit);

    return {
      commanders: paginatedCommanders,
      total: commandersWithStats.length,
    };
  } catch (error) {
    console.error("Error fetching initial commanders:", error);
    return null;
  }
}

async function CommandersPageContent() {
  const initialData = await fetchInitialCommanders();
  
  return (
    <CommanderBrowser initialData={initialData ?? undefined} />
  );
}

export default function CommandersPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-2xl mb-12">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-6">
          Commander Statistics
        </h1>
        <p className="text-lg text-muted-foreground">
          Browse cEDH commanders ranked by tournament performance. Filter by
          time period and sort by conversion rate, popularity, or win rate.
        </p>
      </div>

      <Suspense fallback={<CommanderBrowserSkeleton />}>
        <CommandersPageContent />
      </Suspense>
    </div>
  );
}

function CommanderBrowserSkeleton() {
  return (
    <div>
      {/* Filters skeleton */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="h-10 w-40 bg-muted rounded-md animate-pulse" />
        <div className="h-10 w-40 bg-muted rounded-md animate-pulse" />
        <div className="h-10 w-32 bg-muted rounded-md animate-pulse" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(12)].map((_, i) => (
          <CommanderCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
