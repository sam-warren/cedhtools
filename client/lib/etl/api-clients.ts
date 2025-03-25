import { MoxfieldDeck, Tournament } from './types';

export class TopdeckClient {
    private baseUrl: string;
    private apiKey: string;

    constructor() {
        this.baseUrl = process.env.TOPDECK_API_BASE_URL || 'https://topdeck.gg/api/v2';
        this.apiKey = process.env.TOPDECK_API_KEY || '';

        if (!this.apiKey) {
            console.warn('TOPDECK_API_KEY not set in environment variables');
        }
    }

    async fetchTournaments(startDate: string, endDate: string): Promise<Tournament[]> {
        console.log(`Fetching tournaments from ${startDate} to ${endDate}`);

        // Convert ISO date strings to Unix timestamps in seconds
        const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
        const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

        console.log(`Converted to timestamps: ${startTimestamp} to ${endTimestamp}`);

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
                throw new Error(`Failed to fetch tournaments: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data as Tournament[];
        } catch (error) {
            console.error('Error fetching tournaments:', error);
            throw error;
        }
    }
}

export class MoxfieldClient {
    private baseUrl: string;
    private userAgent: string;
    private requestDelay: number;
    private lastRequestTime: number = 0;
    private consecutiveErrors: number = 0;

    constructor() {
        this.baseUrl = process.env.MOXFIELD_API_BASE_URL || ''
        this.userAgent = process.env.MOXFIELD_USER_AGENT || '';

        // Super conservative - one request every 5 seconds (configurable)
        const requestsPerSecond = parseFloat(process.env.ETL_REQUESTS_PER_SECOND || '0.2');
        this.requestDelay = Math.ceil(1000 / requestsPerSecond);

        console.log(`Moxfield client initialized with ${this.requestDelay}ms delay between requests`);

        if (!this.userAgent) {
            console.warn('MOXFIELD_USER_AGENT not set in environment variables');
        }
    }

    async fetchDeck(deckId: string): Promise<MoxfieldDeck | null> {
        // Use fetchWithRetry to benefit from rate limiting and retry logic
        return this.fetchWithRetry(async () => {
            const requestStartTime = Date.now();
            console.log(`[PERF] Moxfield API request starting for deck ${deckId}...`);
            
            const response = await fetch(`${this.baseUrl}/decks/all/${deckId}`);
            const responseTime = Date.now() - requestStartTime;
            
            console.log(`[PERF] Moxfield API response received in ${responseTime}ms for deck ${deckId}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    console.log(`[PERF] Deck ${deckId} not found (404) in ${responseTime}ms`);
                    return null;
                }
                console.error(`[PERF] Failed fetch for ${deckId}: ${response.status} ${response.statusText} in ${responseTime}ms`);
                throw new Error(`Failed to fetch deck: ${response.statusText}`);
            }
            
            const jsonStartTime = Date.now();
            const data = await response.json();
            const jsonTime = Date.now() - jsonStartTime;
            
            const totalTime = Date.now() - requestStartTime;
            console.log(`[PERF] Moxfield API complete for deck ${deckId}: ${totalTime}ms (Network: ${responseTime}ms, JSON parse: ${jsonTime}ms)`);
            
            return data as MoxfieldDeck;
        });
    }

    private async fetchWithRetry<T>(fetchFn: () => Promise<T>, maxRetries = 5): Promise<T> {
        // Track retry attempt number for logging
        const attempt = 5 - maxRetries + 1;
        
        console.log(`[RETRY] Starting attempt ${attempt}/${5}`);
        
        // Wait for the minimum delay since last request
        await this.enforceDelay();

        try {
            const requestStartTime = Date.now();
            const result = await fetchFn();
            const requestTime = Date.now() - requestStartTime;
            
            // Success - reset error count
            this.consecutiveErrors = 0;
            console.log(`[RETRY] Attempt ${attempt} succeeded in ${requestTime}ms`);
            return result;
        } catch (error) {
            // Handle rate limiting
            if (error instanceof Error &&
                (error.message.includes('429') || error.message.includes('Too Many Requests'))) {

                this.consecutiveErrors++;

                if (maxRetries <= 0) {
                    console.error('[RETRY] Max retries exceeded:', error);
                    throw error;
                }

                // Calculate backoff - start with 5s, then increase exponentially with jitter
                const baseDelay = 5000;
                const backoff = Math.min(
                    baseDelay * Math.pow(2, this.consecutiveErrors - 1),
                    120000 // max 2 minutes
                );

                // Add random jitter (0-1000ms)
                const jitter = Math.floor(Math.random() * 1000);
                const totalDelay = backoff + jitter;

                console.warn(`[RETRY] Attempt ${attempt} rate limited (429) by Moxfield. Consecutive errors: ${this.consecutiveErrors}`);
                console.warn(`[RETRY] Backoff calculation: base=${baseDelay}ms, multiplier=${Math.pow(2, this.consecutiveErrors - 1)}, jitter=${jitter}ms`);
                console.warn(`[RETRY] Will retry in ${Math.round(totalDelay / 1000)}s. Retries left: ${maxRetries}`);

                // Wait for the backoff period
                await new Promise(resolve => setTimeout(resolve, totalDelay));
                console.log(`[RETRY] Backoff complete, attempting retry ${attempt + 1}`);

                // Try again with one fewer retry
                return this.fetchWithRetry(fetchFn, maxRetries - 1);
            }

            // For non-rate-limit errors, just throw
            console.error(`[RETRY] Non-rate-limit error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    private async enforceDelay(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        console.log(`[RATE-LIMIT] Config: ${this.requestDelay}ms between requests`);
        console.log(`[RATE-LIMIT] Time since last request: ${timeSinceLastRequest}ms`);
        
        if (timeSinceLastRequest < this.requestDelay) {
            const waitTime = this.requestDelay - timeSinceLastRequest;
            console.log(`[RATE-LIMIT] Waiting ${waitTime}ms before next Moxfield request (${new Date().toISOString()})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            console.log(`[RATE-LIMIT] Done waiting, proceeding with request at ${new Date().toISOString()}`);
        } else {
            console.log(`[RATE-LIMIT] No delay needed, proceeding immediately (${timeSinceLastRequest}ms since last request)`);
        }

        this.lastRequestTime = Date.now();
    }
} 