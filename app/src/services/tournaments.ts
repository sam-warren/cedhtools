'use server';

import type {
  Tournament,
  TournamentDetails,
  TournamentStats,
  TournamentStanding,
  TournamentRound,
  TournamentCommanderBreakdown,
  TournamentColorBreakdown,
  TournamentStandingWithTournament
} from "@/types/entities/tournaments";
import { TimeSeriesDataPoint } from "@/types/entities/common";
import { createMockListFetcher, withCache, withErrorHandling } from "../lib/utils/api-utils";

/**
 * MOCK DATA GENERATORS
 * These functions generate mock data for development and testing purposes.
 * In a production environment, these would be replaced with actual API calls.
 */

// Mock data for tournaments
const mockTournamentsList: Tournament[] = Array.from({ length: 10 }, (_, i) => ({
  id: `tournament-${i + 1}`,
  name: `Tournament ${i + 1}`,
  date: new Date(2023, i % 12, Math.floor(i / 2) + 1).toISOString().split('T')[0],
  size: 32 + (i % 4) * 16,
  rounds: 5 + (i % 3),
  topCut: i % 3 === 0 ? "Top 8" : i % 3 === 1 ? "Top 4" : "None"
}));

/**
 * Enhances a tournament with detailed information
 * @param tournament - Basic tournament information
 * @returns Complete TournamentDetails with stats, standings, and round information
 */
const enhanceTournamentWithDetails = (tournament: Tournament): TournamentDetails => ({
  // Core data from tournament
  id: tournament.id,
  name: tournament.name,
  date: tournament.date,
  size: tournament.size,
  rounds: tournament.rounds,
  topCut: tournament.topCut,
  
  // Additional details
  stats: generateMockTournamentStats(tournament.id),
  standings: generateMockTournamentStandings(tournament.id),
  roundsData: generateMockTournamentRounds(tournament.id),
  commanderBreakdown: generateMockCommanderBreakdown(tournament.id),
  colorBreakdown: generateMockColorBreakdown(tournament.id)
});

/**
 * Generates mock tournament statistics
 * @param tournamentId - ID of the tournament
 * @returns Tournament statistics with player counts and game metrics
 */
const generateMockTournamentStats = (tournamentId: string): TournamentStats => {
  const tournamentIndex = parseInt(tournamentId.split('-')[1], 10) - 1;
  const size = mockTournamentsList[tournamentIndex].size;
  
  return {
    playerCount: size,
    registeredPlayerCount: size + Math.floor(Math.random() * 10),
    commanderCount: Math.floor(size * 0.6),
    totalGames: size * 3,
    completedGames: size * 3 - Math.floor(Math.random() * 5),
    draws: Math.floor(Math.random() * 5),
    drawRate: Math.random() * 0.1,
    averageGamesPerPlayer: 3.0 + Math.random()
  };
};

/**
 * Generates mock tournament standings
 * @param tournamentId - ID of the tournament
 * @returns Array of tournament standings with player positions and scores
 */
const generateMockTournamentStandings = (tournamentId: string): TournamentStanding[] => {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `standing-${tournamentId}-${i + 1}`,
    position: i + 1,
    player: { id: `player-${i + 1}`, name: `Player ${i + 1}` },
    deck: { id: `deck-${i + 1}`, name: `Deck ${i + 1}` },
    commander: { id: `commander-${i + 1}`, name: `Commander ${i + 1}` },
    points: 15 - i,
    wins: 5 - Math.floor(i / 2),
    losses: Math.floor(i / 2),
    draws: i % 2,
    gamesPlayed: 5,
    opponentWinPercentage: 60 - i * 2
  }));
};

/**
 * Generates mock tournament rounds
 * @param tournamentId - ID of the tournament
 * @returns Array of tournament rounds with tables and matches
 */
