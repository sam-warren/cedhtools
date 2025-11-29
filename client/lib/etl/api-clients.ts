/**
 * API Clients for External Data Sources
 * 
 * This module provides clients for fetching data from:
 * - **Topdeck**: Tournament results and standings
 * - **Moxfield**: Deck lists and card data
 * 
 * Both clients include proper error handling and the Moxfield client
 * implements sophisticated rate limiting with exponential backoff.
 */

import { MoxfieldDeck, Tournament } from './types';
import {
    DEFAULT_TOPDECK_API_URL,
    DEFAULT_REQUESTS_PER_SECOND,
    MAX_RETRY_ATTEMPTS,
    RETRY_BASE_DELAY_MS,
    MAX_BACKOFF_MS,
    JITTER_RANGE_MS,
} from './constants';
import { etlLogger } from '../logger';
import { ExternalServiceError, RateLimitError } from '../errors';

/**
 * Client for fetching tournament data from the Topdeck API.
 * 
 * Topdeck.gg is a platform for organizing and tracking Magic: The Gathering
 * tournaments. This client fetches EDH (Commander) tournament results including
 * player standings and decklist URLs.
 * 
 * @example
 * ```typescript
 * const client = new TopdeckClient();
 * const tournaments = await client.fetchTournaments('2024-01-01', '2024-01-31');
 * ```
 */
export class TopdeckClient {
    private baseUrl: string;
    private apiKey: string;
    private logger = etlLogger.child({ client: 'topdeck' });

    constructor() {
        this.baseUrl = process.env.TOPDECK_API_BASE_URL || DEFAULT_TOPDECK_API_URL;
        this.apiKey = process.env.TOPDECK_API_KEY || '';

        if (!this.apiKey) {
            this.logger.warn('TOPDECK_API_KEY not set in environment variables');
        }
    }

