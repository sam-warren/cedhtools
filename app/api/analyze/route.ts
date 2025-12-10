import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { getTimePeriodDateOnly, type TimePeriod } from "@/lib/utils/time-period";

/**
 * POST /api/analyze
 * 
 * Analyzes a decklist against tournament data for a given commander.
 * 
 * Request body:
 * {
 *   commanderName: string,
 *   cards: string[],  // Array of card names from user's decklist
 *   timePeriod?: TimePeriod
 * }
 */

interface RpcCardStats {
  card_id: number;
  card_name: string;
  oracle_id: string | null;
  type_line: string | null;
  mana_cost: string | null;
  cmc: number | null;
  entries: number;
  top_cuts: number;
  expected_top_cuts: number;
  wins: number;
  draws: number;
  losses: number;
  commander_entries: number;
  commander_entries_with_decklists: number;
  commander_top_cuts: number;
  commander_expected_top_cuts: number;
  commander_wins: number;
  commander_draws: number;
  commander_losses: number;
}

interface CardWithAnalysis {
  id: number;
  name: string;
  oracle_id: string | null;
  type_line: string | null;
  mana_cost: string | null;
  cmc: number | null;
  entries: number;
  top_cuts: number;
  wins: number;
  draws: number;
  losses: number;
  play_rate: number;
  win_rate: number;
  win_rate_delta: number;
  conversion_score: number;
  conversion_score_delta: number;
  in_deck: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { commanderName, cards, timePeriod = "6_months" } = body as {
      commanderName: string;
      cards: string[];
      timePeriod?: TimePeriod;
    };

    if (!commanderName) {
      return NextResponse.json(
        { error: "Commander name is required" },
        { status: 400 }
      );
    }

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { error: "Card list is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get commander
    const { data: commander, error: commanderError } = await supabase
      .from("commanders")
      .select("id, name, color_id")
      .eq("name", commanderName)
      .single();

    if (commanderError || !commander) {
      return NextResponse.json(
        { error: "Commander not found" },
        { status: 404 }
      );
    }

    const commanderNames = commander.name.split(" / ").map((n: string) => n.trim().toLowerCase());
    const dateFilter = getTimePeriodDateOnly(timePeriod as TimePeriod);

    // Get card stats for this commander
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'get_commander_card_stats',
      {
        commander_id_param: commander.id,
        date_filter: dateFilter
      }
    );

    if (rpcError) {
      throw new Error(`RPC error: ${rpcError.message}`);
    }

    const stats = rpcData as RpcCardStats[] | null;
    
    // Calculate commander stats
    const firstRow = stats?.[0];
    const totalCommanderEntries = firstRow?.commander_entries || 0;
    const totalCommanderEntriesWithDecklists = firstRow?.commander_entries_with_decklists || 0;
    const commanderTopCuts = firstRow?.commander_top_cuts || 0;
    const commanderExpectedTopCuts = firstRow?.commander_expected_top_cuts || 0;
    const commanderWins = firstRow?.commander_wins || 0;
    const commanderDraws = firstRow?.commander_draws || 0;
    const commanderLosses = firstRow?.commander_losses || 0;

    const playRateDenominator = totalCommanderEntriesWithDecklists > 0 
      ? totalCommanderEntriesWithDecklists 
      : totalCommanderEntries;
    
    const commanderTotalGames = commanderWins + commanderDraws + commanderLosses;
    const commanderWinRate = commanderTotalGames > 0 ? commanderWins / commanderTotalGames : 0;
    const commanderConversionScore = commanderExpectedTopCuts > 0 
      ? (commanderTopCuts / commanderExpectedTopCuts) * 100 
      : 100;

    // Normalize user's card names for matching
    // Handle double-faced cards by extracting front face name
    const userCardNamesLower = new Set(
      cards.map(c => {
        const name = c.toLowerCase().trim();
        // Extract front face from "Front // Back" format
        const frontFace = name.split(' // ')[0].trim();
        return frontFace;
      })
    );

    // Also create a set with the full DFC names for exact matching
    const userCardNamesFull = new Set(
      cards.map(c => c.toLowerCase().trim())
    );

    // Helper to check if a card is in user's deck (handles DFCs)
    const isCardInDeck = (dbCardName: string): boolean => {
      const nameLower = dbCardName.toLowerCase();
      // Exact match
      if (userCardNamesFull.has(nameLower)) return true;
      // Front face match (for DFCs stored as "Front // Back" in DB)
      const frontFace = nameLower.split(' // ')[0].trim();
      if (userCardNamesLower.has(frontFace)) return true;
      // Check if user's card matches DB front face
      if (userCardNamesLower.has(nameLower)) return true;
      return false;
    };

