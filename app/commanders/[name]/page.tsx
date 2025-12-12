import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { getTimePeriodDateOnly, type TimePeriod } from "@/lib/utils/time-period";
import { CommanderDetail } from "@/components/commanders/commander-detail";
import { RecentEntries } from "@/components/commanders/recent-entries";
import { TopPlayersSection } from "@/components/commanders/top-players-section";
import { AnalyzeCTA } from "@/components/commanders/analyze-cta";
import { Skeleton } from "@/components/ui/skeleton";
import type { CommanderDetail as CommanderDetailType, EntryInfo } from "@/types/api";

interface PageProps {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  return {
    title: decodedName,
    description: `View tournament statistics, staple cards, and deck analysis for ${decodedName} in competitive EDH.`,
  };
}

interface RpcWeeklyStat {
  week_start: string;
  entries: number;
  top_cuts: number;
  expected_top_cuts: number;
  wins: number;
  draws: number;
  losses: number;
  week_total_entries: number;
}

async function fetchCommanderData(
  commanderName: string,
  timePeriod: TimePeriod = "6_months"
): Promise<{ commander: CommanderDetailType; entries: EntryInfo[] } | null> {
  try {
    const supabase = await createClient();
    
    const { data: commander, error: commanderError } = await supabase
      .from("commanders")
      .select("*")
      .eq("name", commanderName)
      .single();
    
    if (commanderError || !commander) {
      return null;
    }
    
    const dateFilter = getTimePeriodDateOnly(timePeriod);
    
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'get_commander_detail_stats',
      {
        commander_id_param: commander.id,
        date_filter: dateFilter
      }
    );

    if (rpcError) {
      throw new Error(`RPC error: ${rpcError.message}`);
    }
    
    const weeklyStats = (rpcData as RpcWeeklyStat[]) || [];
    
    // Aggregate from weekly stats
    let totalEntries = 0;
    let topCuts = 0;
    let expectedTopCuts = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    
    for (const week of weeklyStats) {
      totalEntries += week.entries;
      topCuts += week.top_cuts;
      expectedTopCuts += week.expected_top_cuts || 0;
      wins += week.wins;
      draws += week.draws;
      losses += week.losses;
    }
    
    const totalGames = wins + draws + losses;
    const winRate = totalGames > 0 ? wins / totalGames : 0;
    const conversionRate = totalEntries > 0 ? topCuts / totalEntries : 0;
    const conversionScore = expectedTopCuts > 0 ? (topCuts / expectedTopCuts) * 100 : 100;
    
    // Format weekly trend data with meta share
    const trendData = weeklyStats
      .sort((a, b) => a.week_start.localeCompare(b.week_start))
      .map((week) => {
        const weekTotalGames = week.wins + week.draws + week.losses;
        const weekTotalEntries = week.week_total_entries || 1;
        const weekExpectedTopCuts = week.expected_top_cuts || 0;
        return {
          week_start: week.week_start,
          entries: week.entries,
          top_cuts: week.top_cuts,
          conversion_rate: week.entries > 0 ? week.top_cuts / week.entries : 0,
          conversion_score: weekExpectedTopCuts > 0 ? (week.top_cuts / weekExpectedTopCuts) * 100 : 100,
          win_rate: weekTotalGames > 0 ? week.wins / weekTotalGames : 0,
          meta_share: week.entries / weekTotalEntries,
        };
      });
    
    // Get recent entries for display (limited to 20 most recent)
    const dateFilterISO = dateFilter ? `${dateFilter}T00:00:00.000Z` : null;
    
    let entriesQuery = supabase
      .from("entries")
      .select(`
        id,
        standing,
        wins_swiss,
        wins_bracket,
        losses_swiss,
        losses_bracket,
        draws,
        decklist,
        player:players (
          id,
          name,
          topdeck_id
        ),
        tournament:tournaments!inner (
          id,
          tid,
          name,
          tournament_date,
          size,
          top_cut
        )
      `)
      .eq("commander_id", commander.id)
      .order("id", { ascending: false });
    
    if (dateFilterISO) {
      entriesQuery = entriesQuery.gte("tournament.tournament_date", dateFilterISO);
    }
    
    const { data: entries, error: entriesError } = await entriesQuery.limit(20);
    
    if (entriesError) throw entriesError;
    
    const formattedEntries: EntryInfo[] = (entries || []).map((e) => ({
      id: e.id,
      standing: e.standing,
      wins_swiss: e.wins_swiss,
      wins_bracket: e.wins_bracket,
      losses_swiss: e.losses_swiss,
      losses_bracket: e.losses_bracket,
      draws: e.draws,
      decklist: e.decklist,
      player: Array.isArray(e.player) ? e.player[0] : e.player,
      tournament: Array.isArray(e.tournament) ? e.tournament[0] : e.tournament,
    }));
    
    return {
      commander: {
        id: commander.id,
        name: commander.name,
        color_id: commander.color_id,
        stats: {
          entries: totalEntries,
          top_cuts: topCuts,
          wins,
          draws,
          losses,
          conversion_rate: conversionRate,
          conversion_score: conversionScore,
          win_rate: winRate,
        },
        entries: formattedEntries,
        trend: trendData,
      },
      entries: formattedEntries,
    };
  } catch (error) {
    console.error("Error fetching commander:", error);
    return null;
  }
}

function CommanderDetailSkeleton() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8">
        <Skeleton className="w-48 aspect-[488/680] rounded-lg shrink-0" />
        <div className="flex-1 space-y-6">
          <Skeleton className="h-10 w-96" />
          <div className="flex gap-12">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cards section */}
      <div className="space-y-4 border-t pt-12">
        <Skeleton className="h-6 w-32" />
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>

      {/* Charts section */}
      <div className="border-t pt-12">
        <Skeleton className="h-6 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[220px] w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function CommanderPageContent({ commanderName }: { commanderName: string }) {
  const data = await fetchCommanderData(commanderName);
  
  if (!data) {
    notFound();
  }
  
  const { commander, entries } = data;
  
  return (
    <div className="space-y-16">
      {/* Client component for interactive parts (charts, filters, staple cards table) */}
      <CommanderDetail 
        commanderName={commanderName} 
        initialData={commander}
      />
      
      {/* Server component for recent entries */}
      <RecentEntries entries={entries} />
      
      {/* Client component for top players - uses context for time period */}
      <TopPlayersSection commanderName={commanderName} />
      
      {/* Server component for CTA */}
      <AnalyzeCTA 
        commanderName={commander.name} 
        commanderId={commander.id} 
        colorId={commander.color_id} 
      />
    </div>
  );
}

export default async function CommanderPage({ params }: PageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <Suspense fallback={<CommanderDetailSkeleton />}>
        <CommanderPageContent commanderName={decodedName} />
      </Suspense>
    </div>
  );
}
