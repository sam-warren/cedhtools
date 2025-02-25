'use server';

import { mockCommanderData } from "@/lib/mock/commanders";
import type {
  Commander,
  CommanderDetails,
  CommanderMeta,
  CommanderStats,
  TopPilot,
  ChartDataPoint,
  PopularityDataPoint,
  WinRateBySeat,
  WinRateByCut,
  TopDecklist
} from "@/types/api/commanders";
import { createMockListFetcher, createRelatedItemsFetcher, withErrorHandling, withCache } from "./apiUtils";

export interface CardStats {
  name: string;
  winRate: number;
  metaShare: number;
}

export interface CardDistribution {
  name: string;
  metaShare: number;
}

const mockCommandersList: CommanderMeta[] = [
  {
    standing: 1,
    name: "Kraum, Ludevic's Opus / Tymna the Weaver",
    colorIdentity: "{W}{U}{B}{R}",
    winRate: 21.9,
    drawRate: 14.5,
    entries: 519,
    metaShare: 7.88
  },
  {
    standing: 2,
    name: "Thrasios, Triton Hero / Tymna the Weaver",
    colorIdentity: "{W}{U}{B}{G}",
    winRate: 22.8,
    drawRate: 14.9,
    entries: 393,
    metaShare: 5.96
  },
  {
    standing: 3,
    name: "Kinnan, Bonder Prodigy",
    colorIdentity: "{U}{G}",
    winRate: 21.5,
    drawRate: 13.2,
    entries: 287,
    metaShare: 4.36
  },
  {
    standing: 4,
    name: "Rograkhh, Son of Rohgahh / Silas Renn, Seeker Adept",
    colorIdentity: "{U}{B}{R}",
    winRate: 20.5,
    drawRate: 13.2,
    entries: 329,
    metaShare: 4.99
  },
  {
    standing: 5,
    name: "Sisay, Weatherlight Captain",
    colorIdentity: "{W}{U}{B}{R}{G}",
    winRate: 20.1,
    drawRate: 12.9,
    entries: 288,
    metaShare: 4.37
  },
  {
    standing: 6,
    name: "Magda, Brazen Outlaw",
    colorIdentity: "{R}",
    winRate: 19.8,
    drawRate: 12.6,
    entries: 163,
    metaShare: 2.47
  },
  {
    standing: 7,
    name: "Tivit, Seller of Secrets",
    colorIdentity: "{W}{U}{B}",
    winRate: 19.5,
    drawRate: 12.4,
    entries: 153,
    metaShare: 2.32
  },
  {
    standing: 8,
    name: "Yuriko, the Tiger's Shadow",
    colorIdentity: "{U}{B}",
    winRate: 19.2,
    drawRate: 12.1,
    entries: 138,
    metaShare: 2.09
  },
  {
    standing: 9,
    name: "Rograkhh, Son of Rohgahh / Thrasios, Triton Hero",
    colorIdentity: "{U}{R}{G}",
    winRate: 18.9,
    drawRate: 11.9,
    entries: 132,
    metaShare: 2.0
  },
  {
    standing: 10,
    name: "Najeela, the Blade-Blossom",
    colorIdentity: "{W}{U}{B}{R}{G}",
    winRate: 18.6,
    drawRate: 11.7,
    entries: 117,
    metaShare: 1.77
  },
  {
    standing: 11,
    name: "Kenrith, the Returned King",
    colorIdentity: "{W}{U}{B}{R}{G}",
    winRate: 18.3,
    drawRate: 11.5,
    entries: 106,
    metaShare: 1.61
  },
  {
    standing: 12,
    name: "Derevi, Empyrial Tactician",
    colorIdentity: "{W}{U}{G}",
    winRate: 18.0,
    drawRate: 11.3,
    entries: 88,
    metaShare: 1.33
  }
];

// Create a function to enhance a commander with additional details
const enhanceCommanderWithDetails = (commander: CommanderMeta): CommanderDetails => ({
  ...mockCommanderData,
  id: commander.standing.toString(),
  name: commander.name,
  colorIdentity: commander.colorIdentity,
  stats: {
    tournamentWins: mockCommanderData.stats.tournamentWins,
    top4s: mockCommanderData.stats.top4s,
    top10s: mockCommanderData.stats.top10s,
    top16s: mockCommanderData.stats.top16s,
    totalGames: mockCommanderData.stats.totalGames,
    wins: mockCommanderData.stats.wins,
    draws: mockCommanderData.stats.draws,
    winRate: commander.winRate,
    drawRate: commander.drawRate,
    entries: { total: commander.entries, uniquePlayers: Math.floor(commander.entries * 0.4) }
  }
});

// Create generators for related data
const generateCommanderStats = (commanderId: string): CommanderStats => {
  const stats = mockCommanderData.stats;
  return {
    tournamentWins: stats.tournamentWins,
    top4s: stats.top4s,
    top10s: stats.top10s,
    top16s: stats.top16s,
    totalGames: stats.totalGames,
    wins: stats.wins,
    draws: stats.draws,
    winRate: stats.winRate,
    drawRate: stats.drawRate,
    entries: stats.entries
  };
};