    // Process all cards and mark which are in user's deck
    const allCards: CardWithAnalysis[] = (stats || [])
      .filter(stat => !commanderNames.includes(stat.card_name.toLowerCase()))
      .map((stat) => {
        const totalGames = stat.wins + stat.draws + stat.losses;
        const winRate = totalGames > 0 ? stat.wins / totalGames : 0;
        const playRate = playRateDenominator > 0 ? stat.entries / playRateDenominator : 0;
        const conversionScore = stat.expected_top_cuts > 0 
          ? (stat.top_cuts / stat.expected_top_cuts) * 100 
          : 100;
        
        return {
          id: stat.card_id,
          name: stat.card_name,
          oracle_id: stat.oracle_id,
          type_line: stat.type_line,
          mana_cost: stat.mana_cost,
          cmc: stat.cmc,
          entries: stat.entries,
          top_cuts: stat.top_cuts,
          wins: stat.wins,
          draws: stat.draws,
          losses: stat.losses,
          play_rate: playRate,
          win_rate: winRate,
          win_rate_delta: winRate - commanderWinRate,
          conversion_score: conversionScore,
          conversion_score_delta: conversionScore - commanderConversionScore,
          in_deck: isCardInDeck(stat.card_name),
        };
      });

    // Split into deck cards and missing cards
    // Note: DFC deduplication is handled at the database level in get_commander_card_stats
    const deckCards = allCards.filter(c => c.in_deck);
    const missingCards = allCards
      .filter(c => !c.in_deck)
      .sort((a, b) => b.play_rate - a.play_rate)
      .slice(0, 50); // Top 50 missing cards by play rate

    // Find cards in user's deck that aren't in our database
    // Build a set of known card names, including front faces of DFCs
    const knownCardNames = new Set<string>();
    for (const card of allCards) {
      const nameLower = card.name.toLowerCase();
      knownCardNames.add(nameLower);
      // Also add front face for DFCs
      const frontFace = nameLower.split(' // ')[0].trim();
      if (frontFace !== nameLower) {
        knownCardNames.add(frontFace);
      }
    }
    
    const unknownCards = cards.filter(c => {
      const nameLower = c.toLowerCase().trim();
      const frontFace = nameLower.split(' // ')[0].trim();
      // Check if it's the commander
      if (commanderNames.includes(nameLower) || commanderNames.includes(frontFace)) {
        return false;
      }
      // Check if it's in our known cards
      return !knownCardNames.has(nameLower) && !knownCardNames.has(frontFace);
    });

    // Calculate deck statistics
    const deckWithStats = deckCards.filter(c => c.entries >= 5);
    const avgPlayRate = deckWithStats.length > 0
      ? deckWithStats.reduce((sum, c) => sum + c.play_rate, 0) / deckWithStats.length
      : 0;
    const avgWinRateDelta = deckWithStats.length > 0
      ? deckWithStats.reduce((sum, c) => sum + c.win_rate_delta, 0) / deckWithStats.length
      : 0;
    const avgConversionDelta = deckWithStats.length > 0
      ? deckWithStats.reduce((sum, c) => sum + c.conversion_score_delta, 0) / deckWithStats.length
      : 0;

    // Identify potential cuts (low play rate, negative deltas)
    const potentialCuts = deckCards
      .filter(c => c.entries >= 5 && c.play_rate < 0.25 && c.win_rate_delta < 0)
      .sort((a, b) => a.play_rate - b.play_rate)
      .slice(0, 10);

    // Identify strong cards (high play rate, positive deltas)
    const strongCards = deckCards
      .filter(c => c.entries >= 5 && c.play_rate > 0.5 && c.win_rate_delta > 0.01)
      .sort((a, b) => b.win_rate_delta - a.win_rate_delta)
      .slice(0, 10);

    return NextResponse.json({
      commander: {
        id: commander.id,
        name: commander.name,
        color_id: commander.color_id,
        entries: totalCommanderEntries,
        entries_with_decklists: playRateDenominator,
        win_rate: commanderWinRate,
        conversion_score: commanderConversionScore,
        wins: commanderWins,
        draws: commanderDraws,
        losses: commanderLosses,
        top_cuts: commanderTopCuts,
      },
      deck_stats: {
        total_cards: cards.length,
        cards_with_data: deckCards.length,
        cards_without_data: unknownCards.length,
        avg_play_rate: avgPlayRate,
        avg_win_rate_delta: avgWinRateDelta,
        avg_conversion_delta: avgConversionDelta,
      },
      deck_cards: deckCards.sort((a, b) => b.play_rate - a.play_rate),
      missing_staples: missingCards.filter(c => c.play_rate > 0.5 && c.entries >= 10),
      potential_cuts: potentialCuts,
      strong_cards: strongCards,
      unknown_cards: unknownCards,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze decklist" },
      { status: 500 }
    );
  }
}
