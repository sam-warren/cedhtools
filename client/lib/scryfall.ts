interface ScryfallCard {
    id: string;
    name: string;
    type_line: string;
    cmc: number;
    mana_cost?: string;
    oracle_text?: string;
    power?: string;
    toughness?: string;
    colors?: string[];
    color_identity?: string[];
    image_uris?: {
        small: string;
        normal: string;
        large: string;
        png: string;
        art_crop: string;
        border_crop: string;
    };
}

interface ScryfallResponse {
    data: ScryfallCard[];
}

export class ScryfallClient {
    private cache: Map<string, ScryfallCard>;

    constructor() {
        this.cache = new Map();
    }

    /**
     * Fetches card data from Scryfall by ID
     */
    async fetchCard(scryfallId: string): Promise<ScryfallCard | null> {
        if (this.cache.has(scryfallId)) {
            return this.cache.get(scryfallId) || null;
        }

        try {
            const response = await fetch(`https://api.scryfall.com/cards/${scryfallId}`);
            if (!response.ok) {
                return null;
            }
            const data = await response.json() as ScryfallCard;
            this.cache.set(scryfallId, data);
            return data;
        } catch (error) {
            console.error('Error fetching card from Scryfall:', error);
            return null;
        }
    }

    /**
     * Search for cards by name
     */
    async searchCards(query: string): Promise<ScryfallCard[]> {
        try {
            const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                return [];
            }
            const data = await response.json() as ScryfallResponse;
            return data.data || [];
        } catch (error) {
            console.error('Error searching cards on Scryfall:', error);
            return [];
        }
    }
} 