    /**
     * Fetch all EDH tournaments within a date range.
     * 
     * @param startDate - Start date in YYYY-MM-DD format
     * @param endDate - End date in YYYY-MM-DD format
     * @returns Array of tournaments with standings including decklist URLs
     * @throws Error if the API request fails
     */
    async fetchTournaments(startDate: string, endDate: string): Promise<Tournament[]> {
        // Topdeck API expects Unix timestamps (seconds since epoch)
        const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
        const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

        this.logger.debug('Fetching tournaments', { 
            startDate, 
            endDate, 
            startTimestamp, 
            endTimestamp 
        });

        try {
            const response = await fetch(`${this.baseUrl}/tournaments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.apiKey,
                },
                body: JSON.stringify({
                    game: "Magic: The Gathering",
                    format: "EDH",
                    start: startTimestamp,
                    end: endTimestamp,
                    // Request specific columns to minimize payload size
                    columns: [
                        "decklist",
                        "wins",
                        "byes",
                        "draws",
                        "losses"
                    ]
                }),
            });

            if (!response.ok) {
                throw new ExternalServiceError(
                    'Topdeck',
                    `Failed to fetch tournaments: ${response.status} ${response.statusText}`
                );
            }

            const data = await response.json();
            return data as Tournament[];
        } catch (error) {
            this.logger.logError('Error fetching tournaments', error);
            throw error;
        }
    }
}

/**
 * Client for fetching deck data from the Moxfield API.
 * 
 * Moxfield is a popular deck-building website for Magic: The Gathering.
 * This client fetches detailed deck information including:
 * - Commander(s) in the command zone
 * - Mainboard cards with quantities
 * - Card metadata (name, type, Scryfall ID)
 * 
 * ## Rate Limiting Strategy
 * 
 * Moxfield has strict rate limits. This client implements a multi-layer
 * rate limiting strategy:
 * 
 * 1. **Delay Between Requests**: Enforces a minimum delay between requests
 *    (default: 5 seconds = 0.2 requests/second). This prevents hitting rate
 *    limits under normal operation.
 * 
 * 2. **Exponential Backoff**: When a 429 (Too Many Requests) response is
 *    received, the client implements exponential backoff:
 *    - Base delay: 5 seconds
 *    - Multiplier: 2^(consecutive_errors - 1)
 *    - Maximum: 2 minutes
 *    - Random jitter: 0-1000ms (prevents thundering herd)
 * 
 * 3. **Retry Logic**: Automatically retries rate-limited requests up to
 *    5 times with increasing delays.
 * 
 * @example
 * ```typescript
 * const client = new MoxfieldClient();
 * const deck = await client.fetchDeck('abc123');
 * if (deck) {
 *   console.log('Commanders:', deck.boards.commanders);
 *   console.log('Cards:', deck.boards.mainboard.cards);
 * }
 * ```
 */
export class MoxfieldClient {
    private baseUrl: string;
    private userAgent: string;
    /** Minimum milliseconds to wait between requests */
    private requestDelay: number;
    /** Timestamp of last request (for rate limiting) */
    private lastRequestTime: number = 0;
    /** Count of consecutive rate limit errors (for backoff calculation) */
    private consecutiveErrors: number = 0;
    private logger = etlLogger.child({ client: 'moxfield' });

    constructor() {
        this.baseUrl = process.env.MOXFIELD_API_BASE_URL || '';
        this.userAgent = process.env.MOXFIELD_USER_AGENT || '';

        // Calculate delay from requests per second (default: 0.2 = 5 second delay)
        const requestsPerSecond = parseFloat(
            process.env.ETL_REQUESTS_PER_SECOND || String(DEFAULT_REQUESTS_PER_SECOND)
        );
        this.requestDelay = Math.ceil(1000 / requestsPerSecond);

        this.logger.debug('Moxfield client initialized', { 
            delayMs: this.requestDelay,
            requestsPerSecond 
        });

        if (!this.userAgent) {
            this.logger.warn('MOXFIELD_USER_AGENT not set in environment variables');
        }
    }

    /**
     * Fetch deck data from Moxfield by deck ID.
     * 
     * @param deckId - The Moxfield deck ID (from URL: moxfield.com/decks/{deckId})
     * @returns Deck data including commanders and mainboard, or null if not found
     * @throws Error if the request fails (except 404 which returns null)
     */
    async fetchDeck(deckId: string): Promise<MoxfieldDeck | null> {
        // Wrap the actual fetch in retry logic for rate limit handling
        return this.fetchWithRetry(async () => {
            const requestStartTime = Date.now();
            
            // Moxfield requires a User-Agent header to identify the client
            // Without it, requests return 403 Forbidden
            const response = await fetch(`${this.baseUrl}/decks/all/${deckId}`, {
                headers: {
                    'User-Agent': this.userAgent,
                },
            });
            const responseTime = Date.now() - requestStartTime;
            
            if (!response.ok) {
                if (response.status === 404) {
                    // Deck not found (deleted or private) - return null, don't retry
                    this.logger.debug('Deck not found', { deckId, responseTimeMs: responseTime });
                    return null;
                }
                if (response.status === 429) {
                    throw new RateLimitError('Moxfield rate limit exceeded');
                }
                // Other errors will be handled by retry logic
                throw new ExternalServiceError(
                    'Moxfield',
                    `${response.status} ${response.statusText}`
                );
            }
            
            // Parse JSON response
            const jsonStartTime = Date.now();
            const data = await response.json();
            const jsonTime = Date.now() - jsonStartTime;
            
            this.logger.debug('Deck fetched successfully', { 
                deckId, 
                totalMs: Date.now() - requestStartTime, 
                networkMs: responseTime, 
                parseMs: jsonTime 
            });
            
            return data as MoxfieldDeck;
        });
    }

    /**
     * Execute a fetch function with automatic retry on rate limiting.
     * 
     * Implements exponential backoff with jitter:
     * - Base delay: 5 seconds
     * - Each consecutive error doubles the delay
     * - Maximum delay: 2 minutes
     * - Random jitter (0-1000ms) prevents thundering herd
     * 
     * @param fetchFn - The async function to execute
     * @param maxRetries - Maximum retry attempts (default: 5)
     * @returns The result of fetchFn
     * @throws Error if max retries exceeded or non-rate-limit error occurs
     */
    private async fetchWithRetry<T>(
        fetchFn: () => Promise<T>, 
        maxRetries: number = MAX_RETRY_ATTEMPTS
    ): Promise<T> {
        // Calculate current attempt number for logging
        const attempt = MAX_RETRY_ATTEMPTS - maxRetries + 1;
        
        // Enforce minimum delay between requests
        await this.enforceDelay();

        try {
            const result = await fetchFn();
            
            // Success - reset consecutive error count
            this.consecutiveErrors = 0;
            return result;
        } catch (error) {
            // Check if this is a rate limit error
            const isRateLimit = error instanceof RateLimitError ||
                (error instanceof Error &&
                    (error.message.includes('429') || error.message.includes('Too Many Requests')));

            if (isRateLimit) {
                this.consecutiveErrors++;

                // Check if we've exhausted retries
                if (maxRetries <= 0) {
                    this.logger.warn('Max retries exceeded');
                    throw error;
                }

                // Calculate exponential backoff with cap
                // Formula: min(base * 2^(errors-1), max)
                const backoff = Math.min(
                    RETRY_BASE_DELAY_MS * Math.pow(2, this.consecutiveErrors - 1),
                    MAX_BACKOFF_MS
                );

                // Add random jitter to prevent thundering herd problem
                // When multiple requests are rate limited simultaneously, jitter
                // spreads out the retry attempts to avoid hitting the limit again
                const jitter = Math.floor(Math.random() * JITTER_RANGE_MS);
                const totalDelay = backoff + jitter;

                this.logger.warn('Rate limited, backing off', { 
                    attempt,
                    consecutiveErrors: this.consecutiveErrors,
                    backoffMs: backoff,
                    jitterMs: jitter,
                    totalDelayMs: totalDelay,
                    retriesLeft: maxRetries 
                });

                // Wait for the calculated backoff period
                await new Promise(resolve => setTimeout(resolve, totalDelay));

                // Recursive retry with decremented counter
                return this.fetchWithRetry(fetchFn, maxRetries - 1);
            }

            // Non-rate-limit errors are not retried - throw immediately
            this.logger.logError('Non-rate-limit error', error);
            throw error;
        }
    }

    /**
     * Enforce minimum delay between requests to avoid hitting rate limits.
     * 
     * This method calculates how long ago the last request was made and
     * waits if necessary to maintain the configured request rate.
     */
    private async enforceDelay(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.requestDelay) {
            // Need to wait to maintain rate limit
            const waitTime = this.requestDelay - timeSinceLastRequest;
            this.logger.debug('Rate limit delay', { waitMs: waitTime });
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        // Update last request timestamp
        this.lastRequestTime = Date.now();
    }
}
