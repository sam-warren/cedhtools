/**
 * Scryfall API Client
 * 
 * Client for resolving card names to Scryfall UUIDs using the Scryfall API.
 * Used for user deck uploads where we need to convert text-based deck lists
 * to Scryfall IDs for matching against our tournament statistics.
 * 
 * ## API Information
 * 
 * Scryfall has a generous API policy:
 * - No authentication required
 * - Rate limit: ~10 requests/second (we're conservative)
 * - Batch endpoint: /cards/collection supports up to 75 cards per request
 * 
 * @see https://scryfall.com/docs/api
 */

import { etlLogger } from '../logger';

const logger = etlLogger.child({ client: 'scryfall' });

/**
 * Scryfall API base URL
 */
const SCRYFALL_API_BASE = 'https://api.scryfall.com';

/**
 * Maximum cards per collection request (Scryfall limit)
 */
const MAX_CARDS_PER_REQUEST = 75;

/**
 * Delay between requests to be respectful of rate limits (ms)
 */
const REQUEST_DELAY_MS = 100;

/**
 * Card identifier for Scryfall collection lookup
 */
export interface ScryfallIdentifier {
    /** Card name for fuzzy matching */
    name: string;
}

/**
 * Scryfall card data (subset of full response)
 */
export interface ScryfallCard {
    /** Scryfall UUID */
    id: string;
    /** Oracle ID (consistent across printings) */
    oracle_id: string;
    /** Card name */
    name: string;
    /** Full type line */
    type_line: string;
    /** Mana cost */
    mana_cost?: string;
    /** Card image URIs */
    image_uris?: {
        small: string;
        normal: string;
        large: string;
        png: string;
        art_crop: string;
        border_crop: string;
    };
    /** For double-faced cards */
    card_faces?: Array<{
        name: string;
        type_line: string;
        mana_cost?: string;
        image_uris?: {
            small: string;
            normal: string;
            large: string;
        };
    }>;
}

/**
 * Scryfall collection response
 */
interface ScryfallCollectionResponse {
    /** Cards that were found */
    data: ScryfallCard[];
    /** Cards that were not found */
    not_found: ScryfallIdentifier[];
}

/**
 * Result of resolving a deck list
 */
export interface ResolvedDeck {
    /** Successfully resolved cards */
    cards: Array<{
        name: string;
        scryfall_id: string;
        type_line: string;
        quantity: number;
    }>;
    /** Cards that couldn't be resolved */
    notFound: string[];
}

/**
 * Parsed deck entry from text input
 */
export interface ParsedDeckEntry {
    quantity: number;
    name: string;
}

/**
 * Parse a text-based deck list into card entries.
 * 
 * Supports common formats:
 * - "1 Sol Ring"
 * - "1x Sol Ring"
 * - "Sol Ring" (assumes quantity 1)
 * - Lines starting with // or # are ignored (comments)
 * - Empty lines are ignored
 * 
 * @param deckList - Raw text deck list
 * @returns Array of parsed card entries
 */
export function parseDeckList(deckList: string): ParsedDeckEntry[] {
    const lines = deckList.split('\n');
    const entries: ParsedDeckEntry[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) {
            continue;
        }

        // Skip section headers (common in deck exports)
        if (trimmed.startsWith('Deck') || 
            trimmed.startsWith('Sideboard') || 
            trimmed.startsWith('Commander') ||
            trimmed.startsWith('Mainboard') ||
            trimmed.startsWith('~~')) {
            continue;
        }

        // Try to parse quantity and card name
        // Format: "1 Card Name" or "1x Card Name" or just "Card Name"
        const match = trimmed.match(/^(\d+)x?\s+(.+)$/i);
        
        if (match) {
            entries.push({
                quantity: parseInt(match[1], 10),
                name: match[2].trim()
            });
        } else {
            // Assume quantity of 1 if no number prefix
            entries.push({
                quantity: 1,
                name: trimmed
            });
        }
    }

    return entries;
}

/**
 * Resolve card names to Scryfall IDs using the collection endpoint.
 * 
 * Handles batching automatically for large deck lists.
 * 
 * @param cardNames - Array of card names to resolve
 * @returns Map of card name to Scryfall card data
 */
export async function resolveCardNames(
    cardNames: string[]
): Promise<Map<string, ScryfallCard>> {
    const results = new Map<string, ScryfallCard>();
    
    // Deduplicate card names
    const uniqueNames = [...new Set(cardNames)];
    
    // Process in batches of MAX_CARDS_PER_REQUEST
    for (let i = 0; i < uniqueNames.length; i += MAX_CARDS_PER_REQUEST) {
        const batch = uniqueNames.slice(i, i + MAX_CARDS_PER_REQUEST);
        
        const identifiers: ScryfallIdentifier[] = batch.map(name => ({ name }));
        
        try {
            const response = await fetch(`${SCRYFALL_API_BASE}/cards/collection`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ identifiers }),
            });

            if (!response.ok) {
                logger.warn('Scryfall collection request failed', { 
                    status: response.status,
                    batch: batch.length 
                });
                continue;
            }

            const data: ScryfallCollectionResponse = await response.json();
            
            // Map results by name (case-insensitive)
            for (const card of data.data) {
                // Handle double-faced cards - use front face name for matching
                const matchName = card.card_faces?.[0]?.name || card.name;
                results.set(matchName.toLowerCase(), card);
                
                // Also map the full name for DFCs like "Growing Rites of Itlimoc // Itlimoc, Cradle of the Sun"
                results.set(card.name.toLowerCase(), card);
            }

            // Log not found cards for debugging
            if (data.not_found.length > 0) {
                logger.debug('Some cards not found', { 
                    notFound: data.not_found.map(c => c.name) 
                });
            }
        } catch (error) {
            logger.logError('Error resolving cards', error);
        }

        // Respect rate limits
        if (i + MAX_CARDS_PER_REQUEST < uniqueNames.length) {
            await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));
        }
    }

    return results;
}

/**
 * Resolve a full deck list from text to Scryfall IDs.
 * 
 * @param deckList - Raw text deck list
 * @returns Resolved deck with cards and not found entries
 */
export async function resolveDeckList(deckList: string): Promise<ResolvedDeck> {
    const entries = parseDeckList(deckList);
    
    if (entries.length === 0) {
        return { cards: [], notFound: [] };
    }

    const cardNames = entries.map(e => e.name);
    const resolved = await resolveCardNames(cardNames);

    const cards: ResolvedDeck['cards'] = [];
    const notFound: string[] = [];

    for (const entry of entries) {
        const card = resolved.get(entry.name.toLowerCase());
        
        if (card) {
            cards.push({
                name: card.name,
                scryfall_id: card.id,
                type_line: card.type_line,
                quantity: entry.quantity
            });
        } else {
            notFound.push(entry.name);
        }
    }

    return { cards, notFound };
}

/**
 * Fetch a single card by name (fuzzy search)
 * 
 * @param name - Card name to search for
 * @returns Scryfall card data or null if not found
 */
export async function fetchCardByName(name: string): Promise<ScryfallCard | null> {
    try {
        const response = await fetch(
            `${SCRYFALL_API_BASE}/cards/named?fuzzy=${encodeURIComponent(name)}`
        );

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Scryfall API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        logger.logError('Error fetching card by name', error);
        return null;
    }
}

