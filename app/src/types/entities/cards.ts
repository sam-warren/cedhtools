import { CardReference, CommanderReference, EntityReference } from './common';

/**
 * Core Card Entity
 */
export interface Card {
  id: string;                // Unique identifier (Moxfield ID)
  name: string;              // Card name
  colorIdentity: string;     // Color identity (e.g., "{W}{U}{B}")
  typeLine: string;          // Type line (e.g., "Legendary Creature — Human Wizard")
  manaCost?: string;         // Mana cost (e.g., "{2}{U}{U}")
  cmc: number;               // Converted mana cost / mana value
  image?: string;            // Card image URL
  oracleText?: string;       // Oracle text
  commanderLegality: 'banned' | 'legal' | 'not_legal'; // Commander format legality
  legalityUpdatedAt?: string; // When legality was last updated
}

/**
 * Card in the context of a commander with inclusion/performance metrics
 */
export interface CommanderCard {
  card: Card;                // Full card entity with all properties
  inclusion: number;         // Percentage of commander decks including this card
  winRate?: number;          // Win rate when this card is included
  drawRate?: number;         // Draw rate when this card is included
}

/**
 * Card-Commander Performance
 */
export interface CardCommanderPerformance {
  // Card reference using consistent pattern
  card: CardReference;
  
  // Commander reference using consistent pattern
  commander: CommanderReference;
  
  // Usage statistics
  totalDecksWithCommander: number;  // Total decks with this commander
  decksWithCard: number;            // Decks with this commander that include the card
  
  // Performance statistics
  wins: number;              // Wins in decks with this commander and card
  draws: number;             // Draws in decks with this commander and card
  losses: number;            // Losses in decks with this commander and card
  gamesPlayed: number;       // Total games played with this commander and card
  
  // Derived statistics (computed on the client)
  inclusionRate?: number;    // decksWithCard / totalDecksWithCommander
  winRate?: number;          // wins / gamesPlayed
  drawRate?: number;         // draws / gamesPlayed
}

/**
 * Commander Card Analysis
 */
export interface CommanderCardAnalysis {
  // Use consistent commander reference
  commander: CommanderReference;
  
  // All cards played with this commander
  cards: Array<{
    card: CardReference;     // Consistent card reference
    inclusion: number;       // Percentage of decks including this card
    winRate?: number;        // Win rate when this card is included
    drawRate?: number;       // Draw rate when this card is included
  }>;
  
  // Other specialized card lists
  highPerformers: Array<{
    card: CardReference;     // Consistent card reference
    inclusion: number;       // Percentage of decks including this card
    winRate: number;         // Win rate when this card is included
    winRateDiff: number;     // Difference from commander's average win rate
  }>;
  
  uniqueCards: Array<{
    card: CardReference;     // Consistent card reference
    inclusion: number;       // Percentage of decks including this card
    globalInclusion: number; // Percentage across all eligible decks
    ratio: number;           // inclusion / globalInclusion
  }>;
} 