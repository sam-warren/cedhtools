'use server';

import { commanderData } from "@/lib/mock/commander-data";
import type { Commander, CommanderDetails, CommanderMeta } from "@/types/api/commanders";

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
  // In a real implementation, this would fetch from an API
  return Promise.resolve(mockCommandersList);
}

export async function getCommanderById(id: string): Promise<CommanderDetails | null> {
  // In a real implementation, this would fetch from an API
  // For now, we'll return mock data
  const commander = mockCommandersList.find(c => c.standing.toString() === id);
  if (!commander) return null;

  // Return the mock data with the correct commander name and color identity
  return Promise.resolve({
    ...commanderData,
    id,
    name: commander.name,
    colorIdentity: commander.colorIdentity,
    stats: {
      ...commanderData.stats,
      winRate: { current: commander.winRate, trend: 2.8 },
      drawRate: { current: commander.drawRate, trend: -1.5 },
      entries: { total: commander.entries, uniquePlayers: Math.floor(commander.entries * 0.4) }
    }
  });
} 