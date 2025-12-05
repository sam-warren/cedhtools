/**
 * Topdeck API Client
 * 
 * Client for fetching tournament data from the Topdeck API.
 * 
 * As of 2024, Topdeck includes deck data directly via their Scrollrack
 * integration, eliminating the need for separate Moxfield API calls.
 * The deck data includes Scryfall UUIDs for card identification.
 */

import type { Tournament } from '@/lib/types/etl';
import { etlLogger } from '@/lib/logger';
import { ExternalServiceError } from '@/lib/errors';

/**
 * Default Topdeck API base URL.
 * Can be overridden by TOPDECK_API_BASE_URL env var.
 */
export const DEFAULT_TOPDECK_API_URL = 'https://topdeck.gg/api/v2';

/**
 * Client for fetching tournament data from the Topdeck API.
 * 
 * Topdeck.gg is a platform for organizing and tracking Magic: The Gathering
 * tournaments. This client fetches EDH (Commander) tournament results including
 * rounds with tables showing seat positions and winners.
 * 
 * ## Data Structure
 * 
 * Tournament data includes rounds, each containing tables.
 * Players at each table are listed in seat order (index 0 = seat 1, etc.).
 * Each table has a winner field indicating who won.
 * 
 * Deck data is provided via Scrollrack integration in `deckObj`:
 * - Commanders with Scryfall UUIDs
 * - Mainboard cards with Scryfall UUIDs
 * 
 * @example
 * ```typescript
 * import { TopdeckClient } from '@/lib/api/topdeck';
 * 
 * const client = new TopdeckClient();
 * const tournaments = await client.fetchTournaments('2024-01-01', '2024-01-31');
 * 
 * for (const tournament of tournaments) {
 *   for (const round of tournament.rounds) {
 *     for (const table of round.tables) {
 *       console.log('Winner:', table.winner);
 *       table.players.forEach((player, seat) => {
 *         console.log(`Seat ${seat + 1}:`, player.name);
 *       });
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
     * Returns tournaments with rounds containing tables and player data.
     * Each table has players in seat order and a winner field.
     * 
     * @param startDate - Start date in YYYY-MM-DD format
     * @param endDate - End date in YYYY-MM-DD format
     * @returns Array of tournaments with rounds data
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
                    // Request rounds data with deck objects for seat position tracking
                    columns: [
                        "rounds",
                        "decklist",
                        "deckObj"
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

