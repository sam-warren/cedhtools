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
 */

import { MoxfieldCardEntry } from '@/lib/etl/types';

/**
 * Generate a consistent, unique identifier for a commander or commander pair.
 * 
 * For partner commanders, the IDs are sorted alphabetically before concatenation.
 * This ensures "Thrasios + Tymna" produces the same ID as "Tymna + Thrasios".
 * 
 * @param commanderCards - Array of commander card entries from Moxfield
 * @returns Unique identifier string (single ID or "id1_id2" for partners)
 * 
 * @example
 * ```typescript
 * // Single commander
 * const id = generateCommanderId([{ card: { uniqueCardId: 'abc123', name: 'Kinnan' } }]);
 * // Returns: "abc123"
 * 
 * // Partner commanders (order doesn't matter)
 * const partnerId = generateCommanderId([
 *   { card: { uniqueCardId: 'tymna', name: 'Tymna the Weaver' } },
 *   { card: { uniqueCardId: 'thrasios', name: 'Thrasios, Triton Hero' } }
 * ]);
 * // Returns: "thrasios_tymna" (sorted alphabetically)
 * ```
 */
export function generateCommanderId(commanderCards: MoxfieldCardEntry[]): string {
  // Sort by uniqueCardId to ensure consistent ordering for partner commanders
  const sortedCards = [...commanderCards].sort((a, b) =>
    (a.card.uniqueCardId || '').localeCompare(b.card.uniqueCardId || '')
  );

  return sortedCards.map(card => card.card.uniqueCardId || '').join('_');
}

/**
 * Generate a human-readable name for a commander or commander pair.
 * 
 * For partner commanders, names are joined with " + " separator.
 * Note: Unlike generateCommanderId, names are NOT sorted - they preserve
 * the original order for display purposes.
 * 
 * @param commanderCards - Array of commander card entries
 * @returns Display name (e.g., "Tymna the Weaver + Thrasios, Triton Hero")
 * 
 * @example
 * ```typescript
 * const name = generateCommanderName([
 *   { card: { name: 'Thrasios, Triton Hero' } },
 *   { card: { name: 'Tymna the Weaver' } }
 * ]);
 * // Returns: "Thrasios, Triton Hero + Tymna the Weaver"
 * ```
 */
export function generateCommanderName(commanderCards: MoxfieldCardEntry[]): string {
  return commanderCards.map(card => card.card.name || 'Unknown Commander').join(' + ');
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
 * @returns Array of individual commander IDs
 * 
 * @example
 * ```typescript
 * getIndividualCommanderIds('abc123'); // ['abc123']
 * getIndividualCommanderIds('abc_xyz'); // ['abc', 'xyz']
 * ```
 */
export function getIndividualCommanderIds(commanderId: string): string[] {
  return commanderId.split('_');
}

