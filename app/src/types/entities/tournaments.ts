import { CommanderReference } from './common';

/**
 * Core Tournament Entity
 */
export interface Tournament {
  id: string;                // Unique identifier
  name: string;              // Tournament name
  date: string;              // Tournament date (YYYY-MM-DD)
  size: number;              // Number of players
  rounds: number;            // Number of rounds played
  topCut: string;            // Top cut description (e.g., "Top 4", "Top 8")
}

/**
 * Tournament Statistics
 */
export interface TournamentStats {
  playerCount: number;       // Number of players
  registeredPlayerCount: number; // Number of registered players
  commanderCount: number;    // Number of unique commanders/pairs
  totalGames: number;        // Total games played
  completedGames: number;    // Completed games (non-draws)
  draws: number;             // Number of draws
  
  // Derived statistics (computed on the client)
  drawRate?: number;         // Draws / totalGames
  averageGamesPerPlayer?: number; // totalGames / playerCount
}

/**
 * Tournament Standings
 */
export interface TournamentStanding {
  id: string;                // Unique ID for this standing entry
  position: number;          // Standing position
  player: {                  // Player reference
    id?: string;             // Player ID (if registered)
    name: string;            // Player name
  };
  points: number;            // Total points
  wins: number;              // Number of wins
  draws: number;             // Number of draws
  losses: number;            // Number of losses
  gamesPlayed: number;       // Total games played
  
  // Deck reference using consistent pattern
  deck?: {                   
    id: string;              // Deck ID
    name: string;            // Deck name
  };
  
  // Commander reference using consistent pattern
  commander: CommanderReference;
  
  // Tiebreaker information
  opponentWinPercentage?: number; // Opponent match win percentage
}

/**
 * Tournament Rounds
 */
export interface TournamentRound {
  roundNumber: number;       // Round number (1, 2, 3, etc.)
  roundLabel: string;        // Round label (e.g., "Round 1", "Top 4", "Finals")
  drawCount?: number;        // Number of draws in this round (Swiss only)
  tables: Array<{            // Tables in this round
    tableNumber: number;     // Table number
    players: Array<{         // Players at this table
      // Player reference
      player: {
        id?: string;         // Player ID (if registered)
        name: string;        // Player name
        rating?: number;     // Player's Glicko rating at time of tournament
      };
      
      // Deck reference
      deck?: {               
        id: string;          // Deck ID
        name: string;        // Deck name
      };
      
      // Commander reference
      commander: CommanderReference;
      
      result: 'win' | 'loss' | 'draw'; // Player's result
    }>;
  }>;
}

/**
 * Commander Breakdown
 */
export interface TournamentCommanderBreakdown {
  commanders: Array<{        // Commanders used in the tournament
    commander: CommanderReference; // Commander reference
    count: number;           // Number of players using this commander
  }>;
}

/**
 * Color Breakdown
 */
export interface TournamentColorBreakdown {
  colors: Array<{            // Individual colors in the tournament
    color: string;           // Color (e.g., "W", "U", "B", "R", "G")
    count: number;           // Number of decks containing this color
  }>;
}

/**
 * Complete Tournament Details Model
 */
export interface TournamentDetails {
  // Core data
  id: string;
  name: string;
  date: string;
  size: number;
  rounds: number;
  topCut: string;
  
  // Statistics
  stats: TournamentStats;
  
  // Relationships
  standings: TournamentStanding[];
  rounds: TournamentRound[];
  
  // Analysis
  commanderBreakdown: TournamentCommanderBreakdown;
  colorBreakdown: TournamentColorBreakdown;
}

/**
 * Tournament Standing with Tournament Information
 */
export interface TournamentStandingWithTournament {
  tournament: {
    id: string;
    name: string;
    date: string;
    size: number;
  };
  standing: TournamentStanding;
} 