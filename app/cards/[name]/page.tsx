import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { CardDetailClient } from "./card-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { CardDetail, CommanderWithCardStats } from "@/types/api";

interface PageProps {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  return {
    title: decodedName,
    description: `View tournament statistics for ${decodedName} across competitive EDH commanders.`,
  };
}

function CardDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-8 w-40 mb-6" />
        <div className="flex flex-col md:flex-row gap-8">
          <Skeleton className="w-64 aspect-[488/680] rounded-lg" />
          <div className="flex-1 space-y-6">
            <div>
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-5 w-48" />
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-3">
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-9 w-36" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function fetchCardDetail(cardName: string): Promise<CardDetail | null> {
  try {
    const supabase = await createClient();
    
    // Get card
    const { data: card, error: cardError } = await supabase
      .from("cards")
      .select("*")
      .eq("name", cardName)
      .single();
    
    if (cardError || !card) {
      return null;
    }
    
    // Get commanders this card is played in - paginate to avoid 1000-row limit
    interface CardCommanderStat {
      commander_id: number;
      entries: number;
      top_cuts: number;
      expected_top_cuts: number;
      wins: number;
      draws: number;
      losses: number;
      commander: {
        id: number;
        name: string;
        color_id: string;
      };
    }
    
    const allStats: CardCommanderStat[] = [];
    let offset = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from("card_commander_weekly_stats")
        .select(`
          commander_id,
          entries,
          top_cuts,
          expected_top_cuts,
          wins,
          draws,
          losses,
          commander:commanders!inner (
            id,
            name,
            color_id
          )
        `)
        .eq("card_id", card.id)
        .order("id", { ascending: true })
        .range(offset, offset + pageSize - 1);
      
      if (error) throw error;
      
      const page = data as unknown as CardCommanderStat[] | null;
      if (!page || page.length === 0) break;
      
      allStats.push(...page);
      offset += pageSize;
      
      if (page.length < pageSize) break;
    }
    
    // Aggregate stats by commander
    const commanderMap = new Map<number, {
      commander: {
        id: number;
        name: string;
        color_id: string;
      };
      entries: number;
      top_cuts: number;
      expected_top_cuts: number;
      wins: number;
      draws: number;
      losses: number;
    }>();
    
    for (const stat of allStats) {
      const commander = stat.commander;
      
      const existing = commanderMap.get(commander.id) || {
        commander,
        entries: 0,
        top_cuts: 0,
        expected_top_cuts: 0,
        wins: 0,
        draws: 0,
        losses: 0,
      };
      
      existing.entries += stat.entries;
      existing.top_cuts += stat.top_cuts;
      existing.expected_top_cuts += stat.expected_top_cuts || 0;
      existing.wins += stat.wins;
      existing.draws += stat.draws;
      existing.losses += stat.losses;
      
      commanderMap.set(commander.id, existing);
    }
    
    // Convert to array with calculated rates
    const commanders: CommanderWithCardStats[] = Array.from(commanderMap.values())
      .map((stat) => {
        const totalGames = stat.wins + stat.draws + stat.losses;
        const conversionScore = stat.expected_top_cuts > 0 
          ? (stat.top_cuts / stat.expected_top_cuts) * 100 
          : 100;
        return {
          id: stat.commander.id,
          name: stat.commander.name,
          color_id: stat.commander.color_id,
          entries: stat.entries,
          top_cuts: stat.top_cuts,
          wins: stat.wins,
          draws: stat.draws,
          losses: stat.losses,
          win_rate: totalGames > 0 ? stat.wins / totalGames : 0,
          conversion_rate: stat.entries > 0 ? stat.top_cuts / stat.entries : 0,
          conversion_score: conversionScore,
        };
      })
      .sort((a, b) => b.entries - a.entries);
    
    return {
      id: card.id,
      name: card.name,
      oracle_id: card.oracle_id,
      type_line: card.type_line,
      mana_cost: card.mana_cost,
      cmc: card.cmc,
      commanders,
    };
  } catch (error) {
    console.error("Error fetching card:", error);
    return null;
  }
}

async function CardPageContent({ cardName }: { cardName: string }) {
  const card = await fetchCardDetail(cardName);
  
  if (!card) {
    notFound();
  }
  
  return <CardDetailClient card={card} />;
}

export default async function CardPage({ params }: PageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  return (
    <Suspense fallback={<CardDetailSkeleton />}>
      <CardPageContent cardName={decodedName} />
    </Suspense>
  );
}
