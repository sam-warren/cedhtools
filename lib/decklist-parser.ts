/**
 * Decklist Parser
 * 
 * Handles parsing and normalizing decklists from different formats:
 * - Moxfield plaintext format
 * - TopDeck.gg format (used by scrollrack)
 */

export interface ParsedCard {
  count: number;
  name: string;
}

export interface ParsedDecklist {
  commanders: ParsedCard[];
  mainboard: ParsedCard[];
}

/**
 * Detects if a decklist is in TopDeck format (has ~~Commanders~~ or ~~Mainboard~~ markers)
 */
export function isTopDeckFormat(decklist: string): boolean {
  // Check for both escaped and unescaped markers
  return decklist.includes('~~Commanders~~') || 
         decklist.includes('~~Mainboard~~') ||
         decklist.includes('\\n~~Commanders~~') ||
         decklist.includes('\\n~~Mainboard~~');
}

/**
 * Parse a single card line in format "count name" or "count name (set) collector#"
 * Returns null if the line is not a valid card line
 */
function parseCardLine(line: string): ParsedCard | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  
  // Skip section markers
  if (trimmed.startsWith('~~') && trimmed.endsWith('~~')) return null;
  
  // Match "count name" pattern, ignoring set codes and collector numbers
  // Examples:
  // "1 Ancient Tomb"
  // "1 Ancient Tomb (TMP) 315"
  // "1 Thassa's Oracle"
  const match = trimmed.match(/^(\d+)\s+(.+?)(?:\s+\([A-Z0-9]+\).*)?$/);
  if (!match) return null;
  
  const count = parseInt(match[1], 10);
  let name = match[2].trim();
  
  // Remove any trailing set info that might have been missed
  // Some formats put it without parentheses
  name = name.replace(/\s+\*F\*\s*$/, ''); // Foil marker
  name = name.replace(/\s+#\d+\s*$/, ''); // Collector number
  
  if (count > 0 && name) {
    return { count, name };
  }
  
  return null;
}

/**
 * Parse a TopDeck.gg format decklist
 * Format: ~~Commanders~~\n1 Name\n\n~~Mainboard~~\n1 Name...
 * May have escaped newlines (\\n) or actual newlines
 */
export function parseTopDeckFormat(decklist: string): ParsedDecklist {
  // First, unescape the decklist if needed
  let normalized = decklist
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"');
  
  const commanders: ParsedCard[] = [];
  const mainboard: ParsedCard[] = [];
  
  // Split into sections
  const commanderMatch = normalized.match(/~~Commanders~~\s*([\s\S]*?)(?=~~|$)/i);
  const mainboardMatch = normalized.match(/~~Mainboard~~\s*([\s\S]*?)(?=~~|$)/i);
  
  if (commanderMatch) {
    const lines = commanderMatch[1].split('\n');
    for (const line of lines) {
      const card = parseCardLine(line);
      if (card) commanders.push(card);
    }
  }
  
  if (mainboardMatch) {
    const lines = mainboardMatch[1].split('\n');
    for (const line of lines) {
      const card = parseCardLine(line);
      if (card) mainboard.push(card);
    }
  }
  
  return { commanders, mainboard };
}

/**
 * Parse a Moxfield plaintext format decklist
 * Format: Simple "count name" lines, with commanders typically first (before blank line)
 * 
 * Note: Without explicit commander markers, this assumes the decklist
 * doesn't include commander separation - commanders should be selected separately
 */
export function parseMoxfieldFormat(decklist: string): ParsedDecklist {
  const mainboard: ParsedCard[] = [];
  
  const lines = decklist.split('\n');
  
  for (const line of lines) {
    const card = parseCardLine(line);
    if (card) {
      mainboard.push(card);
    }
  }
  
  // Moxfield format doesn't distinguish commanders from mainboard
  // The commander selection will be handled separately via the UI
  return { commanders: [], mainboard };
}

/**
 * Parse a decklist string, auto-detecting the format
 */
export function parseDecklist(decklist: string): ParsedDecklist {
  if (isTopDeckFormat(decklist)) {
    return parseTopDeckFormat(decklist);
  }
  return parseMoxfieldFormat(decklist);
}

/**
 * Convert a parsed decklist to TopDeck format string for Scrollrack validation
 */
export function toTopDeckFormat(parsed: ParsedDecklist, commanderName?: string): string {
  const lines: string[] = [];
  
  // Add commanders section
  lines.push('~~Commanders~~');
  
  // If we have parsed commanders, use those
  if (parsed.commanders.length > 0) {
    for (const card of parsed.commanders) {
      lines.push(`${card.count} ${card.name}`);
    }
  } else if (commanderName) {
    // Otherwise use the selected commander from the UI
    // Parse the commander name (might be "Name1 / Name2" for partners)
    const commanderNames = commanderName.split(' / ');
    for (const name of commanderNames) {
      lines.push(`1 ${name.trim()}`);
    }
  }
  
  lines.push('');
  
  // Add mainboard section
  lines.push('~~Mainboard~~');
  for (const card of parsed.mainboard) {
    lines.push(`${card.count} ${card.name}`);
  }
  
  return lines.join('\n');
}

/**
 * Prepare a decklist for Scrollrack validation
 * - Parses the input format
 * - Converts to TopDeck format
 * - Includes commander from UI selection if not in decklist
 */
export function prepareForValidation(decklist: string, selectedCommander?: string): string {
  const parsed = parseDecklist(decklist);
  return toTopDeckFormat(parsed, selectedCommander);
}

