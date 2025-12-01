/**
 * Scryfall API Module
 * 
 * Provides card name resolution using the Scryfall API.
 * Used for converting user deck lists (text format) to Scryfall IDs
 * for matching against tournament statistics.
 */

export {
    parseDeckList,
    resolveCardNames,
    resolveDeckList,
    fetchCardByName,
    type ScryfallCard,
    type ScryfallIdentifier,
    type ResolvedDeck,
    type ParsedDeckEntry,
} from './client';

