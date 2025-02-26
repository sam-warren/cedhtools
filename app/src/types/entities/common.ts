/**
 * Common entity types used across all entities
 */

/**
 * Base reference type for consistent entity references
 */
export interface EntityReference {
  id: string;                // Unique identifier
  name: string;              // Display name
}

/**
 * Card reference for consistent use across entities
 */
export interface CardReference extends EntityReference {
  imageUrl?: string;         // URL to card image when needed
}

/**
 * Commander reference with optional partner information
 */
export interface CommanderReference extends EntityReference {
  partnerCommanderId?: string;  // Optional ID of partner (if applicable)
  partnerCommanderName?: string; // Optional name of partner
}

/**
 * Time series data point for consistent use across entities
 */
export interface TimeSeriesDataPoint {
  timestamp: string;         // ISO 8601 timestamp (YYYY-MM-DD)
  value: number;             // The measured value
  metadata?: Record<string, unknown>; // Optional additional context
}

/**
 * Query interface optimized for TimescaleDB
 */
export interface TimeSeriesQuery {
  entityType: 'commander' | 'player' | 'deck' | 'card' | 'tournament';
  entityId: string;          // The entity's unique identifier
  metric: string;            // 'usage', 'winRate', 'popularity', etc.
  interval?: 'hour' | 'day' | 'week' | 'month' | 'year'; // TimescaleDB time_bucket
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count'; // Aggregation function
  startTime: string;         // ISO timestamp for range start
  endTime: string;           // ISO timestamp for range end
}

/**
 * Response wrapper for time series data
 */
export interface TimeSeriesResponse {
  query: TimeSeriesQuery;    // The original query parameters
  dataPoints: TimeSeriesDataPoint[];
  meta: {
    totalPoints: number;     // Total number of data points
    interval: string;        // Actual interval used for the query
    aggregation: string;     // Actual aggregation function used
  };
}

/**
 * Standard wrapper for all entity responses
 * Provides metadata for client-side caching and versioning
 */
export interface EntityResponse<T> {
  data: T;                   // The actual entity data
  meta: {
    lastUpdated: string;     // When the data was last updated on the server
    dataVersion: string;     // Version hash of the dataset (for cache invalidation)
    nextUpdateExpected?: string; // When to expect the next data update (based on ETL schedule)
  };
}

/**
 * Query parameters for pagination
 */
export interface PaginationParams {
  page?: number;            // Page number (1-indexed, default: 1)
  pageSize?: number;        // Items per page (default: 20, max: 100)
  cursor?: string;          // Optional cursor-based pagination alternative
}

/**
 * Response wrapper for paginated results
 */
export interface PaginatedResponse<T> extends EntityResponse<T[]> {
  meta: {
    // Standard entity response metadata
    lastUpdated: string;
    dataVersion: string;
    nextUpdateExpected?: string;

    // Pagination metadata
    pagination: {
      totalCount: number;     // Total number of items across all pages
      pageSize: number;       // Current page size
      currentPage: number;    // Current page number (1-indexed)
      totalPages: number;     // Total number of pages
      hasNextPage: boolean;   // Whether there are more pages
      hasPreviousPage: boolean; // Whether there are previous pages
      nextCursor?: string;    // Cursor for the next page (if applicable)
      prevCursor?: string;    // Cursor for the previous page (if applicable)
    }
  };
}

/**
 * Common filter parameters across entities
 */
export interface CommonFilterParams {
  // Date range filters
  dateFrom?: string;   // ISO date string (e.g., "2022-06-01")
  dateTo?: string;     // ISO date string (defaults to current date)

  // Tournament size filters
  tournamentSize?: '30+' | '60+' | '120+' | 'all'; // Minimum tournament size

  // Tournament cut filters
  tournamentCut?: 'top4' | 'top10' | 'top16' | 'all'; // Results from specified cut

  // Generic search
  search?: string;     // Search term for name/text fields
}

/**
 * Sort parameters
 */
export interface SortParams {
  sortBy?: string;      // Field to sort by
  sortOrder?: 'asc' | 'desc'; // Sort direction (default: desc)
}

/**
 * Utility functions for working with commander IDs
 */
// Utility functions for commander operations (module-based approach)
export const CommanderUtils = {
  /**
   * Generate a consistent combined ID for commander pairs
   */
  generateCombinedId(commander1Id: string, commander2Id?: string): string {
    if (!commander2Id) return commander1Id;

    // Sort IDs to ensure consistent ordering regardless of input order
    const [first, second] = [commander1Id, commander2Id].sort();
    return `${first}_${second}`;
  },

  /**
   * Parse a combined ID back into individual commander IDs
   */
  parseCommanderId(combinedId: string): {
    primaryId: string;
    partnerId?: string
  } {
    if (combinedId.includes('_')) {
      const [primary, partner] = combinedId.split('_');
      return { primaryId: primary, partnerId: partner };
    }
    return { primaryId: combinedId };
  },

  /**
   * Check if a combined ID represents a partner pair
   */
  isPartnerPair(combinedId: string): boolean {
    return combinedId.includes('_');
  }
}; 