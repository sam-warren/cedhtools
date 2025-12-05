/**
 * ETL Type Definitions
 * 
 * This module contains TypeScript interfaces for:
 * - **External API responses**: Data from Topdeck API (including deckObj from Scrollrack)
 * - **Internal data models**: Database entities
 * 
 * These types ensure type safety throughout the ETL pipeline and provide
 * documentation for the expected data structures.
 * 
 * Note: Topdeck includes deck data directly via their Scrollrack
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
 * rounds containing tables of players (for seat position tracking).
 */
export interface Tournament {
    /** Topdeck's unique tournament identifier (slug format) */
    TID: string;
    /** Human-readable tournament name */
    tournamentName: string;
    /** Tournament start date as Unix timestamp (seconds) */
    startDate: number | string;
    /** Array of rounds, each containing tables with players in seat order */
    rounds: TournamentRound[];
    /** Legacy standings array (kept for backwards compatibility) */
    standings?: TournamentStanding[];
}

/**
 * A round within a tournament.
 * 
 * Each round contains multiple tables where games are played.
 */
export interface TournamentRound {
    /** Round number (1-indexed) */
    round: number;
    /** Tables in this round */
    tables: TournamentTable[];
}

/**
 * A single table/pod within a tournament round.
 * 
 * Players are listed in seat order (index 0 = seat 1, etc.).
 * The winner field indicates who won the game at this table.
 */
export interface TournamentTable {
    /** Table number */
    table: number;
    /** Players at this table, ordered by seat position (0-indexed = seat 1-4) */
    players: TablePlayer[];
    /** Name of the winner, or "Draw" for draws */
    winner: string;
    /** Topdeck user ID of the winner, or "Draw" for draws */
    winner_id: string;
    /** Table status (e.g., "Completed") */
    status: string;
}

/**
 * A player at a tournament table.
 * 
 * Contains player info and their deck data for that game.
 */
export interface TablePlayer {
    /** Player display name */
    name: string;
    /** Player's Topdeck user ID */
    id: string;
    /** Raw decklist text (may be null) */
    decklist: string | null;
    /** Parsed deck object with Scryfall IDs (from Scrollrack) */
    deckObj: TopdeckDeckObj | null;
}

/**
 * A player's standing/result in a tournament.
 * 
 * Contains the player's win/loss record and their deck data.
 * Topdeck provides deck data directly via `deckObj`
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
    /** Total wins across all games */
    wins: number;
    /** Total losses across all games */
    losses: number;
    /** Total draws across all games */
    draws: number;
    /** Number of games played */
    entries: number;
    /** Wins from seat position 1 */
    seat1_wins: number;
    /** Games played from seat position 1 */
    seat1_entries: number;
    /** Wins from seat position 2 */
    seat2_wins: number;
    /** Games played from seat position 2 */
    seat2_entries: number;
    /** Wins from seat position 3 */
    seat3_wins: number;
    /** Games played from seat position 3 */
    seat3_entries: number;
    /** Wins from seat position 4 */
    seat4_wins: number;
    /** Games played from seat position 4 */
    seat4_entries: number;
}

/**
 * Card entity stored in the `cards` table.
 * 
 * Contains card metadata for display.
 * The `unique_card_id` is the Scryfall UUID.
 */
export interface Card {
    /** Scryfall UUID for the card */
    unique_card_id: string;
    /** Card name */
    name: string;
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
// ETL JOB TYPES
// Types for the ETL job queue system
// =============================================================================

/**
 * ETL Job status types
 */
export type EtlJobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

/**
 * ETL Job types
 */
export type EtlJobType = 'SEED' | 'DAILY_UPDATE' | 'BATCH_PROCESS';

/**
 * ETL Job entity from the `etl_jobs` table.
 */
export interface EtlJob {
    /** Database record ID */
    id: number;
    /** Type of ETL job */
    job_type: EtlJobType;
    /** Current status */
    status: EtlJobStatus;
    /** Job parameters (JSON) */
    parameters: Record<string, unknown>;
    /** When the job was created */
    created_at: string;
    /** When the job started running */
    started_at?: string;
    /** When the job completed */
    completed_at?: string;
    /** Cursor for resumable processing */
    next_cursor?: string;
    /** Number of records processed */
    records_processed: number;
    /** Error message if failed */
    error?: string;
    /** Job priority (higher = more important) */
    priority: number;
    /** Maximum runtime in seconds */
    max_runtime_seconds: number;
}

