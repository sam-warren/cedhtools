import symbologyData from "@/lib/data/symbology/index.json";
import type { ManaSymbol, ParsedManaCost } from "@/lib/types/mana-symbols";

const symbolMap = new Map<string, ManaSymbol>(
  symbologyData.map((symbol): [string, ManaSymbol] => [symbol.symbol, symbol as ManaSymbol])
);

// Cache for parsed mana costs to avoid re-computation
const manaCache = new Map<string, ParsedManaCost>();

/**
 * Parse a mana cost a string into its component symbols
 * @param manaCost - A string like "{2}{W}{W}"
 * @returns An array of individual symbols
 */
export const parseManaString = (manaCost: string): string[] => {
  if (!manaCost) return [];
  const symbolRegex = /\{[^}]+\}/g;
  const matches = manaCost.match(symbolRegex);
  if (!matches) {
    console.warn(`Invalid mana cost format: ${manaCost}`);
    return [];
  }
  return matches;
};

/**
 * Get detailed information about a mana symbol
 * @param symbol - A symbol like "{W}" or "{2}"
 */
export const getManaSymbol = (symbol: string): ManaSymbol | undefined => {
  const result = symbolMap.get(symbol);
  if (!result) {
    console.warn(`Unknown mana symbol: ${symbol}`);
  }
  return result;
};

/**
 * Calculate total mana value and collect colors for a mana cost
 * @param manaCost - A string like "{2}{W}{W}"
 */
export const analyzeManaCost = (manaCost: string): ParsedManaCost => {
  // Check cache first
  const cached = manaCache.get(manaCost);
  if (cached) return cached;

  const symbols = parseManaString(manaCost);
  let totalValue = 0;
  const colors = new Set<string>();

  symbols.forEach((symbol) => {
    const data = getManaSymbol(symbol);
    if (data) {
      totalValue += data.mana_value;
      data.colors.forEach((color) => colors.add(color));
    }
  });

  const result = {
    symbols,
    totalValue,
    colors: Array.from(colors)
  };

  manaCache.set(manaCost, result);
  return result;
};

/**
 * Check if a mana cost contains specific colors
 * @param manaCost - A string like "{2}{W}{W}"
 * @param colors - Array of colors to check for
 */
export const hasColors = (manaCost: string, colors: string[]): boolean => {
  if (!colors.length) return true;
  const analysis = analyzeManaCost(manaCost);
  return colors.every((color) => analysis.colors.includes(color));
};

/**
 * Get the base URL for SVG assets
 */
export const getSvgBaseUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_MANA_SVG_BASE_URL || "/symbology";
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
};
