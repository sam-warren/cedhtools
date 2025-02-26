'use server';

import type {
  CardDistributionStats,
  CardStatInCommander,
  Commander,
  CommanderWinRateBySeat,
  CommanderWinRateByCut,
  CommanderListItem, 
  CommanderDetails, 
  CommanderStats, 
  CommanderMatchups,
  TopPlayer,
  TopDecklist,
  CardAnalysis
} from "@/types/entities/commanders";
import { TimeSeriesDataPoint } from "@/types/entities/common";
import { createMockListFetcher, withCache, withErrorHandling } from "../lib/utils/api-utils";

/**
 * MOCK DATA GENERATORS
 * These functions generate mock data for development and testing purposes.
 * In a production environment, these would be replaced with actual API calls.
 */

// Mock data for commanders
const mockCommandersList: Commander[] = [
  {
    id: "kinnan-bonder-prodigy",
    name: "Kinnan, Bonder Prodigy",
    colorIdentity: "{U}{G}",
    typeLine: "Legendary Creature — Human Druid",
    manaCost: "{G}{U}",
    cmc: 2,
    image: "https://cards.scryfall.io/normal/front/6/3/63cda4a0-0dff-4edb-ae67-a2b7e2971350.jpg",
    oracleText: "Nonland permanents you control have \"{T}: Add {C}.\"\n{4}{U}{G}: Look at the top five cards of your library. You may put a non-Human creature card from among them onto the battlefield. Put the rest on the bottom of your library in a random order.",
    commanderLegality: "legal"
  },
  {
    id: "najeela-blade-blossom",
    name: "Najeela, the Blade-Blossom",
    colorIdentity: "{W}{U}{B}{R}{G}",
    typeLine: "Legendary Creature — Human Warrior",
    manaCost: "{2}{R}",
    cmc: 3,
    image: "https://cards.scryfall.io/normal/front/2/c/2cb1d1da-6077-46b5-8c63-39882b8016f2.jpg",
    oracleText: "Whenever a Warrior attacks, you may create a 1/1 white Warrior creature token that's tapped and attacking.\n{W}{U}{B}{R}{G}: Until end of turn, creatures you control gain trample, lifelink, and vigilance. Untap them. After this phase, there is an additional combat phase.",
    commanderLegality: "legal"
  },
  {
    id: "kenrith-returned-king",
    name: "Kenrith, the Returned King",
    colorIdentity: "{W}{U}{B}{R}{G}",
    typeLine: "Legendary Creature — Human Noble",
    manaCost: "{4}{W}",
    cmc: 5,
    image: "https://cards.scryfall.io/normal/front/5/9/59ee8a95-a4db-4c5a-b1ce-a9f9c91f5927.jpg",
    oracleText: "{W}: Target player gains 5 life.\n{U}: Target player draws a card.\n{B}: Put a +1/+1 counter on target creature. That creature gains menace until end of turn.\n{R}: Target creature gains trample and haste until end of turn.\n{G}: Return target card from a graveyard to its owner's hand.",
    commanderLegality: "legal"
  }
];

/**
 * Enhances a commander with detailed information
 * @param commander - Basic commander information
 * @returns Complete CommanderDetails with stats, matchups, and card analysis
 */
