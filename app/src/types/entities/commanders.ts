import { Card } from './cards';
import { CommanderReference, EntityReference } from './common';

/**
 * Commander Entity (extends Card)
 */
export interface Commander extends Card {
  // The id field is either a solo commander ID or a combined ID for partner pairs
  id: string;                // Unique identifier (either single ID or combined ID for partners)
  
  // Commander inherits commanderLegality from Card
  commanderLegality: 'banned' | 'legal' | 'not_legal'; // Always exists for commanders
  
  // If this is a partner pair, store the partner information
  partnerCommander?: {
    id: string;              // Partner's unique identifier
    name: string;            // Partner's name
    image?: string;          // Partner's image URL
    commanderLegality: 'banned' | 'legal' | 'not_legal'; // Partner's legality
  };
}

/**
 * Commander Statistics
 */
export interface CommanderStats {
  // Tournament performance
  totalGames: number;        // Total games played
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
  
  // Derived statistics (computed on the client)
  winRate?: number;          // Wins / totalGames
  drawRate?: number;         // Draws / totalGames
  metaShare?: number;        // Percentage of meta representation
}

/**
 * Commander Matchups
 */
export interface CommanderMatchups {
  best: Array<{
    commander: CommanderReference; // Use consistent commander reference
    winRate: number;         // Win rate against this commander
    games: number;           // Number of games in this matchup
  }>;
  worst: Array<{
    commander: CommanderReference; // Use consistent commander reference
    winRate: number;         // Win rate against this commander
    games: number;           // Number of games in this matchup
  }>;
}

/**
 * Top Players
 */
export interface TopPlayer {
  player: {                  // Use consistent player reference
    id?: string;             // Player ID for linking (optional)
    name: string;            // Player name
  };
  winRate: number;           // Win rate with this commander
  tournamentWins: number;    // Tournament wins with this commander
  top16s: number;            // Top 16 finishes with this commander
  games: number;             // Total games with this commander
}

/**
 * Top Decklists
 */
export interface TopDecklist {
  deck: {                    // Use consistent deck reference
    id: string;              // Deck ID 
    name: string;            // Deck name
  };
  player: {                  // Use consistent player reference
    id?: string;             // Optional player ID
    name: string;            // Player name
  };
  tournamentStanding: string; // Standing in format "X/Y"
  winRate: number;           // Win rate for this specific decklist
  tournament?: {             // Optional tournament reference
    id: string;              // Tournament ID
    name: string;            // Tournament name
  };
}

/**
 * Card Analysis
 */
export interface CardAnalysis {
  staples: Array<{           // Cards that appear in >90% of decks
    card: EntityReference;   // Use consistent card reference
    inclusion: number;       // Percentage of decks including this card
  }>;
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
  isCommander: true;         // Always true for commanders
  commanderLegality: 'banned' | 'legal' | 'not_legal'; // Commander format legality
  
  // Partner information (if applicable)
  partnerCommander?: {
    id: string;
    name: string;
    image?: string;
    commanderLegality: 'banned' | 'legal' | 'not_legal';
  };
  
  // Statistics
  stats: CommanderStats;
  
  // Relationships
  matchups: CommanderMatchups;
  
  // Related entities
  topPlayers: TopPlayer[];
  topDecklists: TopDecklist[];
  
  // Card analysis
  cardAnalysis: CardAnalysis;
} 