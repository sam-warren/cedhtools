'use server';

import type {
  Commander,
  CommanderDetails,
  CommanderStats,
  CommanderMatchups,
  TopPlayer,
  TopDecklist,
  CardAnalysis
} from "@/types/entities/commanders";
import { EntityReference, CommanderReference } from "@/types/entities/common";
import { createMockListFetcher, withErrorHandling, withCache } from "../lib/utils/api-utils";

export interface CardStats {
  name: string;
  winRate: number;
  metaShare: number;
}

export interface CardDistribution {
  name: string;
  metaShare: number;
}

// TypeScript type for chart data points (used in our API but not in entities)
interface ChartDataPoint {
  date: string;
  value: number;
}

interface WinRateBySeat {
  position: string;
  winRate: number;
}

interface WinRateByCut {
  cut: string;
  winRate: number;
}

// Mock data using the entity types
const mockCommandersList: Commander[] = [
  {
    id: "kraum-ludevics-opus-tymna-the-weaver",
    name: "Kraum, Ludevic's Opus / Tymna the Weaver",
    colorIdentity: "WUBR",
    typeLine: "Legendary Creature — Zombie Horror + Legendary Creature — Human Cleric",
    cmc: 7, // Combined CMC
    isCommander: true,
    commanderLegality: "legal",
    partnerCommander: {
      id: "tymna-the-weaver",
      name: "Tymna the Weaver",
      commanderLegality: "legal"
    }
  },
  {
    id: "najeela-blade-blossom",
    name: "Najeela, the Blade-Blossom",
    colorIdentity: "WUBRG",
    typeLine: "Legendary Creature — Human Warrior",
    cmc: 3,
    isCommander: true,
    commanderLegality: "legal"
  },
  {
    id: "kenrith-returned-king",
    name: "Kenrith, the Returned King",
    colorIdentity: "WUBRG",
    typeLine: "Legendary Creature — Human Noble",
    cmc: 5,
    isCommander: true,
    commanderLegality: "legal"
  },
  {
    id: "derevi-empyrial-tactician",
    name: "Derevi, Empyrial Tactician",
    colorIdentity: "WUG",
    typeLine: "Legendary Creature — Bird Wizard",
    cmc: 4,
    isCommander: true,
    commanderLegality: "legal"
  }
  // Additional commanders would go here
];

// Sample chart data for mock purposes
const mockWinRateHistory: ChartDataPoint[] = [
  { date: "2023-01", value: 22.1 },
  { date: "2023-02", value: 21.5 },
  { date: "2023-03", value: 22.8 },
  { date: "2023-04", value: 23.4 }
];

const mockPopularityHistory: ChartDataPoint[] = [
  { date: "2023-01", value: 7.2 },
  { date: "2023-02", value: 7.5 },
  { date: "2023-03", value: 8.1 },
  { date: "2023-04", value: 7.8 }
];

const mockWinRateBySeat: WinRateBySeat[] = [
  { position: "1", winRate: 24.5 },
  { position: "2", winRate: 22.3 },
  { position: "3", winRate: 21.1 },
  { position: "4", winRate: 19.8 }
];

const mockWinRateByCut: WinRateByCut[] = [
  { cut: "Pre-T8", winRate: 18.5 },
  { cut: "T8", winRate: 24.2 },
  { cut: "T4", winRate: 30.1 },
  { cut: "Finals", winRate: 45.8 }
];

