'use server';

import type { Player, PlayerDetails, PlayerStats, PlayerCommanderStats, PlayerTournamentDetail, PlayerMatchups } from "@/types/entities/players";
import { CommanderReference } from "@/types/entities/common";
import { withErrorHandling, withCache } from "../lib/utils/api-utils";

// Create a function to enhance a player with additional details
const enhancePlayerWithDetails = (player: Player): PlayerDetails => ({
  // Core data
  id: player.id,
  name: player.name,
  isRegistered: player.isRegistered,
  
  // Statistics
  stats: {
    tournamentWins: 3,
    top4s: 8,
    top10s: 15,
    top16s: 20,
    totalGames: 75,
    wins: 42,
    draws: 8,
    entries: 12,
    glickoRating: 1850,
    winRate: 56.0,
    drawRate: 10.7,
    consistencyRating: 73.4
  },
  
  // References to tournaments
  tournamentReferences: [
    {
      tournamentId: "t123",
      standingId: "s456",
      date: "2024-03-15",
      standing: 1,
      commanderId: "kinnan-bonder-prodigy"
    },
    {
      tournamentId: "t124",
      standingId: "s457",
      date: "2024-03-10",
      standing: 4,
      commanderId: "kinnan-bonder-prodigy"
    }
  ],
  
  // Stats for commanders played by this player
  commanderStats: [
    {
      commander: { 
        id: "kinnan-bonder-prodigy", 
        name: "Kinnan, Bonder Prodigy" 
      },
      games: 15,
      wins: 9,
      draws: 1,
      entries: 5,
      winRate: 60.0,
      drawRate: 6.7
    },
    {
      commander: { 
        id: "najeela-blade-blossom", 
        name: "Najeela, the Blade-Blossom" 
      },
      games: 10,
      wins: 6,
      draws: 1,
      entries: 3,
      winRate: 60.0,
      drawRate: 10.0
    }
  ],
  
  // Color preferences
  colorPreferences: [
    {
      colorIdentity: "UG",
      percentage: 45.3,
      winRate: 60.0,
      games: 34
    },
    {
      colorIdentity: "WUBRG",
      percentage: 30.7,
      winRate: 58.7,
      games: 23
    }
  ],
  
  // Matchup data
  matchups: {
    withCommanders: [
      {
        commander: { id: "kinnan-bonder-prodigy", name: "Kinnan, Bonder Prodigy" },
        games: 15,
        winRate: 60.0
      }
    ],
    againstCommanders: [
      {
        commander: { id: "najeela-blade-blossom", name: "Najeela, the Blade-Blossom" },
        games: 12,
        winRate: 68.5
      },
      {
        commander: { id: "kenrith-returned-king", name: "Kenrith, the Returned King" },
        games: 15,
        winRate: 32.4
      }
    ]
  }
});

// Mock data
const mockPlayersList: Player[] = [
  {
    id: "player1",
    name: "John Smith",
    isRegistered: true
  },
  {
    id: "player2",
    name: "Jane Doe",
    isRegistered: true
  },
  {
    id: "player3",
    name: "Bob Johnson",
    isRegistered: false
  }
];

// Create the service functions using the utility functions
export const getPlayers = async () => {
  const listFetcher = async (): Promise<Player[]> => {
    return mockPlayersList;
  };
  
  const cachedFetcher = await withCache(listFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher();
};

export const getPlayerById = async (id: string) => {
  const detailsFetcher = async (playerId: string): Promise<PlayerDetails> => {
    const player = mockPlayersList.find(p => p.id === playerId);
    if (!player) {
      throw new Error(`Player with id ${playerId} not found`);
    }
    return enhancePlayerWithDetails(player);
  };
  
  const cachedFetcher = await withCache(detailsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(id);
}; 