'use server';

import type { 
  Tournament, 
  TournamentDetails,
  TournamentStanding,
  TournamentCommanderBreakdown,
  TournamentColorBreakdown
} from "@/types/entities/tournaments";
import { withErrorHandling, withCache } from "../lib/utils/api-utils";

// Mock data for tournaments
const mockTournamentsList: Tournament[] = [
  {
    id: "t1",
    name: "Weekly cEDH Championship",
    date: "2024-03-15",
    size: 32,
    rounds: 5,
    topCut: "Top 8"
  },
  {
    id: "t2",
    name: "Monthly cEDH Series",
    date: "2024-03-01",
    size: 64,
    rounds: 6,
    topCut: "Top 8"
  },
  {
    id: "t3",
    name: "Quarterly Championship",
    date: "2024-02-15",
    size: 128,
    rounds: 7,
    topCut: "Top 16"
  }
];

// Create a function to enhance a tournament with additional details
const enhanceTournamentWithDetails = (tournament: Tournament): Partial<TournamentDetails> => {
  // Create a simplified version to avoid type conflicts
  return {
    // Core data
    id: tournament.id,
    name: tournament.name,
    date: tournament.date,
    size: tournament.size,
    rounds: tournament.rounds,
    topCut: tournament.topCut,
    
    // Statistics
    stats: {
      playerCount: tournament.size,
      registeredPlayerCount: Math.floor(tournament.size * 0.8),
      commanderCount: Math.floor(tournament.size * 0.6),
      totalGames: tournament.size - 1 + Math.floor(tournament.size / 4),
      completedGames: tournament.size - 1,
      draws: Math.floor(tournament.size / 4),
      drawRate: Math.floor(tournament.size / 4) / (tournament.size - 1 + Math.floor(tournament.size / 4)),
      averageGamesPerPlayer: (tournament.size - 1 + Math.floor(tournament.size / 4)) / tournament.size
    },
    
    // Relationships
    standings: [
      {
        id: "s1",
        position: 1,
        player: {
          id: "player1",
          name: "John Smith"
        },
        points: 15,
        wins: 5,
        draws: 0,
        losses: 0,
        gamesPlayed: 5,
        commander: {
          id: "kinnan-bonder-prodigy",
          name: "Kinnan, Bonder Prodigy"
        },
        opponentWinPercentage: 68.5
      },
      {
        id: "s2",
        position: 2,
        player: {
          id: "player2",
          name: "Jane Doe"
        },
        points: 12,
        wins: 4,
        draws: 0,
        losses: 1,
        gamesPlayed: 5,
        commander: {
          id: "najeela-blade-blossom",
          name: "Najeela, the Blade-Blossom"
        },
        opponentWinPercentage: 65.2
      }
    ],
    
    // Analysis
    commanderBreakdown: {
      commanders: [
        {
          commander: { 
            id: "kinnan-bonder-prodigy", 
            name: "Kinnan, Bonder Prodigy" 
          },
          count: 8
        },
        {
          commander: { 
            id: "najeela-blade-blossom", 
            name: "Najeela, the Blade-Blossom" 
          },
          count: 6
        }
      ]
    },
    
    colorBreakdown: {
      colors: [
        {
          color: "U",
          count: 24
        },
        {
          color: "G",
          count: 22
        },
        {
          color: "B",
          count: 18
        },
        {
          color: "R",
          count: 16
        },
        {
          color: "W",
          count: 12
        }
      ]
    }
  } as TournamentDetails;
};

// Create the service functions
export const getTournaments = async () => {
  const listFetcher = async (): Promise<Tournament[]> => {
    return mockTournamentsList;
  };
  
  const cachedFetcher = await withCache(listFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher();
};

export const getTournamentById = async (id: string) => {
  const detailsFetcher = async (tournamentId: string): Promise<TournamentDetails> => {
    const tournament = mockTournamentsList.find(t => t.id === tournamentId);
    if (!tournament) {
      throw new Error(`Tournament with id ${tournamentId} not found`);
    }
    return enhanceTournamentWithDetails(tournament) as TournamentDetails;
  };
  
  const cachedFetcher = await withCache(detailsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(id);
}; 