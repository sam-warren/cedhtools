/**
 * API Type Definitions
 * 
 * Types for API requests, responses, and UI data structures.
 */

// =============================================================================
// CARD STATISTICS
// =============================================================================

/**
 * Card statistics for deck analysis.
 * 
 * Contains computed metrics for a card's performance with a specific commander.
 */
export interface CardStats {
    /** Number of wins in tournaments with this card */
    wins: number;
    /** Number of losses in tournaments with this card */
    losses: number;
    /** Number of draws in tournaments with this card */
    draws: number;
    /** Number of tournament entries with this card */
    entries: number;
    /** Win rate percentage (0-100) */
    winRate: number;
    /** Inclusion rate percentage (0-100) - how often this card appears in commander's decks */
    inclusionRate: number;
    /** Difference between card win rate and commander baseline win rate */
    winRateDiff: number;
    /** Statistical confidence score (0-100) */
    confidence: number;
}

// =============================================================================
// COMMANDER TYPES
// =============================================================================

/**
 * Commander with computed statistics for API responses.
 */
export interface CommanderWithStats {
    /** Commander ID (Scryfall UUID or partner pair) */
    id: string;
    /** Display name */
    name: string;
    /** Total wins */
    wins: number;
    /** Total losses */
    losses: number;
    /** Total draws */
    draws: number;
    /** Total tournament entries */
    entries: number;
    /** Computed win rate percentage */
    winRate: number;
}

// =============================================================================
// DECK ANALYSIS TYPES
// =============================================================================

/**
 * A card in the deck analysis response.
 */
export interface AnalyzedCard {
    /** Scryfall UUID */
    id: string;
    /** Card name */
    name: string;
    /** Quantity in deck */
    quantity: number;
    /** Card type number */
    type: number;
    /** Full type line */
    type_line: string | null;
    /** Card statistics (null if no tournament data) */
    stats: CardStats | null;
}

/**
 * Deck analysis API response.
 */
export interface DeckAnalysisResponse {
    /** Deck metadata */
    deck: {
        commanders: Array<{ name: string; id: string }>;
    };
    /** Commander statistics */
    commanderStats: CommanderWithStats;
    /** Cards grouped by type */
    cardsByType: Record<string, AnalyzedCard[]>;
    /** Popular cards not in the deck */
    otherCards: AnalyzedCard[];
    /** Cards that couldn't be resolved */
    notFoundCards: string[];
}

// =============================================================================
// API ERROR TYPES
// =============================================================================

/**
 * Standard API error response.
 */
export interface ApiError {
    error: string;
    message?: string;
    type?: string;
}

