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

export class Scryfall {
    private static cache: Map<string, ScryfallCard> = new Map();

    /**
     * Fetches card data from Scryfall by ID
     */
    static async getCard(scryfallId: string): Promise<ScryfallCard | null> {
        // Check cache first
        if (this.cache.has(scryfallId)) {
            return this.cache.get(scryfallId) || null;
        }

        try {
            const response = await fetch(`https://api.scryfall.com/cards/${scryfallId}`);

            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`Card with ID ${scryfallId} not found on Scryfall`);
                    return null;
                }

                throw new Error(`${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Cache the result
            this.cache.set(scryfallId, data);

            return data;
        } catch (error) {
            console.error(`Error fetching card ${scryfallId} from Scryfall:`, error);
            return null;
        }
    }

    /**
     * Search for cards by name
     */
    static async searchByName(name: string): Promise<ScryfallCard[]> {
        try {
            const response = await fetch(
                `https://api.scryfall.com/cards/search?q=${encodeURIComponent(name)}`
            );

            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            return data.data || [];
        } catch (error) {
            console.error(`Error searching for card "${name}" on Scryfall:`, error);
            return [];
        }
    }
} 