// Create a function to enhance a commander with additional details
const enhanceCommanderWithDetails = (commander: Commander): CommanderDetails => ({
  // Core data
  id: commander.id,
  name: commander.name,
  colorIdentity: commander.colorIdentity,
  image: commander.image,
  typeLine: commander.typeLine,
  manaCost: commander.manaCost,
  cmc: commander.cmc,
  oracleText: commander.oracleText,
  isCommander: true,
  commanderLegality: commander.commanderLegality,
  
  // Partner information (if applicable)
  partnerCommander: commander.partnerCommander,
  
  // Statistics
  stats: {
    totalGames: 1000,
    wins: 220,
    draws: 150,
    entries: {
      total: 500,
      uniquePlayers: 450
    },
    tournamentWins: 40,
    top4s: 80,
    top10s: 150,
    top16s: 200,
    winRate: 22.0,
    drawRate: 15.0,
    metaShare: 7.5
  },
  
  // Relationships
  matchups: {
    best: [
      {
        commander: { id: "edric-spymaster-of-trest", name: "Edric, Spymaster of Trest" },
        winRate: 68.2,
        games: 47
      },
      {
        commander: { id: "kenrith-returned-king", name: "Kenrith, the Returned King" },
        winRate: 62.5,
        games: 32
      }
    ],
    worst: [
      {
        commander: { id: "najeela-blade-blossom", name: "Najeela, the Blade-Blossom" },
        winRate: 31.4,
        games: 51
      },
      {
        commander: { id: "thrasios-bruse-tarl", name: "Thrasios / Bruse Tarl" },
        winRate: 38.9,
        games: 36
      }
    ]
  },
  
  // Related entities
  topPlayers: [
    {
      player: { id: "player1", name: "PlayerOne" },
      winRate: 72.4,
      tournamentWins: 3,
      top16s: 7,
      games: 58
    },
    {
      player: { id: "player2", name: "PlayerTwo" },
      winRate: 68.1,
      tournamentWins: 2,
      top16s: 5,
      games: 47
    }
  ],
  topDecklists: [
    {
      deck: { id: "deck1", name: "Winning Kraum/Tymna" },
      player: { name: "WinnerPlayerName" },
      tournamentStanding: "1/32",
      winRate: 91.7,
      tournament: { id: "t1", name: "Quarterly Championship" }
    }
  ],
  
  // Card analysis
  cardAnalysis: {
    staples: [
      {
        card: { id: "force-of-will", name: "Force of Will" },
        inclusion: 98.7
      },
      {
        card: { id: "brainstorm", name: "Brainstorm" },
        inclusion: 97.5
      }
    ]
  }
});

