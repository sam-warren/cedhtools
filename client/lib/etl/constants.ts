/**
 * ETL Pipeline Constants
 * 
 * Centralized configuration values for the ETL process.
 * These can be overridden by environment variables where noted.
 */

// =============================================================================
// BATCH PROCESSING CONFIGURATION
// =============================================================================

/** 
 * Default number of records to process per batch.
 * Used in `processBatch()` for cursor-based processing.
 */
export const DEFAULT_BATCH_SIZE = 50;

/**
 * Default concurrency limit for parallel processing.
 * Can be overridden by ETL_CONCURRENCY_LIMIT env var.
 */
export const DEFAULT_CONCURRENCY_LIMIT = 5;

/**
 * Number of days to process in each batch during full processing.
 * Weekly batches balance API load vs. processing efficiency.
 */
export const WEEKLY_BATCH_DAYS = 7;

/**
 * Default number of days to look back when no last processed date exists.
 * Used as fallback in `processBatch()`.
 */
export const DEFAULT_LOOKBACK_DAYS = 7;

/**
 * Default number of months to look back for initial seeding.
 * Used in `processData()` when no start date is provided.
 */
export const DEFAULT_SEED_MONTHS = 6;

// =============================================================================
// DATA VALIDATION THRESHOLDS
// =============================================================================

/**
 * Year threshold for detecting corrupted tournament dates.
 * Dates before this year are considered invalid (likely Unix epoch errors).
 */
export const MIN_VALID_TOURNAMENT_YEAR = '2000-01-01';

// =============================================================================
// CURSOR FORMAT
// =============================================================================

/**
 * Cursor delimiter used in cursor string format.
 * Cursor format: `{date}:{tournamentId}:{standingIndex}`
 */
export const CURSOR_DELIMITER = ':';

// =============================================================================
// API ENDPOINTS
// =============================================================================

/**
 * Default Topdeck API base URL.
 * Can be overridden by TOPDECK_API_BASE_URL env var.
 */
export const DEFAULT_TOPDECK_API_URL = 'https://topdeck.gg/api/v2';

// =============================================================================
// DATABASE TABLE NAMES (for reference)
// =============================================================================

export const TABLES = {
    COMMANDERS: 'commanders',
    CARDS: 'cards',
    STATISTICS: 'statistics',
    ETL_STATUS: 'etl_status',
    ETL_JOBS: 'etl_jobs',
    PROCESSED_TOURNAMENTS: 'processed_tournaments',
} as const;

// =============================================================================
// ETL STATUS VALUES
// =============================================================================

export const ETL_STATUS = {
    RUNNING: 'RUNNING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
} as const;

export type EtlStatusType = typeof ETL_STATUS[keyof typeof ETL_STATUS];

// =============================================================================
// WORKER CONFIGURATION
// =============================================================================

/**
 * Polling interval for the worker to check for new jobs (in ms).
 */
export const WORKER_POLLING_INTERVAL_MS = 30000;

/**
 * Interval to check for and reset stuck jobs (in ms).
 */
export const WORKER_STUCK_JOB_RESET_INTERVAL_MS = 300000;

/**
 * Default max runtime for daily update jobs (in seconds).
 */
export const WORKER_DEFAULT_MAX_RUNTIME_SECONDS = 3600;

/**
 * Max runtime for seed jobs (in seconds) - 8 hours.
 */
export const SEED_JOB_MAX_RUNTIME_SECONDS = 28800;

/**
 * Interval (in months) between seed jobs.
 */
export const SEED_JOB_INTERVAL_MONTHS = 6;