const enhanceCommanderWithDetails = (commander: Commander): CommanderDetails => ({
  // Core data from commander
  id: commander.id,
  name: commander.name,
  colorIdentity: commander.colorIdentity,
  image: commander.image,
  typeLine: commander.typeLine,
  manaCost: commander.manaCost,
  cmc: commander.cmc,
  oracleText: commander.oracleText,
  commanderLegality: commander.commanderLegality,

  // Partner information if applicable
  partnerCommander: commander.partnerCommander,

  // Statistics
  stats: {
    id: commander.id,
    totalGames: 248,
    wins: 124,
    draws: 12,
    entries: {
      total: 54,
      uniquePlayers: 32
    },
    tournamentWins: 8,
    top4s: 16,
    top10s: 24,
    top16s: 32,
    winRate: 50.0,
    drawRate: 4.8,
    metaShare: 8.5
  },

  // Matchups
  matchups: {
    best: [
      {
        commander: { id: "najeela-blade-blossom", name: "Najeela, the Blade-Blossom" },
        winRate: 68.5,
        games: 28
      },
      {
        commander: { id: "urza-lord-high-artificer", name: "Urza, Lord High Artificer" },
        winRate: 62.3,
        games: 24
      }
    ],
    worst: [
      {
        commander: { id: "thrasios-tymna", name: "Thrasios, Triton Hero / Tymna the Weaver" },
        winRate: 32.1,
        games: 32
      },
      {
        commander: { id: "kraum-tymna", name: "Kraum, Ludevic's Opus / Tymna the Weaver" },
        winRate: 38.7,
        games: 26
      }
    ]
  },

  // Top players with this commander
  topPlayers: [
    {
      player: { id: "player1", name: "Player One" },
      winRate: 72.8,
      tournamentWins: 3,
      top16s: 5,
      games: 32
    },
    {
      player: { id: "player2", name: "Player Two" },
      winRate: 65.2,
      tournamentWins: 2,
      top16s: 4,
      games: 28
    }
  ],

  // Top decklists with this commander
  topDecklists: [
    {
      deck: { id: "deck1", name: "Top Kinnan Build" },
      player: { id: "player1", name: "Player One" },
      tournamentStanding: "1/64",
      winRate: 83.3,
      tournament: { id: "tournament1", name: "Summer Championship" }
    },
    {
      deck: { id: "deck2", name: "Fast Kinnan" },
      player: { id: "player3", name: "Player Three" },
      tournamentStanding: "2/32",
      winRate: 75.0
    }
  ],

  // Card analysis
  cardAnalysis: {
    cards: [
      {
        card: { id: "basalt-monolith", name: "Basalt Monolith" },
        inclusion: 95.2,
        winRate: 0.65,
        drawRate: 0.12
      },
      {
        card: { id: "dramatic-reversal", name: "Dramatic Reversal" },
        inclusion: 94.8,
        winRate: 0.67,
        drawRate: 0.10
      },
      {
        card: { id: "thassas-oracle", name: "Thassa's Oracle" },
        inclusion: 93.5,
        winRate: 0.63,
        drawRate: 0.15
      },
      {
        card: { id: "force-of-will", name: "Force of Will" },
        inclusion: 98.7,
        winRate: 0.69,
        drawRate: 0.11
      },
      {
        card: { id: "brainstorm", name: "Brainstorm" },
        inclusion: 97.5,
        winRate: 0.66,
        drawRate: 0.13
      }
    ]
  }
});

/**
 * Generates mock commander statistics
 * @param commanderId - ID of the commander
 * @returns Commander statistics with tournament and game performance data
 */
const generateMockCommanderStats = (commanderId: string): CommanderStats => {
  return {
    id: commanderId,
    totalGames: 248,
    wins: 124,
    draws: 12,
    entries: {
      total: 54,
      uniquePlayers: 32
    },
    tournamentWins: 8,
    top4s: 16,
    top10s: 24,
    top16s: 32,
    winRate: 50.0,
    drawRate: 4.8,
    metaShare: 8.5
  };
};

/**
 * Generates mock commander matchups
 * @param commanderId - ID of the commander
 * @returns Matchup data showing best and worst pairings
 */
const generateMockCommanderMatchups = (commanderId: string): CommanderMatchups => {
  return {
    best: [
      {
        commander: { id: "najeela-blade-blossom", name: "Najeela, the Blade-Blossom" },
        winRate: 68.5,
        games: 28
      },
      {
        commander: { id: "urza-lord-high-artificer", name: "Urza, Lord High Artificer" },
        winRate: 62.3,
        games: 24
      }
    ],
    worst: [
      {
        commander: { id: "thrasios-tymna", name: "Thrasios, Triton Hero / Tymna the Weaver" },
        winRate: 32.1,
        games: 32
      },
      {
        commander: { id: "kraum-tymna", name: "Kraum, Ludevic's Opus / Tymna the Weaver" },
        winRate: 38.7,
        games: 26
      }
    ]
  };
};

/**
 * Generates mock top players for a commander
 * @param commanderId - ID of the commander
 * @returns Array of top players with performance metrics
 */
const generateMockTopPlayers = (commanderId: string): TopPlayer[] => {
  return [
    {
      player: { id: "player1", name: "Player One" },
      winRate: 72.8,
      tournamentWins: 3,
      top16s: 5,
      games: 32
    },
    {
      player: { id: "player2", name: "Player Two" },
      winRate: 65.2,
      tournamentWins: 2,
      top16s: 4,
      games: 28
    },
    {
      player: { id: "player3", name: "Player Three" },
      winRate: 58.6,
      tournamentWins: 1,
      top16s: 3,
      games: 24
    }
  ];
};

/**
 * Generates mock top decklists for a commander
 * @param commanderId - ID of the commander
 * @returns Array of top decklists with performance metrics
 */
