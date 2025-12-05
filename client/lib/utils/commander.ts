/**
 * Commander Utilities
 * 
 * Shared utilities for working with commanders in cEDH decks.
 * 
 * ## Commander Identification
 * 
 * In cEDH, a deck's identity is determined by its commander(s):
 * - **Single Commander**: One legendary creature in the command zone
 * - **Partner Commanders**: Two commanders with the "Partner" ability
 * 
 * For consistent data aggregation, we need to identify commanders
 * in a way that:
 * 1. Is unique to each commander/pair
 * 2. Is consistent regardless of input order (for partners)
 * 3. Can be used as a database key
 * 
 * ## ID Format
 * 
 * As of the Topdeck/Scryfall migration, commander IDs use Scryfall UUIDs:
 * - Single: "584cee10-f18c-4633-95cc-f2e7a11841ac"
 * - Partners: "3d867016-2601-4a37-a73d-308898d3bd37_584cee10-f18c-4633-95cc-f2e7a11841ac" (sorted)
 */

import type { TopdeckCardEntry } from '@/lib/types/etl';

/**
 * Commander card data structure for ID generation.
 * Can be from Topdeck deckObj format.
 */
export interface CommanderCard {
  /** Card name */
  name: string;
  /** Scryfall UUID */
  id: string;
}

/**
 * Generate a consistent, unique identifier for a commander or commander pair.
 * 
 * For partner commanders, the IDs are sorted alphabetically before concatenation.
 * This ensures "Thrasios + Tymna" produces the same ID as "Tymna + Thrasios".
 * 
 * @param commanders - Object mapping card names to their Scryfall IDs (from deckObj.Commanders)
 * @returns Unique identifier string (single UUID or "uuid1_uuid2" for partners, sorted)
 * 
 * @example
 * ```typescript
 * // Single commander
 * const id = generateCommanderId({ "Kinnan, Bonder Prodigy": { id: "abc-123", count: 1 } });
 * // Returns: "abc-123"
 * 
 * // Partner commanders (order doesn't matter in output)
 * const partnerId = generateCommanderId({
 *   "Tymna the Weaver": { id: "tymna-uuid", count: 1 },
 *   "Thrasios, Triton Hero": { id: "thrasios-uuid", count: 1 }
 * });
 * // Returns: "thrasios-uuid_tymna-uuid" (sorted alphabetically by UUID)
 * ```
 */
export function generateCommanderId(commanders: Record<string, TopdeckCardEntry>): string {
  const ids = Object.values(commanders).map(entry => entry.id);
  
  // Sort IDs alphabetically to ensure consistent ordering for partner commanders
  ids.sort((a, b) => a.localeCompare(b));
  
  return ids.join('_');
}

/**
 * Generate a human-readable name for a commander or commander pair.
 * 
 * For partner commanders, names are joined with " + " separator.
 * Names are sorted alphabetically for consistency.
 * 
 * @param commanders - Object mapping card names to their entries (from deckObj.Commanders)
 * @returns Display name (e.g., "Thrasios, Triton Hero + Tymna the Weaver")
 * 
 * @example
 * ```typescript
 * const name = generateCommanderName({
 *   "Thrasios, Triton Hero": { id: "abc", count: 1 },
 *   "Tymna the Weaver": { id: "xyz", count: 1 }
 * });
 * // Returns: "Thrasios, Triton Hero + Tymna the Weaver" (sorted alphabetically)
 * ```
 */
export function generateCommanderName(commanders: Record<string, TopdeckCardEntry>): string {
  const names = Object.keys(commanders);
  
  // Sort names alphabetically for consistency
  names.sort((a, b) => a.localeCompare(b));
  
  return names.join(' + ');
}

/**
 * Check if a commander ID represents a partner pair.
 * 
 * @param commanderId - Commander ID to check
 * @returns True if the ID contains an underscore (partner pair indicator)
 */
export function isPartnerPair(commanderId: string): boolean {
  return commanderId.includes('_');
}

/**
 * Extract individual commander IDs from a (potentially partnered) commander ID.
 * 
 * @param commanderId - Commander ID (may be single or partnered)
 * @returns Array of individual Scryfall UUIDs
 * 
 * @example
 * ```typescript
 * getIndividualCommanderIds('abc-123'); // ['abc-123']
 * getIndividualCommanderIds('abc-123_xyz-456'); // ['abc-123', 'xyz-456']
 * ```
 */
export function getIndividualCommanderIds(commanderId: string): string[] {
  return commanderId.split('_');
}

/**
 * Convert Topdeck deckObj.Commanders to an array of CommanderCard objects.
 * 
 * @param commanders - Commanders object from deckObj
 * @returns Array of CommanderCard objects
 */
export function commandersToArray(commanders: Record<string, TopdeckCardEntry>): CommanderCard[] {
  return Object.entries(commanders).map(([name, entry]) => ({
    name,
    id: entry.id,
  }));
}
