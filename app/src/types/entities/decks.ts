import { CardReference, CommanderReference } from './common';

/**
 * Core Deck Entity
 */
export interface Deck {
  id: string;                // Unique identifier
  name: string;              // Deck name
  createdAt: string;         // Creation date (YYYY-MM-DD)
  updatedAt: string;         // Last update date (YYYY-MM-DD)
  
  // Commander information using consistent reference
  commander: CommanderReference;
  
  // Metadata
  colorIdentity: string;     // Combined color identity (e.g., "{W}{U}{B}{R}")
  description?: string;      // Optional deck description
  source?: {                 // Optional source information
    type: 'moxfield' | 'archidekt' | 'deckstats' | 'manual'; // Source type
    externalId?: string;     // External ID for linking
    url?: string;            // URL to original deck
  };
}

/**
 * Deck Statistics
 */
export interface DeckStats {
  // Tournament performance
  tournamentEntries: number; // Number of tournament entries
  tournamentWins: number;    // Number of tournament wins
  
  // Game performance
  totalGames: number;        // Total games played
  wins: number;              // Total wins
  draws: number;             // Total draws
  losses: number;            // Total losses
  
  // Derived statistics (computed on the client)
  winRate?: number;          // wins / totalGames
  drawRate?: number;         // draws / totalGames
  lossRate?: number;         // losses / totalGames
}

/**
 * Deck Composition
 */
export interface DeckComposition {
  // Card boards with consistent references
  commander: Array<{         // Commander zone cards
    card: CardReference;     // Consistent card reference
    count: number;           // Number of copies (usually 1)
  }>;
  
  mainboard: Array<{         // Main deck cards
    card: CardReference;     // Consistent card reference
    count: number;           // Number of copies
  }>;
  
  sideboard?: Array<{        // Optional sideboard cards
    card: CardReference;     // Consistent card reference
    count: number;           // Number of copies
  }>;
  
  companion?: {              // Optional companion
    card: CardReference;     // Consistent card reference
  };
  
  // Card type breakdown
  typeBreakdown: {
    creatures: number;       // Number of creature cards
    instants: number;        // Number of instant cards
    sorceries: number;       // Number of sorcery cards
    artifacts: number;       // Number of artifact cards
    enchantments: number;    // Number of enchantment cards
    planeswalkers: number;   // Number of planeswalker cards
    lands: number;           // Number of land cards
  };
}

/**
 * Deck Card Performance
 */
export interface DeckCardPerformance {
  // Card reference using consistent pattern
  card: CardReference;
  
  // Performance metrics
  wins: number;              // Wins when this card is in the deck
  losses: number;            // Losses when this card is in the deck
  draws: number;             // Draws when this card is in the deck
  gamesPlayed: number;       // Total games played with this card
  
  // Commander context metrics
  commanderWinRate: number;  // Overall win rate of decks with this commander
  cardWinRate: number;       // Win rate of decks with this commander that include this card
  
  // Impact metric
  winRateDiff: number;       // Difference between card win rate and commander's average win rate
                             // (positive values indicate the card improves performance)
}

/**
 * Tournament References
 */
export interface DeckTournamentReference {
  tournamentId: string;      // Reference to the tournament
  playerId?: string;         // Optional player ID who played this deck
  playerName: string;        // Player name who played this deck
  
  // The standing ID to look up detailed results in tournament entity
  standingId: string;        // ID to reference specific standing in tournament
}

/**
 * Complete Deck Details Model
 */
export interface DeckDetails {
  // Core data
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  
  // Commander information (consistent reference)
  commander: CommanderReference;
  
  // Metadata
  colorIdentity: string;
  description?: string;
  source?: {
    type: 'moxfield' | 'archidekt' | 'deckstats' | 'manual';
    externalId?: string;
    url?: string;
  };
  
  // Statistics
  stats: DeckStats;
  
  // Composition
  composition: DeckComposition;
  
  // Card performance
  cardPerformance: DeckCardPerformance[];
  
  // Tournament references
  tournamentReferences: DeckTournamentReference[];
}

/**
 * Deck Tournament History
 */
export interface DeckTournamentHistory {
  tournament: {
    id: string;
    name: string;
    date: string;
    size: number;
  };
  player: {
    id?: string;
    name: string;
  };
  standing: number;
  wins: number;
  losses: number;
  draws: number;
  matchPoints: number;
} 