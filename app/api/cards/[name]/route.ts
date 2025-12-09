import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";

interface RouteContext {
  params: Promise<{ name: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { name: encodedName } = await context.params;
    const name = decodeURIComponent(encodedName);
    
    const supabase = await createClient();
    
    // Get card
    const { data: card, error: cardError } = await supabase
      .from("cards")
      .select("*")
      .eq("name", name)
      .single();
    
    if (cardError || !card) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
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
    const commanders = Array.from(commanderMap.values())
      .map((stat) => {
        const totalGames = stat.wins + stat.draws + stat.losses;
        // Conversion score: (actual top cuts / expected top cuts) * 100
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
    
    return NextResponse.json({
      id: card.id,
      name: card.name,
      oracle_id: card.oracle_id,
      type_line: card.type_line,
      mana_cost: card.mana_cost,
      cmc: card.cmc,
      commanders,
    });
  } catch (error) {
    console.error("Error fetching card:", error);
    return NextResponse.json(
      { error: "Failed to fetch card" },
      { status: 500 }
    );
  }
}