const generateMockTopDecklists = (commanderId: string): TopDecklist[] => {
  return [
    {
      deck: { id: "deck1", name: `Top ${commanderId.charAt(0).toUpperCase() + commanderId.slice(1)} Build` },
      player: { id: "player1", name: "Player One" },
      tournamentStanding: "1/64",
      winRate: 83.3,
      tournament: { id: "tournament1", name: "Summer Championship" }
    },
    {
      deck: { id: "deck2", name: `Fast ${commanderId.charAt(0).toUpperCase() + commanderId.slice(1)}` },
      player: { id: "player3", name: "Player Three" },
      tournamentStanding: "2/32",
      winRate: 75.0
    },
    {
      deck: { id: "deck3", name: `${commanderId.charAt(0).toUpperCase() + commanderId.slice(1)} Control` },
      player: { id: "player5", name: "Player Five" },
      tournamentStanding: "3/48",
      winRate: 68.2,
      tournament: { id: "tournament3", name: "Fall Open" }
    }
  ];
};

/**
 * Generate mock card analysis data for a commander
 * @param commanderId Commander ID to generate analysis for
 * @returns Card analysis with common cards played with this commander
 */
const generateMockCardAnalysis = (commanderId: string): CardAnalysis => {
  const staples = [
    { id: "basalt-monolith", name: "Basalt Monolith", inclusion: 95.2 },
    { id: "dramatic-reversal", name: "Dramatic Reversal", inclusion: 94.8 },
    { id: "thassas-oracle", name: "Thassa's Oracle", inclusion: 93.5 },
    { id: "force-of-will", name: "Force of Will", inclusion: 98.7 },
    { id: "brainstorm", name: "Brainstorm", inclusion: 97.5 }
  ];

  return {
    cards: staples.map(card => ({
      card: { id: card.id, name: card.name },
      inclusion: card.inclusion,
      winRate: Math.random() * 0.7,
      drawRate: Math.random() * 0.2
    }))
  };
};

/**
 * Generates time series data for commander metrics
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
 * These functions provide access to commander data throughout the application.
 * Each function follows a consistent pattern of creating a fetcher, adding caching,
 * and adding error handling before executing the request.
 */

/**
 * Get all commanders with basic stats for list views
 * Returns only the essential data needed for tables and lists
 */
export const getCommanders = async (): Promise<CommanderListItem[]> => {
  // In a real implementation, this would be an API call that
  // only returns the fields needed for the list view
  return mockCommandersList.map(commander => ({
    id: commander.id,
    name: commander.name,
    colorIdentity: commander.colorIdentity,
    image: commander.image,
    // Include partner info if available
    ...(commander.partnerCommander ? {
      partnerCommanderId: commander.partnerCommander.id,
      partnerCommanderName: commander.partnerCommander.name
    } : {}),
    // Basic stats
    winRate: Math.random() * 70 + 30, // Random win rate between 30-100%
    metaShare: Math.random() * 15,    // Random meta share between 0-15%
    totalGames: Math.floor(Math.random() * 500) + 50 // Random games between 50-550
  }));
};

/**
 * Retrieves detailed information about a specific commander
 * @param id - The ID of the commander to retrieve
 * @returns Promise resolving to a CommanderDetails entity with complete commander information
 */