// Update the getCommanders function to return entity types
export const getCommanders = async () => {
  const listFetcher = await createMockListFetcher<Commander>(mockCommandersList);
  const cachedFetcher = await withCache(listFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher();
};

// Update getCommanderById to use the proper entity types
export const getCommanderById = async (id: string) => {
  // Create mock detailsFetcher that returns entity-typed details
  const detailsFetcher = async (commanderId: string): Promise<CommanderDetails> => {
    const commander = mockCommandersList.find(cmd => cmd.id === commanderId);
    if (!commander) {
      throw new Error(`Commander with id ${commanderId} not found`);
    }
    return enhanceCommanderWithDetails(commander);
  };
  
  const cachedFetcher = await withCache(detailsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(id);
};

export const getCommanderStats = async (commanderId: string) => {
  const statsFetcher = async (cmdId: string): Promise<CommanderStats> => {
    const commander = mockCommandersList.find(cmd => cmd.id === cmdId);
    if (!commander) {
      throw new Error(`Commander with id ${cmdId} not found`);
    }
    
    // Mock stats since we don't have them in our commander objects
    return {
      totalGames: 1000,
      wins: 220,
      draws: 150,
      entries: {
        total: 500,
        uniquePlayers: 450
      },
      tournamentWins: 40,
      top4s: 80,
      top10s: 150,
      top16s: 200,
      winRate: 22.0,
      drawRate: 15.0,
      metaShare: 7.5
    };
  };
  
  const cachedFetcher = await withCache(statsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(commanderId);
};

export const getCommanderMatchups = async (commanderId: string) => {
  const matchupsFetcher = async (cmdId: string): Promise<CommanderMatchups> => {
    // This would come from backend API in real implementation
    return {
      best: [
        {
          commander: { id: "edric-spymaster-of-trest", name: "Edric, Spymaster of Trest" },
          winRate: 68.2,
          games: 47
        },
        {
          commander: { id: "kenrith-returned-king", name: "Kenrith, the Returned King" },
          winRate: 62.5,
          games: 32
        }
      ],
      worst: [
        {
          commander: { id: "najeela-blade-blossom", name: "Najeela, the Blade-Blossom" },
          winRate: 31.4,
          games: 51
        },
        {
          commander: { id: "thrasios-bruse-tarl", name: "Thrasios / Bruse Tarl" },
          winRate: 38.9,
          games: 36
        }
      ]
    };
  };
  
  const cachedFetcher = await withCache(matchupsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(commanderId);
};

export const getCommanderTopPlayers = async (commanderId: string) => {
  const playersFetcher = async (cmdId: string): Promise<TopPlayer[]> => {
    // This would come from backend API in real implementation
    return [
      {
        player: { id: "player1", name: "PlayerOne" },
        winRate: 72.4,
        tournamentWins: 3,
        top16s: 7,
        games: 58
      },
      {
        player: { id: "player2", name: "PlayerTwo" },
        winRate: 68.1,
        tournamentWins: 2,
        top16s: 5,
        games: 47
      }
    ];
  };
  
  const cachedFetcher = await withCache(playersFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(commanderId);
};

export const getCommanderWinRateHistory = async (commanderId: string) => {
  const historyFetcher = async (cmdId: string): Promise<ChartDataPoint[]> => {
    return mockWinRateHistory;
  };
  
  const cachedFetcher = await withCache(historyFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(commanderId);
};

export const getCommanderPopularityHistory = async (commanderId: string) => {
  const historyFetcher = async (cmdId: string): Promise<ChartDataPoint[]> => {
    return mockPopularityHistory;
  };
  
  const cachedFetcher = await withCache(historyFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(commanderId);
};

export const getCommanderWinRateBySeat = async (commanderId: string) => {
  const seatStatsFetcher = async (cmdId: string): Promise<WinRateBySeat[]> => {
    return mockWinRateBySeat;
  };
  
  const cachedFetcher = await withCache(seatStatsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(commanderId);
};

export const getCommanderWinRateByCut = async (commanderId: string) => {
  const cutStatsFetcher = async (cmdId: string): Promise<WinRateByCut[]> => {
    return mockWinRateByCut;
  };
  
  const cachedFetcher = await withCache(cutStatsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(commanderId);
};

export const getCardStats = async (commanderId: string, cardId: string) => {
  const cardStatsFetcher = async (): Promise<CardStats> => {
    return {
      name: "Force of Will",
      winRate: 23.5,
      metaShare: 95.8
    };
  };
  
  const cachedFetcher = await withCache(cardStatsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher();
};

export const getCardDistribution = async (commanderId: string, cardId: string) => {
  const distributionFetcher = async (): Promise<CardDistribution[]> => {
    return [
      { name: "Counterspell", metaShare: 82.3 },
      { name: "Pact of Negation", metaShare: 78.6 },
      { name: "Force of Negation", metaShare: 76.2 }
    ];
  };
  
  const cachedFetcher = await withCache(distributionFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher();
};

export const getCardWinRateHistory = async (commanderId: string, cardId: string) => {
  const historyFetcher = async (): Promise<ChartDataPoint[]> => {
    return mockWinRateHistory;
  };
  
  const cachedFetcher = await withCache(historyFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher();
};

export const getCardPopularityHistory = async (commanderId: string, cardId: string) => {
  const historyFetcher = async (): Promise<ChartDataPoint[]> => {
    return mockPopularityHistory;
  };
  
  const cachedFetcher = await withCache(historyFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher();
};

export const getCommanderTopDecklists = async (commanderId: string) => {
  const decklistsFetcher = async (cmdId: string): Promise<TopDecklist[]> => {
    // This would come from backend API in real implementation
    return [
      {
        deck: { id: "deck1", name: "Winning Kraum/Tymna" },
        player: { name: "WinnerPlayerName" },
        tournamentStanding: "1/32",
        winRate: 91.7,
        tournament: { id: "t1", name: "Quarterly Championship" }
      },
      {
        deck: { id: "deck2", name: "Runner-up Kraum/Tymna" },
        player: { name: "RunnerUpName" },
        tournamentStanding: "2/64",
        winRate: 85.3,
        tournament: { id: "t2", name: "Monthly Series" }
      }
    ];
  };
  
  const cachedFetcher = await withCache(decklistsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(commanderId);
};

export const getCardAnalysis = async (commanderId: string) => {
  const analysisFetcher = async (cmdId: string): Promise<CardAnalysis> => {
    // This would come from backend API in real implementation
    return {
      staples: [
        {
          card: { id: "force-of-will", name: "Force of Will" },
          inclusion: 98.7
        },
        {
          card: { id: "brainstorm", name: "Brainstorm" },
          inclusion: 97.5
        },
        {
          card: { id: "mana-crypt", name: "Mana Crypt" },
          inclusion: 96.2
        }
      ]
    };
  };
  
  const cachedFetcher = await withCache(analysisFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(commanderId);
};