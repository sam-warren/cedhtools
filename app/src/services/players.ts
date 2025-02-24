'use server';

import type { Player, PlayerDetails } from "@/types/api/players";
import { mockPlayerData } from "@/lib/mock/players";

export async function getPlayers(): Promise<Player[]> {
  return Promise.resolve(mockPlayerData);
}

export async function getPlayerById(id: string): Promise<PlayerDetails | null> {
  const player = mockPlayerData.find(p => p.id === id);
  if (!player) return null;

  return Promise.resolve({
    ...player,
    stats: {
      tournamentWins: 3,
      top4s: 8,
      top10s: 15,
      top16s: 20,
      totalGames: 75,
      wins: player.wins,
      draws: player.draws,
      winRate: player.winRate,
      drawRate: player.drawRate,
      entries: { total: player.entries, uniquePlayers: 1 }
    },
    recentTournaments: [
      {
        id: "t123",
        name: "cEDH Weekly Championship",
        date: "2024-03-15",
        standing: 1,
        commander: "Kinnan, Bonder Prodigy"
      },
      {
        id: "t124",
        name: "March Madness cEDH",
        date: "2024-03-10",
        standing: 4,
        commander: "Kinnan, Bonder Prodigy"
      }
    ],
    commanderStats: [
      {
        name: "Kinnan, Bonder Prodigy",
        games: 15,
        winRate: 65.2
      },
      {
        name: "Najeela, the Blade-Blossom",
        games: 10,
        winRate: 58.7
      }
    ],
    performanceHistory: [
      { date: "2024-04", winRate: 48.5 },
      { date: "2024-05", winRate: 50.2 },
      { date: "2024-06", winRate: 51.8 },
      { date: "2024-07", winRate: 52.5 },
      { date: "2024-08", winRate: 53.2 },
      { date: "2024-09", winRate: 54.1 },
      { date: "2024-10", winRate: 55.0 },
      { date: "2024-11", winRate: 56.8 },
      { date: "2024-12", winRate: 57.5 },
      { date: "2025-01", winRate: 58.2 },
      { date: "2025-02", winRate: 61.5 },
      { date: "2025-03", winRate: 62.5 }
    ],
    matchups: {
      best: {
        name: "Najeela, the Blade-Blossom",
        winRate: 68.5,
        games: 12
      },
      worst: {
        name: "Kenrith, the Returned King",
        winRate: 32.4,
        games: 15
      }
    }
  });
} 