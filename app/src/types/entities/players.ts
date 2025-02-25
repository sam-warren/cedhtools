import { CommanderReference } from './common';

/**
 * Core Player Entity
 */
export interface Player {
  id?: string;               // Optional unique identifier (from Topdeck.gg)
  name: string;              // Player name (always required)
  isRegistered: boolean;     // Whether the player has a Topdeck.gg account
}

/**
 * Player Statistics
 */
export interface PlayerStats {
  // Tournament performance
  tournamentWins: number;    // Number of tournament wins
  top4s: number;             // Number of top 4 finishes
  top10s: number;            // Number of top 10 finishes
  top16s: number;            // Number of top 16 finishes
  
  // Game performance
  totalGames: number;        // Total games played
  wins: number;              // Total wins
  draws: number;             // Total draws
  entries: number;           // Total tournament entries
  
  // Rating
  glickoRating: number;      // Glicko-2 rating
  
  // Derived statistics (computed on the client)
  winRate?: number;          // Wins / totalGames
  drawRate?: number;         // Draws / totalGames
  consistencyRating?: number; // Measure of consistent performance
}

/**
 * Recent Tournaments
 */
export interface PlayerTournamentReference {
  tournamentId: string;      // Tournament ID for reference
  standingId: string;        // Standing ID within that tournament
  
  // Optional cached data for quick display (not authoritative)
  // For detailed data, the client should fetch from Tournament entity
  date?: string;             // Tournament date (YYYY-MM-DD)
  standing?: number;         // Player's standing
  commanderId?: string;      // ID of the commander used
}

/**
 * Player Tournament Detail
 */
export interface PlayerTournamentDetail {
  tournament: {
    id: string;
    name: string;
    date: string;
    size: number;
  };
  standing: number;
  commander: CommanderReference;
  wins: number;
  draws: number;
  losses: number;
  points: number;
}

/**
 * Commander Statistics
 */
export interface PlayerCommanderStats {
  commander: CommanderReference; // Use consistent commander reference
  
  // Statistics
  games: number;             // Games played with this commander
  wins: number;              // Wins with this commander
  draws: number;             // Draws with this commander
  entries: number;           // Number of times entered in tournaments
  
  // Derived statistics (computed on the client)
  winRate?: number;          // Wins / games
  drawRate?: number;         // Draws / games
}

/**
 * Color Identity Preference
 */
export interface ColorPreference {
  colorIdentity: string;     // Color identity (e.g., "{W}{U}{B}")
  percentage: number;        // Percentage of games played with this color identity
  winRate: number;           // Win rate with this color identity
  games: number;             // Games played with this color identity
}

/**
 * Matchup Analysis
 */
export interface PlayerMatchups {
  withCommanders: Array<{    // Performance with specific commanders
    commander: CommanderReference; // Use consistent commander reference
    games: number;           // Games played
    winRate: number;         // Win rate
  }>;
  
  againstCommanders: Array<{ // Performance against specific commanders
    commander: CommanderReference; // Use consistent commander reference
    games: number;           // Games played against
    winRate: number;         // Win rate against
  }>;
}

/**
 * Complete Player Details Model
 */
export interface PlayerDetails {
  // Core data
  id?: string;
  name: string;
  isRegistered: boolean;
  
  // Statistics
  stats: PlayerStats;
  
  // Relationships (references only)
  tournamentReferences: PlayerTournamentReference[];
  commanderStats: PlayerCommanderStats[];
  
  // Preferences and analysis
  colorPreferences: ColorPreference[];
  matchups: PlayerMatchups;
} 