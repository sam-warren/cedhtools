'use server';

import type {
  Deck,
  DeckDetails,
  DeckStats,
  DeckComposition,
  DeckCardPerformance,
  DeckTournamentReference,
  DeckTournamentHistory
} from "@/types/entities/decks";
import { CardReference } from "@/types/entities/common";
import { TimeSeriesDataPoint } from "@/types/entities/common";
import { createMockListFetcher, withCache, withErrorHandling } from "../lib/utils/api-utils";


/**
 * MOCK DATA GENERATORS
 * These functions generate mock data for development and testing purposes.
 * In a production environment, these would be replaced with actual API calls.
 */

// Mock data for decks
const mockDecksList: Deck[] = [
  {
    id: "deck-1",
    name: "Kinnan Combo",
    createdAt: "2023-01-15",
    updatedAt: "2023-04-22",
    commander: { id: "kinnan-bonder-prodigy", name: "Kinnan, Bonder Prodigy" },
    colorIdentity: "UG",
    description: "Fast combo deck utilizing Kinnan's ability to generate infinite mana",
    source: {
      type: "moxfield",
      externalId: "moxfield-1234",
      url: "https://www.moxfield.com/decks/example1"
    }
  },
  {
    id: "deck-2",
    name: "Najeela Warriors",
    createdAt: "2023-02-10",
    updatedAt: "2023-05-05",
    commander: { id: "najeela-blade-blossom", name: "Najeela, the Blade-Blossom" },
    colorIdentity: "WUBRG",
    description: "Five-color warrior tribal with infinite combat steps"
  },
  {
    id: "deck-3",
    name: "Kenrith Midrange",
    createdAt: "2023-03-20",
    updatedAt: "2023-03-20",
    commander: { id: "kenrith-returned-king", name: "Kenrith, the Returned King" },
    colorIdentity: "WUBRG"
  }
];

/**
 * Enhances a deck with detailed information
 * @param deck - Basic deck information
 * @returns Complete DeckDetails with stats, composition, and card performance
 */
const enhanceDeckWithDetails = (deck: Deck): DeckDetails => ({
  // Core data from deck
  id: deck.id,
  name: deck.name,
  createdAt: deck.createdAt,
  updatedAt: deck.updatedAt,
  commander: deck.commander,
  colorIdentity: deck.colorIdentity,
  description: deck.description,
  source: deck.source,
  
  // Statistics
  stats: generateMockDeckStats(deck.id),
  
  // Composition
  composition: generateMockDeckComposition(deck.id),
  
  // Card performance
  cardPerformance: generateMockCardPerformance(deck.id),
  
  // Tournament references
  tournamentReferences: generateMockTournamentReferences(deck.id)
});

/**
 * Generates mock deck statistics
 * @param deckId - ID of the deck
 * @returns Deck statistics with tournament and game performance data
 */
const generateMockDeckStats = (deckId: string): DeckStats => {
  const wins = Math.floor(Math.random() * 30) + 15;
  const draws = Math.floor(Math.random() * 5);
  const losses = Math.floor(Math.random() * 20) + 10;
  const totalGames = wins + draws + losses;
  
  return {
    tournamentEntries: Math.floor(Math.random() * 10) + 5,
    tournamentWins: Math.floor(Math.random() * 3),
    totalGames,
    wins,
    draws,
    losses,
    winRate: (wins / totalGames) * 100,
    drawRate: (draws / totalGames) * 100,
    lossRate: (losses / totalGames) * 100
  };
};

/**
 * Generates mock deck composition
 * @param deckId - ID of the deck
 * @returns Deck composition with cards and type breakdown
 */
