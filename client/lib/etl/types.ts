/**
 * ETL Type Definitions
 * 
 * This module contains TypeScript interfaces for:
 * - **External API responses**: Data from Topdeck and Moxfield APIs
 * - **Internal data models**: Database entities and ETL status tracking
 * 
 * These types ensure type safety throughout the ETL pipeline and provide
 * documentation for the expected data structures.
 */

// =============================================================================
// TOPDECK API TYPES
// Types for data received from the Topdeck tournament API
// =============================================================================

/**
 * Tournament data from the Topdeck API.
 * 
 * Represents a single Magic: The Gathering tournament with
 * its standings (player results and decklists).
 */
export interface Tournament {
    /** Topdeck's unique tournament identifier */
    TID: string;
    /** Human-readable tournament name */
    tournamentName: string;
    /** Tournament start date as Unix timestamp (seconds) */
    startDate: string;
    /** Array of player standings with their results */
    standings: TournamentStanding[];
}

/**
 * A player's standing/result in a tournament.
 * 
 * Contains the player's win/loss record and their decklist URL.
 * We only process standings with Moxfield decklist URLs.
 */
export interface TournamentStanding {
    /** URL to the player's decklist (may be Moxfield, Archidekt, etc.) */
    decklist: string;
    /** Number of match wins */
    wins: number;
    /** Number of match losses */
    losses: number;
    /** Number of match draws */
    draws: number;
}

// =============================================================================
// MOXFIELD API TYPES
// Types for data received from the Moxfield deck API
// =============================================================================

/**
 * Deck data from the Moxfield API.
 * 
 * Contains the deck's name and its various card zones (boards).
 * For cEDH analysis, we primarily care about:
 * - `commanders`: The command zone (1-2 cards)
 * - `mainboard`: The 99 cards in the deck
 */
export interface MoxfieldDeck {
    /** User-defined deck name */
    name: string;
    /** Card zones (mainboard, commanders, sideboard, etc.) */
    boards: {
        /** The main 99-card deck */
        mainboard: MoxfieldBoard;
        /** Commander(s) in the command zone (1-2 cards) */
        commanders: MoxfieldBoard;
    };
}

/**
 * A card zone/board in a Moxfield deck.
 * 
 * Moxfield represents cards as an object map keyed by a unique identifier,
 * NOT as an array. Use `Object.values(cards)` to iterate.
 */
export interface MoxfieldBoard {
    /** Total number of cards in this zone */
    count: number;
    /** Cards in this zone, keyed by internal Moxfield ID */
    cards: Record<string, MoxfieldCardEntry>;
}

/**
 * A single card entry in a Moxfield deck zone.
 * 
 * Contains the quantity (usually 1 in Commander) and card metadata.
 */
export interface MoxfieldCardEntry {
    /** Number of copies (typically 1 for Commander format) */
    quantity: number;
    /** Card metadata */
    card: MoxfieldCardData;
}

/**
 * Card metadata from Moxfield.
 * 
 * The `uniqueCardId` is the primary identifier used for statistics tracking.
 * It remains consistent across reprints/editions of the same card.
 */
export interface MoxfieldCardData {
    /** Card name (e.g., "Sol Ring") */
    name: string;
    /** Moxfield's unique card identifier (consistent across printings) */
    uniqueCardId: string;
    /** Scryfall UUID for linking to external card data */
    scryfall_id?: string;
    /** Numeric type code (for categorization) */
    type?: number;
    /** Full type line (e.g., "Artifact") */
    type_line?: string;
}

// =============================================================================
// DATABASE ENTITY TYPES
// Types representing data stored in the Supabase database
// =============================================================================

/**
 * Commander entity stored in the `commanders` table.
 * 
 * A commander is uniquely identified by its ID, which is:
 * - Single commander: The card's `uniqueCardId`
 * - Partner pair: Sorted concatenation of both IDs (e.g., "id1_id2")
 */
export interface Commander {
    /** Unique identifier (single ID or sorted pair, e.g., "id1_id2") */
    id: string;
    /** Display name (single name or "Name1 + Name2") */
    name: string;
    /** Total wins across all tournament entries */
    wins: number;
    /** Total losses across all tournament entries */
    losses: number;
    /** Total draws across all tournament entries */
    draws: number;
    /** Number of tournament entries (decks registered) */
    entries: number;
}

/**
 * Card entity stored in the `cards` table.
 * 
 * Contains card metadata for display and external linking.
 */
export interface Card {
    /** Moxfield's unique card identifier */
    uniqueCardId: string;
    /** Card name */
    name: string;
    /** Scryfall UUID for external linking */
    scryfallId: string;
    /** Numeric type code */
    type?: number;
    /** Full type line text */
    type_line?: string;
}

/**
 * Statistics entity stored in the `statistics` table.
 * 
 * Represents the performance of a specific card when played with
 * a specific commander. This is the core analytical data for the
 * deck analysis feature.
 */
export interface Statistic {
    /** Commander ID this statistic belongs to */
    commanderId: string;
    /** Card ID this statistic tracks */
    cardId: string;
    /** Wins in tournaments where this card was in the deck */
    wins: number;
    /** Losses in tournaments where this card was in the deck */
    losses: number;
    /** Draws in tournaments where this card was in the deck */
    draws: number;
    /** Number of tournament entries including this card */
    entries: number;
}

// =============================================================================
// ETL STATUS TRACKING
// Types for monitoring ETL pipeline execution
// =============================================================================

/**
 * ETL run status from the `etl_status` table.
 * 
 * Tracks the progress and outcome of ETL pipeline runs.
 */
export interface EtlStatus {
    /** Database record ID */
    id?: number;
    /** When the ETL run started */
    startDate: string;
    /** When the ETL run completed (or failed) */
    endDate?: string;
    /** Current status of the run */
    status: 'RUNNING' | 'COMPLETED' | 'FAILED';
    /** Number of standings processed in this run */
    recordsProcessed: number;
    /** Last tournament date that was processed */
    lastProcessedDate?: string;
} 