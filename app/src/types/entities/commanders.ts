import { Card } from './cards';
import { CommanderReference, EntityReference } from './common';

/**
 * Common stats pattern that can be reused
 */
export interface StatsBase {
  winRate: number;
  totalGames: number;
}

/**
 * Commander Entity (extends Card)
 */
export interface Commander extends Card {
  // The id field is either a solo commander ID or a combined ID for partner pairs
  id: string;                // Unique identifier (either single ID or combined ID for partners)
  
  // Commander inherits commanderLegality from Card
  commanderLegality: 'banned' | 'legal' | 'not_legal'; // Always exists for commanders
  
  // If this is a partner pair, store the partner information
  partnerCommander?: CommanderReference; // Use CommanderReference for consistency
}

/**
 * Lightweight commander item for list views
 * Contains only the essential data needed for tables and lists
 */
export interface CommanderListItem {
  id: string;
  name: string;
  colorIdentity: string;
  image?: string;
  // Partner info (if applicable)
  partnerCommander?: CommanderReference;
  // Basic stats
  winRate: number;
  metaShare: number;
  totalGames: number;
}

/**
 * Commander Statistics
 */
export interface CommanderStats extends StatsBase {
  id: string;                // To link back to the commander
  // Tournament performance
  wins: number;              // Total wins
  draws: number;             // Total draws
  entries: {
    total: number,           // Total entries
    uniquePlayers: number    // Number of unique players
  }
  tournamentWins: number;    // Number of tournament wins
  top4s: number;             // Number of top 4 finishes
  top10s: number;            // Number of top 10 finishes
  top16s: number;            // Number of top 16 finishes
  
  // Derived statistics
  drawRate?: number;         // Draws / totalGames
  metaShare?: number;        // Percentage of meta representation
}

/**
 * Commander Matchup data
 */
export interface CommanderMatchup {
  commander: CommanderReference;
  winRate: number;
  games: number;
}

/**
 * Commander Matchups
 */
export interface CommanderMatchups {
  best: CommanderMatchup[];
  worst: CommanderMatchup[];
}

/**
 * Top Players
 */
export interface TopPlayer {
  player: EntityReference;
  winRate: number;
  tournamentWins: number;
  top16s: number;
  games: number;
}

/**
 * Top Decklists
 */
export interface TopDecklist {
  deck: EntityReference;
  player: EntityReference;
  tournamentStanding: string;
  winRate: number;
  tournament?: EntityReference;
}

/**
 * Card Analysis
 */
export interface CardAnalysis {
  cards: Array<{
    card: EntityReference;
    inclusion: number;
    winRate?: number;
    drawRate?: number;
  }>;
}

/**
 * Win Rate by Seating Position
 * Represents a commander's performance based on turn order position
 */
export interface CommanderWinRateBySeat {
  position: string;          // Seating position (1-4 or descriptive like "first")
  winRate: number;           // Win rate as a percentage when playing from this position
}

/**
 * Win Rate by Tournament Cut
 * Represents a commander's performance in different tournament phases
 */
export interface CommanderWinRateByCut {
  cut: string;               // Cut type (e.g., "Top 4", "Top 8", "Swiss")
  winRate: number;           // Win rate as a percentage in this phase
}

/**
 * Card Statistics in a Commander Deck
 * Performance metrics for a specific card in a commander's deck
 */
export interface CardStatInCommander {
  name: string;              // Card name
  winRate: number;           // Win rate when this card is included
  metaShare: number;         // Percentage of decks that include this card
}

/**
 * Card Distribution Statistics
 * Shows which commanders most commonly use a specific card
 */
export interface CardDistributionStats {
  name: string;              // Commander name
  metaShare: number;         // Percentage of decks with this commander that include the card
}

/**
 * Complete Commander Details Model
 */
export interface CommanderDetails {
  // Core data (inherited from Card)
  id: string;                // Combined ID for commander/partner pair
  name: string;
  colorIdentity: string;
  image?: string;
  typeLine: string;
  manaCost?: string;
  cmc: number;
  oracleText?: string;
  commanderLegality: 'banned' | 'legal' | 'not_legal'; // Commander format legality
  
  // Partner information (if applicable)
  partnerCommander?: CommanderReference;
  
  // Statistics
  stats: CommanderStats;
  
  // Relationships
  matchups: CommanderMatchups;
  
  // Related entities
  topPlayers: TopPlayer[];
  topDecklists: TopDecklist[];
  
  // Card analysis
  cardAnalysis: CardAnalysis;
  
  // Optional additional performance metrics
  winRateBySeating?: CommanderWinRateBySeat[];
  winRateByCut?: CommanderWinRateByCut[];
} 