const generateMockDeckComposition = (deckId: string): DeckComposition => {
  // Generate mock commander(s)
  const commanderCards = [
    {
      card: mockDecksList.find(d => d.id === deckId)?.commander || 
            { id: "kinnan-bonder-prodigy", name: "Kinnan, Bonder Prodigy" },
      count: 1
    }
  ];
  
  // Generate main deck cards - in a real implementation, this would have actual cards
  const mainboardCards = Array.from({ length: 99 }, (_, i) => ({
    card: {
      id: `card-${i + 1}`,
      name: `Card ${i + 1}`
    } as CardReference,
    count: 1
  }));
  
  // Optional sideboard
  const sideboardCards = Array.from({ length: 5 }, (_, i) => ({
    card: {
      id: `sideboard-card-${i + 1}`,
      name: `Sideboard Card ${i + 1}`
    } as CardReference,
    count: 1
  }));
  
  return {
    commander: commanderCards,
    mainboard: mainboardCards,
    sideboard: sideboardCards,
    typeBreakdown: {
      creatures: 25,
      instants: 18,
      sorceries: 12,
      artifacts: 15,
      enchantments: 8,
      planeswalkers: 2,
      lands: 29
    }
  };
};

/**
 * Generates mock card performance data
 * @param deckId - ID of the deck
 * @returns Array of card performance data
 */
const generateMockCardPerformance = (deckId: string): DeckCardPerformance[] => {
  return Array.from({ length: 10 }, (_, i) => {
    const gamesPlayed = Math.floor(Math.random() * 50) + 20;
    const wins = Math.floor(gamesPlayed * (0.4 + Math.random() * 0.3));
    const draws = Math.floor(gamesPlayed * 0.05);
    const losses = gamesPlayed - wins - draws;
    const commanderWinRate = 50;
    const cardWinRate = (wins / gamesPlayed) * 100;
    
    return {
      card: {
        id: `key-card-${i + 1}`,
        name: `Key Card ${i + 1}`
      },
      wins,
      losses,
      draws,
      gamesPlayed,
      commanderWinRate,
      cardWinRate,
      winRateDiff: cardWinRate - commanderWinRate
    };
  });
};

/**
 * Generates mock tournament references
 * @param deckId - ID of the deck
 * @returns Array of tournament references
 */
const generateMockTournamentReferences = (deckId: string): DeckTournamentReference[] => {
  return Array.from({ length: 3 }, (_, i) => ({
    tournamentId: `tournament-${i + 1}`,
    playerId: `player-${i + 1}`,
    playerName: `Player ${i + 1}`,
    standingId: `standing-tournament-${i + 1}-${deckId}`
  }));
};

/**
 * Generates time series data for deck metrics
 * @param days - Number of days in the time series
 * @param base - Base value for the data points
 * @param variance - Maximum variance from the base value
 * @returns Array of TimeSeriesDataPoint for the specified time period
 */
const generateTimeSeriesData = (days: number, base: number, variance: number): TimeSeriesDataPoint[] => {
  const results: TimeSeriesDataPoint[] = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    results.push({
      timestamp: date.toISOString().split('T')[0],
      value: base + (Math.random() * variance * 2 - variance)
    });
  }

  return results.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
};

/**
 * API SERVICE FUNCTIONS
 * These functions provide access to deck data throughout the application.
 * Each function follows a consistent pattern of creating a fetcher, adding caching,
 * and adding error handling before executing the request.
 */

/**
 * Retrieves a list of all decks
 * @returns Promise resolving to an array of Deck entities
 */
