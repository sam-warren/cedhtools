import { MoxfieldDeck, Tournament, MoxfieldCard, MoxfieldCardData } from './types';

// Card type mapping
const TYPE_MAPPING = {
    BATTLE: 1,
    PLANESWALKER: 2,
    CREATURE: 3,
    SORCERY: 4,
    INSTANT: 5,
    ARTIFACT: 6,
    ENCHANTMENT: 7,
    LAND: 8,
    UNKNOWN: 0
};

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
            return data;
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
        return this.fetchWithRetry(async () => {
            console.log(`Fetching deck ${deckId} from Moxfield`);

            const response = await fetch(`${this.baseUrl}/${deckId}`, {
                headers: {
                    'User-Agent': this.userAgent
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`Deck ${deckId} not found on Moxfield`);
                    return null;
                }

                throw new Error(`${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Transform the data into our MoxfieldDeck format
            return {
                name: data.name,
                mainboard: {
                    cards: this.transformCards(data.boards.mainboard.cards),
                },
                commanders: {
                    cards: this.transformCards(data.boards.commanders.cards),
                },
            };
        });
    }

    private async fetchWithRetry<T>(fetchFn: () => Promise<T>, maxRetries = 5): Promise<T> {
        // Wait for the minimum delay since last request
        await this.enforceDelay();

        try {
            const result = await fetchFn();
            // Success - reset error count
            this.consecutiveErrors = 0;
            return result;
        } catch (error) {
            // Handle rate limiting
            if (error instanceof Error &&
                (error.message.includes('429') || error.message.includes('Too Many Requests'))) {

                this.consecutiveErrors++;

                if (maxRetries <= 0) {
                    console.error('Max retries exceeded:', error);
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

                console.warn(`Rate limited by Moxfield. Retry in ${Math.round(totalDelay / 1000)}s. Retries left: ${maxRetries}`);

                // Wait for the backoff period
                await new Promise(resolve => setTimeout(resolve, totalDelay));

                // Try again with one fewer retry
                return this.fetchWithRetry(fetchFn, maxRetries - 1);
            }

            // For non-rate-limit errors, just throw
            throw error;
        }
    }

    private async enforceDelay(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.requestDelay) {
            const waitTime = this.requestDelay - timeSinceLastRequest;
            console.log(`Waiting ${waitTime}ms before next Moxfield request`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        this.lastRequestTime = Date.now();
    }

    private transformCards(cardsObject: Record<string, MoxfieldCardData>): MoxfieldCard[] {
        return Object.values(cardsObject).map(cardData => ({
            quantity: cardData.quantity,
            card: {
                name: cardData.card.name,
                uniqueCardId: cardData.card.uniqueCardId || cardData.card.id || '',
                scryfallId: cardData.card.scryfall_id || cardData.card.scryfallId || '',
                type: cardData.card.type || TYPE_MAPPING.UNKNOWN,
                type_line: cardData.card.type_line || ''
            },
        }));
    }
} 