const generateMockTournamentRounds = (tournamentId: string): TournamentRound[] => {
  const tournamentIndex = parseInt(tournamentId.split('-')[1], 10) - 1;
  const rounds = mockTournamentsList[tournamentIndex].rounds;
  
  return Array.from({ length: rounds }, (_, i) => ({
    roundNumber: i + 1,
    roundLabel: `Round ${i + 1}${i + 1 === rounds ? " (Final)" : ""}`,
    drawCount: i % 3,
    tables: Array.from({ length: 4 }, (_, j) => ({
      tableNumber: j + 1,
      players: Array.from({ length: 4 }, (_, k) => ({
        player: { 
          id: `player-${i * 16 + j * 4 + k + 1}`, 
          name: `Player ${i * 16 + j * 4 + k + 1}`,
          rating: 1500 + (Math.random() * 500)
        },
        deck: { 
          id: `deck-${i * 16 + j * 4 + k + 1}`, 
          name: `Deck ${i * 16 + j * 4 + k + 1}` 
        },
        commander: { 
          id: `commander-${i * 16 + j * 4 + k + 1}`, 
          name: `Commander ${i * 16 + j * 4 + k + 1}` 
        },
        result: k === 0 ? 'win' : k === 3 ? 'draw' : 'loss'
      }))
    }))
  }));
};

/**
 * Generates mock commander breakdown for a tournament
 * @param tournamentId - ID of the tournament
 * @returns TournamentCommanderBreakdown with commander usage data
 */
const generateMockCommanderBreakdown = (tournamentId: string): TournamentCommanderBreakdown => {
  return {
    commanders: Array.from({ length: 10 }, (_, i) => ({
      commander: { id: `commander-${i + 1}`, name: `Commander ${i + 1}` },
      count: 10 - i
    }))
  };
};

/**
 * Generates mock color breakdown for a tournament
 * @param tournamentId - ID of the tournament
 * @returns TournamentColorBreakdown with color usage data
 */
const generateMockColorBreakdown = (tournamentId: string): TournamentColorBreakdown => {
  return {
    colors: [
      { color: "W", count: 15 },
      { color: "U", count: 24 },
      { color: "B", count: 18 },
      { color: "R", count: 12 },
      { color: "G", count: 14 },
      { color: "WU", count: 8 },
      { color: "UB", count: 10 },
      { color: "BR", count: 6 },
      { color: "RG", count: 7 },
      { color: "WG", count: 5 }
    ]
  };
};

/**
 * Generates time series data for tournament metrics
 * @param months - Number of months in the time series
 * @param base - Base value for the data points
 * @param variance - Maximum variance from the base value
 * @returns Array of TimeSeriesDataPoint for the specified time period
 */
const generateTimeSeriesData = (months: number, base: number, variance: number): TimeSeriesDataPoint[] => {
  const results: TimeSeriesDataPoint[] = [];
  const now = new Date();

  for (let i = 0; i < months; i++) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    results.push({
      timestamp: date.toISOString().split('T')[0].substring(0, 7), // YYYY-MM format
      value: base + (Math.random() * variance * 2 - variance)
    });
  }

  return results.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
};

/**
 * API SERVICE FUNCTIONS
 * These functions provide access to tournament data throughout the application.
 * Each function follows a consistent pattern of creating a fetcher, adding caching,
 * and adding error handling before executing the request.
 */

/**
 * Retrieves a list of all tournaments
 * @returns Promise resolving to an array of Tournament entities
 */