export const getDecks = async (): Promise<Deck[]> => {
  const listFetcher = await createMockListFetcher<Deck>(mockDecksList);
  const cachedFetcher = await withCache(listFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher();
};

/**
 * Retrieves decks filtered by commander
 * @param commanderId - The ID of the commander to filter by
 * @returns Promise resolving to an array of Deck entities with the specified commander
 */
export const getDecksByCommander = async (commanderId: string): Promise<Deck[]> => {
  const decksFetcher = async (cmdId: string): Promise<Deck[]> => {
    return mockDecksList.filter(deck => deck.commander.id === cmdId);
  };
  
  const cachedFetcher = await withCache(decksFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(commanderId);
};

/**
 * Retrieves decks filtered by player
 * @param playerId - The ID of the player to filter by
 * @returns Promise resolving to an array of Deck entities used by the specified player
 */
export const getDecksByPlayer = async (playerId: string): Promise<Deck[]> => {
  const decksFetcher = async (pId: string): Promise<Deck[]> => {
    // In a real implementation, we'd query decks associated with this player
    // For mock purposes, we'll return a subset of the decks
    return mockDecksList.slice(0, 2);
  };
  
  const cachedFetcher = await withCache(decksFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(playerId);
};

/**
 * Retrieves detailed information about a specific deck
 * @param id - The ID of the deck to retrieve
 * @returns Promise resolving to a DeckDetails entity with complete deck information
 */
export const getDeckById = async (id: string): Promise<DeckDetails> => {
  const detailsFetcher = async (deckId: string): Promise<DeckDetails> => {
    const deck = mockDecksList.find(d => d.id === deckId);
    if (!deck) {
      throw new Error(`Deck with id ${deckId} not found`);
    }
    return enhanceDeckWithDetails(deck);
  };

  const cachedFetcher = await withCache(detailsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(id);
};

/**
 * Retrieves statistics for a specific deck
 * @param deckId - The ID of the deck
 * @returns Promise resolving to a DeckStats entity
 */
export const getDeckStats = async (deckId: string): Promise<DeckStats> => {
  const statsFetcher = async (dId: string): Promise<DeckStats> => {
    return generateMockDeckStats(dId);
  };
  
  const cachedFetcher = await withCache(statsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(deckId);
};

/**
 * Retrieves composition for a specific deck
 * @param deckId - The ID of the deck
 * @returns Promise resolving to a DeckComposition entity
 */
export const getDeckComposition = async (deckId: string): Promise<DeckComposition> => {
  const compositionFetcher = async (dId: string): Promise<DeckComposition> => {
    return generateMockDeckComposition(dId);
  };
  
  const cachedFetcher = await withCache(compositionFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(deckId);
};

/**
 * Retrieves historical win rate data for a specific deck
 * @param deckId - The ID of the deck
 * @returns Promise resolving to time series data of win rates
 */
export const getDeckWinRateHistory = async (deckId: string): Promise<TimeSeriesDataPoint[]> => {
  const historyFetcher = async (dId: string): Promise<TimeSeriesDataPoint[]> => {
    return generateTimeSeriesData(90, 60, 15);
  };
  
  const cachedFetcher = await withCache(historyFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(deckId);
};

/**
 * Retrieves historical popularity data for a specific deck
 * @param deckId - The ID of the deck
 * @returns Promise resolving to time series data of popularity metrics
 */
export const getDeckPopularityHistory = async (deckId: string): Promise<TimeSeriesDataPoint[]> => {
  const historyFetcher = async (dId: string): Promise<TimeSeriesDataPoint[]> => {
    return generateTimeSeriesData(90, 5, 2);
  };
  
  const cachedFetcher = await withCache(historyFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(deckId);
};

/**
 * Retrieves card performance data for a specific deck
 * @param deckId - The ID of the deck
 * @returns Promise resolving to an array of DeckCardPerformance entities
 */
export const getCardPerformanceInDeck = async (deckId: string): Promise<DeckCardPerformance[]> => {
  const performanceFetcher = async (dId: string): Promise<DeckCardPerformance[]> => {
    return generateMockCardPerformance(dId);
  };
  
  const cachedFetcher = await withCache(performanceFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(deckId);
};

/**
 * Retrieves tournament history for a specific deck
 * @param deckId - The ID of the deck
 * @returns Promise resolving to an array of DeckTournamentHistory entities
 */
export const getDeckTournamentHistory = async (deckId: string): Promise<DeckTournamentHistory[]> => {
  const historyFetcher = async (dId: string): Promise<DeckTournamentHistory[]> => {
    return Array.from({ length: 5 }, (_, i) => ({
      tournament: {
        id: `tournament-${i + 1}`,
        name: `Tournament ${i + 1}`,
        date: new Date(2023, i, 15).toISOString().split('T')[0],
        size: 32 + (i % 4) * 16
      },
      player: {
        id: `player-${i % 3 + 1}`,
        name: `Player ${i % 3 + 1}`
      },
      standing: i + 1,
      wins: 5 - i,
      losses: i,
      draws: i % 2,
      matchPoints: (5 - i) * 3 + (i % 2)
    }));
  };
  
  const cachedFetcher = await withCache(historyFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(deckId);
};
