/**
 * Decklist Parser
 *
 * Parses Moxfield plaintext format decklists.
 * Format: "N Cardname" where N is the quantity.
 *
 * Commander selection is handled separately via the UI.
 */

export interface ParsedCard {
  name: string;
  quantity: number;
}

/**
 * Parse a single card line in format "N Cardname" or "Nx Cardname"
 * Returns null if the line is not a valid card line.
 *
 * Examples:
 * - "1 Ancient Tomb"
 * - "1x Sol Ring"
 * - "1 Thassa's Oracle"
 * - "1 Ancient Tomb (TMP) 315" (set codes are stripped)
 */
function parseCardLine(line: string): ParsedCard | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Skip comments
  if (trimmed.startsWith("//") || trimmed.startsWith("#")) return null;

  // Match "N Cardname" or "Nx Cardname" pattern
  // Ignores optional set codes and collector numbers at the end
  const match = trimmed.match(/^(\d+)\s*x?\s+(.+?)(?:\s+\([A-Z0-9]+\).*)?$/i);
  if (!match) return null;

  const quantity = parseInt(match[1], 10);
  let name = match[2].trim();

  // Clean up card name - remove trailing markers
  name = name
    .replace(/\s*\*F\*\s*$/, "") // Foil marker
    .replace(/\s*#\d+\s*$/, "") // Collector number
    .trim();

  if (quantity > 0 && quantity <= 100 && name) {
    return { name, quantity };
  }

  return null;
}

/**
 * Parse a Moxfield plaintext format decklist.
 *
 * Returns an array of parsed cards. Commander selection
 * is handled separately via the UI selector.
 *
 * @param decklist - Raw decklist text
 * @returns Array of parsed cards
 */
export function parseDecklist(decklist: string): ParsedCard[] {
  const cards: ParsedCard[] = [];
  const lines = decklist.split(/\r?\n/);

  for (const line of lines) {
    const card = parseCardLine(line);
    if (card) {
      cards.push(card);
    }
  }

  return cards;
}

/**
 * Get all unique card names from a parsed decklist.
 */
export function getCardNames(cards: ParsedCard[]): string[] {
  return [...new Set(cards.map((c) => c.name))];
}

/**
 * Get total card count from a parsed decklist.
 */
export function getTotalCards(cards: ParsedCard[]): number {
  return cards.reduce((sum, card) => sum + card.quantity, 0);
}

/**
 * Format a decklist back to Moxfield plaintext format.
 * Useful for display or export.
 */
export function formatDecklist(cards: ParsedCard[]): string {
  return cards.map((card) => `${card.quantity} ${card.name}`).join("\n");
}

/**
 * Prepare a decklist for Scrollrack validation.
 * Converts to TopDeck format with commander section.
 *
 * @param decklist - Raw decklist text
 * @param commanderName - Selected commander name (may include " / " for partners)
 * @returns Formatted decklist string for validation API
 */
export function prepareForValidation(
  decklist: string,
  commanderName: string
): string {
  const cards = parseDecklist(decklist);
  const lines: string[] = [];

  // Add commanders section
  lines.push("~~Commanders~~");

  // Parse commander name (might be "Name1 / Name2" for partners)
  const commanderNames = commanderName.split(" / ");
  for (const name of commanderNames) {
    lines.push(`1 ${name.trim()}`);
  }

  lines.push("");

  // Add mainboard section
  lines.push("~~Mainboard~~");
  for (const card of cards) {
    lines.push(`${card.quantity} ${card.name}`);
  }

  return lines.join("\n");
}