export const getCommanderById = async (id: string): Promise<CommanderDetails> => {
  // In a real implementation, this would be an API call that fetches
  // the complete details for a specific commander
  const commander = mockCommandersList.find(c => c.id === id);
  if (!commander) {
    throw new Error(`Commander with id ${id} not found`);
  }
  
  return {
    // Core data
    id: commander.id,
    name: commander.name,
    colorIdentity: commander.colorIdentity,
    image: commander.image,
    typeLine: commander.typeLine,
    manaCost: commander.manaCost,
    cmc: commander.cmc,
    oracleText: commander.oracleText,
    commanderLegality: commander.commanderLegality,
    
    // Partner information if applicable
    partnerCommander: commander.partnerCommander,
    
    // Statistics
    stats: {
      id: commander.id,
      totalGames: 248,
      wins: 124,
      draws: 12,
      entries: {
        total: 54,
        uniquePlayers: 32
      },
      tournamentWins: 8,
      top4s: 16,
      top10s: 24,
      top16s: 32,
      winRate: 50.0,
      drawRate: 4.8,
      metaShare: 8.5
    },
    
    // Matchups
    matchups: {
      best: [
        {
          commander: { id: "najeela-blade-blossom", name: "Najeela, the Blade-Blossom" },
          winRate: 68.5,
          games: 28
        },
        {
          commander: { id: "urza-lord-high-artificer", name: "Urza, Lord High Artificer" },
          winRate: 62.3,
          games: 24
        }
      ],
      worst: [
        {
          commander: { id: "thrasios-tymna", name: "Thrasios, Triton Hero / Tymna the Weaver" },
          winRate: 32.1,
          games: 32
        },
        {
          commander: { id: "kraum-tymna", name: "Kraum, Ludevic's Opus / Tymna the Weaver" },
          winRate: 38.7,
          games: 26
        }
      ]
    },
    
    // Top players with this commander
    topPlayers: [
      {
        player: { id: "player1", name: "Player One" },
        winRate: 72.8,
        tournamentWins: 3,
        top16s: 5,
        games: 32
      },
      {
        player: { id: "player2", name: "Player Two" },
        winRate: 65.2,
        tournamentWins: 2,
        top16s: 4,
        games: 28
      }
    ],
    
    // Top decklists with this commander
    topDecklists: [
      {
        deck: { id: "deck1", name: `Top ${commander.name} Build` },
        player: { id: "player1", name: "Player One" },
        tournamentStanding: "1/64",
        winRate: 83.3,
        tournament: { id: "tournament1", name: "Summer Championship" }
      },
      {
        deck: { id: "deck2", name: `Fast ${commander.name}` },
        player: { id: "player3", name: "Player Three" },
        tournamentStanding: "2/32",
        winRate: 75.0
      }
    ],
    
    // Card analysis
    cardAnalysis: {
      cards: [
        {
          card: { id: "basalt-monolith", name: "Basalt Monolith" },
          inclusion: 95.2,
          winRate: 0.65,
          drawRate: 0.12
        },
        {
          card: { id: "dramatic-reversal", name: "Dramatic Reversal" },
          inclusion: 94.8,
          winRate: 0.67,
          drawRate: 0.10
        },
        {
          card: { id: "thassas-oracle", name: "Thassa's Oracle" },
          inclusion: 93.5,
          winRate: 0.63,
          drawRate: 0.15
        }
      ]
    }
  };
};

/**
 * Retrieves statistics for a specific commander
 * @param commanderId - The ID of the commander
 * @returns Promise resolving to a CommanderStats entity
 */
