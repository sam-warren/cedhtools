'use server';

import type {
  Player,
  PlayerDetails,
  PlayerCommanderStats,
  PlayerTournamentDetail,
  PlayerStats,
  PlayerMatchups,
  ColorPreference,
  PlayerTournamentReference
} from "@/types/entities/players";
import { TimeSeriesDataPoint } from "@/types/entities/common";
import { createMockListFetcher, withCache, withErrorHandling } from "../lib/utils/api-utils";

/**
 * MOCK DATA GENERATORS
 * These functions generate mock data for development and testing purposes.
 * In a production environment, these would be replaced with actual API calls.
 */

// Mock data for players
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

/**
 * Enhances a player with detailed information
 * @param player - Basic player information
 * @returns Complete PlayerDetails with stats and performance data
 */
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

/**
 * Generates mock tournament details for a player
 * @param playerId - ID of the player
 * @returns Array of tournament details
 */
const generateMockPlayerTournaments = (playerId: string): PlayerTournamentDetail[] => {
  return Array.from({ length: 5 }, (_, i) => {
    const wins = Math.floor(Math.random() * 6);
    const losses = Math.floor(Math.random() * 3);
    const draws = Math.floor(Math.random() * 2);
    const points = wins * 3 + draws;
    
    return {
      tournament: {
        id: `tournament-${i}`,
        name: `Tournament ${i}`,
        date: new Date(Date.now() - i * 86400000 * 7).toISOString().split('T')[0],
        size: Math.floor(Math.random() * 64) + 16
      },
      standing: Math.floor(Math.random() * 16) + 1,
      commander: {
        id: "kinnan-bonder-prodigy",
        name: "Kinnan, Bonder Prodigy"
      },
      wins,
      draws,
      losses,
      points
    };
  });
};

/**
 * Generates mock commander stats for a player
 * @param playerId - ID of the player
 * @returns Array of commander statistics
 */
const generateMockPlayerCommanderStats = (playerId: string): PlayerCommanderStats[] => {
  const commanders = [
    { id: 'kinnan-bonder-prodigy', name: 'Kinnan, Bonder Prodigy' },
    { id: 'najeela-blade-blossom', name: 'Najeela, the Blade-Blossom' },
    { id: 'kenrith-returned-king', name: 'Kenrith, the Returned King' }
  ];
  
  return commanders.map(cmd => {
    const games = Math.floor(Math.random() * 20) + 5;
    const wins = Math.floor(Math.random() * games);
    const draws = Math.floor(Math.random() * (games - wins) / 2);
    
    return {
      commander: {
        id: cmd.id,
        name: cmd.name
      },
      games,
      wins,
      draws,
      entries: Math.floor(Math.random() * 5) + 1,
      winRate: wins / games * 100,
      drawRate: draws / games * 100
    };
  });
};

/**
 * Generates mock color preferences for a player
 * @param playerId - ID of the player
 * @returns Array of color preferences
 */
const generateMockColorPreferences = (playerId: string): ColorPreference[] => {
  const colorIdentities = ["W", "U", "B", "R", "G", "WU", "UB", "BR", "RG", "GW", "WUBRG"];
  
  return colorIdentities.slice(0, 5).map(color => {
    const games = Math.floor(Math.random() * 50) + 10;
    return {
      colorIdentity: color,
      percentage: Math.random() * 20 + 5,
      winRate: Math.random() * 40 + 30,
      games
    };
  });
};

/**
 * Generates mock matchups data for a player
 * @param playerId - ID of the player
 * @returns PlayerMatchups data
 */
const generateMockPlayerMatchups = (playerId: string): PlayerMatchups => {
  const commanders = [
    { id: 'kinnan-bonder-prodigy', name: 'Kinnan, Bonder Prodigy' },
    { id: 'najeela-blade-blossom', name: 'Najeela, the Blade-Blossom' },
    { id: 'kenrith-returned-king', name: 'Kenrith, the Returned King' },
    { id: 'urza-lord-high-artificer', name: 'Urza, Lord High Artificer' },
    { id: 'thrasios-tymna', name: 'Thrasios, Triton Hero / Tymna the Weaver' }
  ];
  
  return {
    withCommanders: commanders.slice(0, 2).map(cmd => ({
      commander: {
        id: cmd.id,
        name: cmd.name
      },
      games: Math.floor(Math.random() * 30) + 5,
      winRate: Math.random() * 30 + 40
    })),
    againstCommanders: commanders.slice(2, 5).map(cmd => ({
      commander: {
        id: cmd.id,
        name: cmd.name
      },
      games: Math.floor(Math.random() * 30) + 5,
      winRate: Math.random() * 30 + 40
    }))
  };
};