export const getTournaments = async (): Promise<Tournament[]> => {
  const listFetcher = await createMockListFetcher<Tournament>(mockTournamentsList);
  const cachedFetcher = await withCache(listFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher();
};

/**
 * Retrieves detailed information about a specific tournament
 * @param id - The ID of the tournament to retrieve
 * @returns Promise resolving to a TournamentDetails entity with complete tournament information
 */
export const getTournamentById = async (id: string): Promise<TournamentDetails> => {
  const detailsFetcher = async (tournamentId: string): Promise<TournamentDetails> => {
    const tournament = mockTournamentsList.find(t => t.id === tournamentId);
    if (!tournament) {
      throw new Error(`Tournament with id ${tournamentId} not found`);
    }
    return enhanceTournamentWithDetails(tournament);
  };

  const cachedFetcher = await withCache(detailsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(id);
};

/**
 * Retrieves statistics for a specific tournament
 * @param tournamentId - The ID of the tournament
 * @returns Promise resolving to a TournamentStats entity
 */
export const getTournamentStats = async (tournamentId: string): Promise<TournamentStats> => {
  const statsFetcher = async (tId: string): Promise<TournamentStats> => {
    return generateMockTournamentStats(tId);
  };
  
  const cachedFetcher = await withCache(statsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(tournamentId);
};

/**
 * Retrieves standings for a specific tournament
 * @param tournamentId - The ID of the tournament
 * @returns Promise resolving to an array of TournamentStanding entities
 */
export const getTournamentStandings = async (tournamentId: string): Promise<TournamentStanding[]> => {
  const standingsFetcher = async (tId: string): Promise<TournamentStanding[]> => {
    return generateMockTournamentStandings(tId);
  };
  
  const cachedFetcher = await withCache(standingsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(tournamentId);
};

/**
 * Retrieves round information for a specific tournament
 * @param tournamentId - The ID of the tournament
 * @returns Promise resolving to an array of TournamentRound entities
 */
export const getTournamentRounds = async (tournamentId: string): Promise<TournamentRound[]> => {
  const roundsFetcher = async (tId: string): Promise<TournamentRound[]> => {
    return generateMockTournamentRounds(tId);
  };
  
  const cachedFetcher = await withCache(roundsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(tournamentId);
};

/**
 * Retrieves commander breakdown for a specific tournament
 * @param tournamentId - The ID of the tournament
 * @returns Promise resolving to a TournamentCommanderBreakdown entity
 */
export const getTournamentCommanderBreakdown = async (tournamentId: string): Promise<TournamentCommanderBreakdown> => {
  const breakdownFetcher = async (tId: string): Promise<TournamentCommanderBreakdown> => {
    return generateMockCommanderBreakdown(tId);
  };
  
  const cachedFetcher = await withCache(breakdownFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(tournamentId);
};

/**
 * Retrieves color breakdown for a specific tournament
 * @param tournamentId - The ID of the tournament
 * @returns Promise resolving to a TournamentColorBreakdown entity
 */
export const getTournamentColorBreakdown = async (tournamentId: string): Promise<TournamentColorBreakdown> => {
  const breakdownFetcher = async (tId: string): Promise<TournamentColorBreakdown> => {
    return generateMockColorBreakdown(tId);
  };
  
  const cachedFetcher = await withCache(breakdownFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(tournamentId);
};

/**
 * Retrieves standing with tournament information
 * @param playerIds - IDs of players to retrieve standings for
 * @returns Promise resolving to an array of TournamentStandingWithTournament entities
 */
export const getStandingWithTournament = async (playerIds: string[]): Promise<TournamentStandingWithTournament[]> => {
  const standingFetcher = async (pIds: string[]): Promise<TournamentStandingWithTournament[]> => {
    return pIds.flatMap(playerId => 
      Array.from({ length: 3 }, (_, i) => {
        const standing: TournamentStanding = {
          id: `standing-tournament-${i + 1}-${playerId}`,
          position: i + 1,
          player: { id: playerId, name: `Player ${playerId}` },
          deck: { id: `deck-${i + 1}`, name: `Deck ${i + 1}` },
          commander: { id: `commander-${i + 1}`, name: `Commander ${i + 1}` },
          points: 15 - i,
          wins: 5 - i,
          losses: i,
          draws: 0,
          gamesPlayed: 5 + i,
          opponentWinPercentage: 65 - i * 5
        };
        
        return {
          tournament: {
            id: `tournament-${i + 1}`,
            name: `Tournament ${i + 1}`,
            date: new Date(2023, i, i + 1).toISOString().split('T')[0],
            size: 32 + (i % 4) * 16
          },
          standing: standing
        };
      })
    );
  };
  
  const cachedFetcher = await withCache(standingFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(playerIds);
};

/**
 * Retrieves tournament participation trend over time
 * @returns Promise resolving to time series data of tournament participation
 */
export const getTournamentParticipationTrend = async (): Promise<TimeSeriesDataPoint[]> => {
  const trendFetcher = async (): Promise<TimeSeriesDataPoint[]> => {
    return generateTimeSeriesData(24, 30, 10);
  };
  
  const cachedFetcher = await withCache(trendFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher();
}; 