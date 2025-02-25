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
export const getCommanders = withErrorHandling(
  withCache(
    createMockListFetcher<CommanderMeta>(mockCommandersList)
  )
);

export const getCommanderById = withErrorHandling(
  withCache(
    (id: string): Promise<CommanderDetails | null> => {
      const commander = mockCommandersList.find(c => c.standing.toString() === id);
      if (!commander) return Promise.resolve(null);
      return Promise.resolve(enhanceCommanderWithDetails(commander));
    }
  )
);

export const getCommanderStats = withErrorHandling(
  withCache(
    (commanderId: string): Promise<CommanderStats> => {
      return Promise.resolve(generateCommanderStats(commanderId));
    }
  )
);

export const getCommanderMatchups = withErrorHandling(
  withCache(
    createRelatedItemsFetcher<CommanderDetails['matchups'], 'commanderId'>(
      'commanderId',
      () => mockCommanderData.matchups
    )
  )
);

export const getCommanderTopPilots = withErrorHandling(
  withCache(
    createRelatedItemsFetcher<TopPilot[], 'commanderId'>(
      'commanderId',
      () => mockCommanderData.topPilots
    )
  )
);

export const getCommanderWinRateHistory = withErrorHandling(
  withCache(
    createRelatedItemsFetcher<ChartDataPoint[], 'commanderId'>(
      'commanderId',
      () => mockCommanderData.charts.winRate
    )
  )
);

export const getCommanderPopularityHistory = withErrorHandling(
  withCache(
    createRelatedItemsFetcher<PopularityDataPoint[], 'commanderId'>(
      'commanderId',
      () => mockCommanderData.charts.popularity
    )
  )
);

export const getCommanderWinRateBySeat = withErrorHandling(
  withCache(
    createRelatedItemsFetcher<WinRateBySeat[], 'commanderId'>(
      'commanderId',
      () => mockCommanderData.charts.winRateBySeat
    )
  )
);

export const getCommanderWinRateByCut = withErrorHandling(
  withCache(
    createRelatedItemsFetcher<WinRateByCut[], 'commanderId'>(
      'commanderId',
      () => mockCommanderData.charts.winRateByCut
    )
  )
);

export const getCardStats = withErrorHandling(
  withCache(
    (commanderId: string, cardId: string): Promise<CardStats> => {
      return Promise.resolve(generateCardStats(commanderId, cardId));
    }
  )
);

export const getCardDistribution = withErrorHandling(
  withCache(
    (commanderId: string, cardId: string): Promise<CardDistribution[]> => {
      return Promise.resolve(generateCardDistribution(commanderId, cardId));
    }
  )
);

export const getCardWinRateHistory = withErrorHandling(
  withCache(
    createRelatedItemsFetcher<ChartDataPoint[], 'cardId'>(
      'cardId',
      () => mockCommanderData.charts.winRate
    )
  )
);

export const getCardPopularityHistory = withErrorHandling(
  withCache(
    createRelatedItemsFetcher<PopularityDataPoint[], 'cardId'>(
      'cardId',
      () => mockCommanderData.charts.popularity
    )
  )
);

export const getCommanderTopDecklists = withErrorHandling(
  withCache(
    createRelatedItemsFetcher<TopDecklist[], 'commanderId'>(
      'commanderId',
      () => mockCommanderData.topDecklists
    )
  )
);