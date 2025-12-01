/**
 * API Clients for External Data Sources
 * 
 * This module provides the client for fetching data from Topdeck.
 * 
 * As of 2024, Topdeck includes deck data directly via their Scrollrack
 * integration, eliminating the need for separate Moxfield API calls.
 * The deck data includes Scryfall UUIDs for card identification.
 */

import { Tournament } from './types';
import { DEFAULT_TOPDECK_API_URL } from './constants';
import { etlLogger } from '../logger';
import { ExternalServiceError } from '../errors';

/**
 * Client for fetching tournament data from the Topdeck API.
 * 
 * Topdeck.gg is a platform for organizing and tracking Magic: The Gathering
 * tournaments. This client fetches EDH (Commander) tournament results including
 * player standings and deck data (via Scrollrack integration).
 * 
 * ## Deck Data
 * 
 * As of 2024, Topdeck provides deck data directly in the `deckObj` field
 * of each standing. This includes:
 * - Commanders with Scryfall UUIDs
 * - Mainboard cards with Scryfall UUIDs
 * - Metadata about the deck source
 * 
 * This eliminates the need for separate Moxfield API calls and rate limiting.
 * 
 * @example
 * ```typescript
 * const client = new TopdeckClient();
 * const tournaments = await client.fetchTournaments('2024-01-01', '2024-01-31');
 * 
 * for (const tournament of tournaments) {
 *   for (const standing of tournament.standings) {
 *     if (standing.deckObj) {
 *       console.log('Commanders:', standing.deckObj.Commanders);
 *       console.log('Mainboard:', standing.deckObj.Mainboard);
 *     }
 *   }
 * }
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
     * Returns tournaments with standings that include deck data via `deckObj`.
     * Standings without `deckObj` (null) should be skipped during processing.
     * 
     * @param startDate - Start date in YYYY-MM-DD format
     * @param endDate - End date in YYYY-MM-DD format
     * @returns Array of tournaments with standings including deck data
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
                    // Request columns including deckObj for Scrollrack data
                    columns: [
                        "decklist",
                        "deckObj",
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
            
            this.logger.debug('Tournaments fetched', { count: data.length });
            
            return data as Tournament[];
        } catch (error) {
            this.logger.logError('Error fetching tournaments', error);
            throw error;
        }
    }
}
