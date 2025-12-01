/**
 * ETL Type Definitions
 * 
 * This module contains TypeScript interfaces for:
 * - **External API responses**: Data from Topdeck API (including deckObj from Scrollrack)
 * - **Internal data models**: Database entities and ETL status tracking
 * 
 * These types ensure type safety throughout the ETL pipeline and provide
 * documentation for the expected data structures.
 * 
 * Note: As of 2024, Topdeck includes deck data directly via their Scrollrack
 * integration, providing Scryfall UUIDs for card identification.
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
    /** Topdeck's unique tournament identifier (slug format) */
    TID: string;
    /** Human-readable tournament name */
    tournamentName: string;
    /** Tournament start date as Unix timestamp (seconds) */
    startDate: number | string;
    /** Array of player standings with their results */
    standings: TournamentStanding[];
}

/**
 * A player's standing/result in a tournament.
 * 
 * Contains the player's win/loss record and their deck data.
 * As of 2024, Topdeck provides deck data directly via `deckObj`
 * with Scryfall UUIDs for card identification.
 */
export interface TournamentStanding {
    /** Player display name */
    name: string;
    /** Player's Topdeck user ID */
    id: string;
    /** Raw decklist text (legacy format, may be null) */
    decklist: string | null;
    /** Parsed deck object with Scryfall IDs (from Scrollrack) */
    deckObj: TopdeckDeckObj | null;
    /** Number of match wins */
    wins: number;
    /** Number of match losses */
    losses: number;
    /** Number of match draws */
    draws: number;
}

// =============================================================================
// TOPDECK DECK OBJECT TYPES
// Types for the deckObj structure provided by Topdeck's Scrollrack integration
// =============================================================================

/**
 * Deck object from Topdeck's Scrollrack integration.
 * 
 * Contains commanders and mainboard cards with Scryfall UUIDs.
 * This replaces the need to call Moxfield API separately.
 */
export interface TopdeckDeckObj {
    /** Commander(s) in the command zone, keyed by card name */
    Commanders: Record<string, TopdeckCardEntry>;
    /** Mainboard cards (the 99), keyed by card name */
    Mainboard: Record<string, TopdeckCardEntry>;
    /** Optional metadata about the deck */
    metadata?: {
        game?: string;
        format?: string;
        /** Original deck source URL (e.g., Moxfield, Archidekt) */
        importedFrom?: string;
    };
}

/**
 * A single card entry in a Topdeck deck object.
 * 
 * Contains the Scryfall UUID and card count.
 */
export interface TopdeckCardEntry {
    /** Scryfall UUID for the card (e.g., "584cee10-f18c-4633-95cc-f2e7a11841ac") */
    id: string;
    /** Number of copies (typically 1 for Commander format) */
    count: number;
}

// =============================================================================
// DATABASE ENTITY TYPES
// Types representing data stored in the Supabase database
// =============================================================================

/**
 * Commander entity stored in the `commanders` table.
 * 
 * A commander is uniquely identified by its ID, which is:
 * - Single commander: The card's Scryfall UUID
 * - Partner pair: Sorted concatenation of both UUIDs (e.g., "uuid1_uuid2")
 */
export interface Commander {
    /** Scryfall UUID (single) or sorted pair (e.g., "uuid1_uuid2") */
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
 * The `unique_card_id` is now a Scryfall UUID.
 */
export interface Card {
    /** Scryfall UUID for the card */
    unique_card_id: string;
    /** Card name */
    name: string;
    /** Deprecated: Previously separate, now same as unique_card_id */
    scryfall_id?: string;
    /** Full type line text (e.g., "Legendary Creature — Human Wizard") */
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
    /** Commander ID (Scryfall UUID or partner pair) */
    commander_id: string;
    /** Card ID (Scryfall UUID) */
    card_id: string;
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