const generateCardStats = (commanderId: string, cardId: string): CardStats => ({
  name: "Basalt Monolith",
  winRate: mockCommanderData.stats.winRate,
  metaShare: 85
});

const generateCardDistribution = (commanderId: string, cardId: string): CardDistribution[] => ([
  { name: "Main Deck", metaShare: 85 },
  { name: "Sideboard", metaShare: 10 },
  { name: "Maybe Board", metaShare: 5 }
]);

// Create the service functions using the utility functions
export const getCommanders = async () => {
  // Use mockCommandersList as a fallback if mockCommanderData.commanders is undefined
  const commandersData = mockCommanderData.commanders || mockCommandersList;
  
  const listFetcher = await createMockListFetcher<CommanderMeta>(commandersData);
  const cachedFetcher = await withCache(listFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return errorHandledFetcher();
};

export const getCommanderById = async (id: string) => {
  const detailsFetcher = await createMockItemWithDetailsFetcher<CommanderMeta, CommanderDetails>(
    mockCommanderData.commanders,
    enhanceCommanderWithDetails,
    'id'
  );
  const cachedFetcher = await withCache(detailsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return errorHandledFetcher(id);
};

export const getCommanderStats = async (commanderId: string) => {
  const statsFetcher = await createRelatedItemsFetcher<CommanderStats, 'commanderId'>(
    'commanderId',
    generateCommanderStats
  );
  const cachedFetcher = await withCache(statsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return errorHandledFetcher(commanderId);
};

export const getCommanderMatchups = async (commanderId: string) => {
  const matchupsFetcher = await createRelatedItemsFetcher<Commander[], 'commanderId'>(
    'commanderId',
    () => mockCommanderData.matchups
  );
  const cachedFetcher = await withCache(matchupsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return errorHandledFetcher(commanderId);
};

export const getCommanderTopPilots = async (commanderId: string) => {
  const pilotsFetcher = await createRelatedItemsFetcher<TopPilot[], 'commanderId'>(
    'commanderId',
    () => mockCommanderData.topPilots
  );
  const cachedFetcher = await withCache(pilotsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return errorHandledFetcher(commanderId);
};

export const getCommanderWinRateHistory = async (commanderId: string) => {
  const historyFetcher = await createRelatedItemsFetcher<ChartDataPoint[], 'commanderId'>(
    'commanderId',
    () => mockCommanderData.winRateHistory
  );
  const cachedFetcher = await withCache(historyFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return errorHandledFetcher(commanderId);
};

export const getCommanderPopularityHistory = async (commanderId: string) => {
  const popularityFetcher = await createRelatedItemsFetcher<PopularityDataPoint[], 'commanderId'>(
    'commanderId',
    () => mockCommanderData.popularityHistory
  );
  const cachedFetcher = await withCache(popularityFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return errorHandledFetcher(commanderId);
};

export const getCommanderWinRateBySeat = async (commanderId: string) => {
  const seatFetcher = await createRelatedItemsFetcher<WinRateBySeat[], 'commanderId'>(
    'commanderId',
    () => mockCommanderData.winRateBySeat
  );
  const cachedFetcher = await withCache(seatFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return errorHandledFetcher(commanderId);
};

export const getCommanderWinRateByCut = async (commanderId: string) => {
  const cutFetcher = await createRelatedItemsFetcher<WinRateByCut[], 'commanderId'>(
    'commanderId',
    () => mockCommanderData.winRateByCut
  );
  const cachedFetcher = await withCache(cutFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return errorHandledFetcher(commanderId);
};

export const getCardStats = async (commanderId: string, cardId: string) => {
  const statsFetcher = await createRelatedItemsFetcher<CardStats, 'commanderId'>(
    'commanderId',
    (commanderId) => generateCardStats(commanderId, cardId)
  );
  const cachedFetcher = await withCache(statsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return errorHandledFetcher(commanderId);
};

export const getCardDistribution = async (commanderId: string, cardId: string) => {
  const distributionFetcher = await createRelatedItemsFetcher<CardDistribution[], 'commanderId'>(
    'commanderId',
    (commanderId) => generateCardDistribution(commanderId, cardId)
  );
  const cachedFetcher = await withCache(distributionFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return errorHandledFetcher(commanderId);
};

export const getCardWinRateHistory = async (commanderId: string, cardId: string) => {
  const historyFetcher = await createRelatedItemsFetcher<ChartDataPoint[], 'commanderId'>(
    'commanderId',
    () => mockCommanderData.cardWinRateHistory
  );
  const cachedFetcher = await withCache(historyFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return errorHandledFetcher(commanderId);
};

export const getCardPopularityHistory = async (commanderId: string, cardId: string) => {
  const popularityFetcher = await createRelatedItemsFetcher<PopularityDataPoint[], 'commanderId'>(
    'commanderId',
    () => mockCommanderData.cardPopularityHistory
  );
  const cachedFetcher = await withCache(popularityFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return errorHandledFetcher(commanderId);
};

export const getCommanderTopDecklists = async (commanderId: string) => {
  const relatedItemsFetcher = await createRelatedItemsFetcher<TopDecklist[], 'commanderId'>(
    'commanderId',
    () => mockCommanderData.topDecklists
  );
  
  const cachedFetcher = await withCache(relatedItemsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  
  return errorHandledFetcher(commanderId);
};