/**
 * Generates time series data for player performance metrics
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
 * These functions provide access to player data throughout the application.
 * Each function follows a consistent pattern of creating a fetcher, adding caching,
 * and adding error handling before executing the request.
 */

/**
 * Retrieves a list of all players
 * @returns Promise resolving to an array of basic Player entities
 */
export const getPlayers = async (): Promise<Player[]> => {
  const listFetcher = await createMockListFetcher<Player>(mockPlayersList);
  const cachedFetcher = await withCache(listFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher();
};

/**
 * Retrieves detailed information about a specific player
 * @param id - The ID of the player to retrieve
 * @returns Promise resolving to a PlayerDetails entity with complete player information
 */
export const getPlayerById = async (id: string): Promise<PlayerDetails> => {
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

/**
 * Retrieves tournament details for a specific player
 * @param id - The ID of the player
 * @returns Promise resolving to an array of PlayerTournamentDetail entities
 */
export const getPlayerTournaments = async (id: string): Promise<PlayerTournamentDetail[]> => {
  const tournamentsFetcher = async (playerId: string): Promise<PlayerTournamentDetail[]> => {
    return generateMockPlayerTournaments(playerId);
  };
  
  const cachedFetcher = await withCache(tournamentsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(id);
};

/**
 * Retrieves statistics for all commanders used by a player
 * @param id - The ID of the player
 * @returns Promise resolving to an array of PlayerCommanderStats entities
 */
export const getPlayerCommanderStats = async (id: string): Promise<PlayerCommanderStats[]> => {
  const commanderStatsFetcher = async (playerId: string): Promise<PlayerCommanderStats[]> => {
    return generateMockPlayerCommanderStats(playerId);
  };
  
  const cachedFetcher = await withCache(commanderStatsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(id);
};

/**
 * Retrieves color preference data for a specific player
 * @param id - The ID of the player
 * @returns Promise resolving to an array of ColorPreference entities
 */
export const getPlayerColorPreferences = async (id: string): Promise<ColorPreference[]> => {
  const preferencesFetcher = async (playerId: string): Promise<ColorPreference[]> => {
    return generateMockColorPreferences(playerId);
  };
  
  const cachedFetcher = await withCache(preferencesFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(id);
};

/**
 * Retrieves matchup data for a specific player
 * @param id - The ID of the player
 * @returns Promise resolving to PlayerMatchups data
 */
export const getPlayerMatchups = async (id: string): Promise<PlayerMatchups> => {
  const matchupsFetcher = async (playerId: string): Promise<PlayerMatchups> => {
    return generateMockPlayerMatchups(playerId);
  };
  
  const cachedFetcher = await withCache(matchupsFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher(id);
};

/**
 * Retrieves historical win rate data for a player
 * @param id - The ID of the player
 * @param commanderId - Optional ID of a commander to filter results
 * @returns Promise resolving to time series data of win rates
 */
export const getPlayerWinRateHistory = async (id: string, commanderId?: string): Promise<TimeSeriesDataPoint[]> => {
  const historyFetcher = async (): Promise<TimeSeriesDataPoint[]> => {
    return generateTimeSeriesData(90, 0.55, 0.12);
  };
  
  const cachedFetcher = await withCache(historyFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher();
};

/**
 * Retrieves historical Glicko rating data for a player
 * @param id - The ID of the player
 * @returns Promise resolving to time series data of Glicko ratings
 */
export const getPlayerRatingHistory = async (id: string): Promise<TimeSeriesDataPoint[]> => {
  const historyFetcher = async (): Promise<TimeSeriesDataPoint[]> => {
    return generateTimeSeriesData(90, 1600, 150);
  };
  
  const cachedFetcher = await withCache(historyFetcher);
  const errorHandledFetcher = await withErrorHandling(cachedFetcher);
  return await errorHandledFetcher();
}; 