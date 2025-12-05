import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";

interface RouteContext {
  params: Promise<{ name: string; commanderId: string }>;
}

export type TimePeriod = "1_month" | "3_months" | "6_months" | "1_year" | "all_time";

function getTimePeriodDays(period: TimePeriod): number | null {
  switch (period) {
    case "1_month":
      return 30;
    case "3_months":
      return 90;
    case "6_months":
      return 180;
    case "1_year":
      return 365;
    case "all_time":
      return null;
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { name: encodedName, commanderId } = await context.params;
    const cardName = decodeURIComponent(encodedName);
    const searchParams = request.nextUrl.searchParams;
    const timePeriod = (searchParams.get("timePeriod") as TimePeriod) ?? "3_months";
    
    const supabase = await createClient();
    
    // Get card
    const { data: card, error: cardError } = await supabase
      .from("cards")
      .select("*")
      .eq("name", cardName)
      .single();
    
    if (cardError || !card) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }
    
    // Get commander
    const { data: commander, error: commanderError } = await supabase
      .from("commanders")
      .select("*")
      .eq("id", parseInt(commanderId))
      .single();
    
    if (commanderError || !commander) {
      return NextResponse.json(
        { error: "Commander not found" },
        { status: 404 }
      );
    }
    
    // Calculate date filter
    const days = getTimePeriodDays(timePeriod);
    const dateFilter = days
      ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      : null;
    
    // Get weekly stats for this card/commander pair
    let query = supabase
      .from("card_commander_weekly_stats")
      .select("*")
      .eq("card_id", card.id)
      .eq("commander_id", commander.id)
      .order("week_start", { ascending: true });
    
    if (dateFilter) {
      query = query.gte("week_start", dateFilter);
    }
    
    const { data: weeklyStats, error: weeklyError } = await query;
    
    if (weeklyError) throw weeklyError;
    
    // Calculate aggregate stats
    let totalEntries = 0;
    let totalTopCuts = 0;
    let totalWins = 0;
    let totalDraws = 0;
    let totalLosses = 0;
    
    for (const week of weeklyStats || []) {
      totalEntries += week.entries;
      totalTopCuts += week.top_cuts;
      totalWins += week.wins;
      totalDraws += week.draws;
      totalLosses += week.losses;
    }
    
    const totalGames = totalWins + totalDraws + totalLosses;
    const winRate = totalGames > 0 ? totalWins / totalGames : 0;
    const conversionRate = totalEntries > 0 ? totalTopCuts / totalEntries : 0;
    
    // Get total commander entries to calculate play rate
    const { count: commanderEntries } = await supabase
      .from("entries")
      .select("*", { count: "exact", head: true })
      .eq("commander_id", commander.id);
    
    const playRate = commanderEntries ? totalEntries / commanderEntries : 0;
    
    // Format weekly trend data
    const trendData = (weeklyStats || []).map((week) => {
      const games = week.wins + week.draws + week.losses;
      return {
        week_start: week.week_start,
        entries: week.entries,
        top_cuts: week.top_cuts,
        wins: week.wins,
        draws: week.draws,
        losses: week.losses,
        win_rate: games > 0 ? week.wins / games : 0,
        conversion_rate: week.entries > 0 ? week.top_cuts / week.entries : 0,
      };
    });
    
    // Calculate popularity trend (entries over time)
    const popularityTrend = trendData.map((week) => ({
      week_start: week.week_start,
      entries: week.entries,
    }));
    
    return NextResponse.json({
      card: {
        id: card.id,
        name: card.name,
        oracle_id: card.oracle_id,
        type_line: card.type_line,
        mana_cost: card.mana_cost,
        cmc: card.cmc,
      },
      commander: {
        id: commander.id,
        name: commander.name,
        color_id: commander.color_id,
      },
      stats: {
        entries: totalEntries,
        top_cuts: totalTopCuts,
        wins: totalWins,
        draws: totalDraws,
        losses: totalLosses,
        play_rate: playRate,
        win_rate: winRate,
        conversion_rate: conversionRate,
      },
      trend: trendData,
      popularity_trend: popularityTrend,
    });
  } catch (error) {
    console.error("Error fetching card/commander stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch card/commander stats" },
      { status: 500 }
    );
  }
}

