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
    winRate: 24.96,
    drawRate: 10.0,
    entries: 382,
    metaShare: 5.8
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

export async function getCommanders(): Promise<CommanderMeta[]> {
  return Promise.resolve(mockCommandersList);
}

export async function getCommanderById(id: string): Promise<CommanderDetails | null> {
  const commander = mockCommandersList.find(c => c.standing.toString() === id);
  if (!commander) return null;

  return Promise.resolve({
    ...mockCommanderData,
    id,
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
}

export async function getCommanderStats(commanderId: string): Promise<CommanderStats> {
  const stats = mockCommanderData.stats;
  return Promise.resolve({
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
  });
}

export async function getCommanderMatchups(commanderId: string): Promise<CommanderDetails['matchups']> {
  return Promise.resolve(mockCommanderData.matchups);
}

export async function getCommanderTopPilots(commanderId: string): Promise<TopPilot[]> {
  return Promise.resolve(mockCommanderData.topPilots);
}

export async function getCommanderWinRateHistory(commanderId: string): Promise<ChartDataPoint[]> {
  return Promise.resolve(mockCommanderData.charts.winRate);
}

export async function getCommanderPopularityHistory(commanderId: string): Promise<PopularityDataPoint[]> {
  return Promise.resolve(mockCommanderData.charts.popularity);
}

export async function getCommanderWinRateBySeat(commanderId: string): Promise<WinRateBySeat[]> {
  return Promise.resolve(mockCommanderData.charts.winRateBySeat);
}

export async function getCommanderWinRateByCut(commanderId: string): Promise<WinRateByCut[]> {
  return Promise.resolve(mockCommanderData.charts.winRateByCut);
}

export async function getCardStats(commanderId: string, cardId: string): Promise<CardStats> {
  return Promise.resolve({
    name: "Basalt Monolith",
    winRate: mockCommanderData.stats.winRate,
    metaShare: 85
  });
}

export async function getCardDistribution(commanderId: string, cardId: string): Promise<CardDistribution[]> {
  return Promise.resolve([
    { name: "Main Deck", metaShare: 85 },
    { name: "Sideboard", metaShare: 10 },
    { name: "Maybe Board", metaShare: 5 }
  ]);
}

export async function getCardWinRateHistory(commanderId: string, cardId: string): Promise<ChartDataPoint[]> {
  return Promise.resolve(mockCommanderData.charts.winRate);
}

export async function getCardPopularityHistory(commanderId: string, cardId: string): Promise<PopularityDataPoint[]> {
  return Promise.resolve(mockCommanderData.charts.popularity);
} 

export async function getCommanderTopDecklists(commanderId: string): Promise<TopDecklist[]> {
  return Promise.resolve(mockCommanderData.topDecklists);
}