export const getCommanderStats = async (commanderId: string): Promise<CommanderStats> => {
  const statsFetcher = async (cmdId: string): Promise<CommanderStats> => {
    return generateMockCommanderStats(cmdId);
  };

  const cachedFetcher = await withCache(statsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(commanderId);
};

/**
 * Retrieves matchup information for a specific commander
 * @param commanderId - The ID of the commander
 * @returns Promise resolving to a CommanderMatchups entity
 */
export const getCommanderMatchups = async (commanderId: string): Promise<CommanderMatchups> => {
  const matchupsFetcher = async (cmdId: string): Promise<CommanderMatchups> => {
    return generateMockCommanderMatchups(cmdId);
  };

  const cachedFetcher = await withCache(matchupsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(commanderId);
};

/**
 * Retrieves top players for a specific commander
 * @param commanderId - The ID of the commander
 * @returns Promise resolving to an array of TopPlayer entities
 */
export const getCommanderTopPlayers = async (commanderId: string): Promise<TopPlayer[]> => {
  const playersFetcher = async (cmdId: string): Promise<TopPlayer[]> => {
    return generateMockTopPlayers(cmdId);
  };

  const cachedFetcher = await withCache(playersFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(commanderId);
};

/**
 * Retrieves historical win rate data for a specific commander
 * @param commanderId - The ID of the commander
 * @returns Promise resolving to time series data of win rates
 */
export const getCommanderWinRateHistory = async (commanderId: string): Promise<TimeSeriesDataPoint[]> => {
  const historyFetcher = async (cmdId: string): Promise<TimeSeriesDataPoint[]> => {
    return generateTimeSeriesData(90, 0.5, 0.15);
  };

  const cachedFetcher = await withCache(historyFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(commanderId);
};

/**
 * Retrieves historical popularity data for a specific commander
 * @param commanderId - The ID of the commander
 * @returns Promise resolving to time series data of popularity metrics
 */
export const getCommanderPopularityHistory = async (commanderId: string): Promise<TimeSeriesDataPoint[]> => {
  const historyFetcher = async (cmdId: string): Promise<TimeSeriesDataPoint[]> => {
    return generateTimeSeriesData(90, 0.1, 0.05);
  };

  const cachedFetcher = await withCache(historyFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(commanderId);
};

/**
 * Retrieves win rate by seat data for a specific commander
 * @param commanderId - The ID of the commander
 * @returns Promise resolving to win rate by seat data
 */
export const getCommanderWinRateBySeat = async (commanderId: string): Promise<CommanderWinRateBySeat[]> => {
  const seatStatsFetcher = async (cmdId: string): Promise<CommanderWinRateBySeat[]> => {
    return [
      { position: "1", winRate: 42.5 },
      { position: "2", winRate: 48.7 },
      { position: "3", winRate: 53.2 },
      { position: "4", winRate: 56.8 }
    ];
  };

  const cachedFetcher = await withCache(seatStatsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(commanderId);
};

/**
 * Retrieves win rate by tournament cut for a specific commander
 * @param commanderId - The ID of the commander
 * @returns Promise resolving to win rate by tournament cut data
 */
export const getCommanderWinRateByCut = async (commanderId: string): Promise<CommanderWinRateByCut[]> => {
  const cutStatsFetcher = async (cmdId: string): Promise<CommanderWinRateByCut[]> => {
    return [
      { cut: "Top 4", winRate: 68.5 },
      { cut: "Top 8", winRate: 62.3 },
      { cut: "Top 16", winRate: 58.7 },
      { cut: "Swiss", winRate: 54.2 }
    ];
  };

  const cachedFetcher = await withCache(cutStatsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(commanderId);
};

/**
 * Retrieves performance statistics for a specific card in a commander
 * @param commanderId - The ID of the commander
 * @param cardId - The ID of the card
 * @returns Promise resolving to card statistics in this commander
 */
export const getCardStats = async (commanderId: string, cardId: string): Promise<CardStatInCommander> => {
  const cardStatsFetcher = async (): Promise<CardStatInCommander> => {
    // In a real implementation, we'd fetch actual card stats
    // For mock purposes, we'll return fixed data
    return {
      name: `Card ${cardId}`,
      winRate: 55 + (Math.random() * 20 - 10),
      metaShare: 12 + (Math.random() * 16)
    };
  };

  const cachedFetcher = await withCache(cardStatsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher();
};

/**
 * Retrieves distribution of a card across different commanders
 * @param commanderId - The ID of the commander
 * @param cardId - The ID of the card
 * @returns Promise resolving to card distribution data
 */
export const getCardDistribution = async (commanderId: string, cardId: string): Promise<CardDistributionStats[]> => {
  const distributionFetcher = async (): Promise<CardDistributionStats[]> => {
    // In a real implementation, we'd fetch actual distribution data
    // For mock purposes, we'll return fixed data
    return Array.from({ length: 5 }, (_, i) => ({
      name: `Commander ${i}`,
      metaShare: 8 + (Math.random() * 20)
    }));
  };

  const cachedFetcher = await withCache(distributionFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher();
};

/**
 * Retrieves historical win rate data for a specific card in a commander
 * @param commanderId - The ID of the commander
 * @param cardId - The ID of the card
 * @returns Promise resolving to time series data of card win rates
 */
export const getCardWinRateHistory = async (commanderId: string, cardId: string): Promise<TimeSeriesDataPoint[]> => {
  const historyFetcher = async (): Promise<TimeSeriesDataPoint[]> => {
    return generateTimeSeriesData(90, 60, 10);
  };

  const cachedFetcher = await withCache(historyFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher();
};

/**
 * Retrieves historical inclusion data for a specific card in a commander
 * @param commanderId - The ID of the commander
 * @param cardId - The ID of the card
 * @returns Promise resolving to time series data of card inclusion rates
 */
export const getCardPopularityHistory = async (commanderId: string, cardId: string): Promise<TimeSeriesDataPoint[]> => {
  const historyFetcher = async (): Promise<TimeSeriesDataPoint[]> => {
    return generateTimeSeriesData(90, 30, 10);
  };

  const cachedFetcher = await withCache(historyFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher();
};

/**
 * Retrieves top decklists for a specific commander
 * @param commanderId - The ID of the commander
 * @returns Promise resolving to an array of TopDecklist entities
 */
export const getCommanderTopDecklists = async (commanderId: string): Promise<TopDecklist[]> => {
  const decklistsFetcher = async (cmdId: string): Promise<TopDecklist[]> => {
    return generateMockTopDecklists(cmdId);
  };

  const cachedFetcher = await withCache(decklistsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(commanderId);
};

/**
 * Retrieves card analysis for a specific commander
 * @param commanderId - The ID of the commander
 * @returns Promise resolving to a CardAnalysis entity with common cards played with this commander
 */
export const getCardAnalysis = async (commanderId: string): Promise<CardAnalysis> => {
  const analysisFetcher = async (cmdId: string): Promise<CardAnalysis> => {
    return generateMockCardAnalysis(cmdId);
  };

  const cachedFetcher = await withCache(analysisFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(commanderId);
};