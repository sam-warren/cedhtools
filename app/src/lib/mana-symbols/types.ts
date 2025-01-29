/**
 * Represents a single Magic: The Gathering mana or card symbol.
 * This matches the structure provided by Scryfall's symbology endpoint.
 */
export interface ManaSymbol {
    // Basic identifiers
    object: 'card_symbol';
    symbol: string;         // The canonical symbol code, e.g. "{W}" or "{2/B}"

    // Visual representation
    svg_uri: string;        // URL to the SVG image of the symbol

    // Alternative representations
    loose_variant: string | null;  // A plain-text version (if any), e.g. "W" for "{W}"
    english: string;              // Human-readable description
    gatherer_alternates: string[] | null;  // Alternative encodings used on Gatherer

    // Symbol characteristics
    transposable: boolean;        // Whether this is a "reverse-able" hybrid symbol
    represents_mana: boolean;     // Whether this symbol represents a mana payment
    appears_in_mana_costs: boolean;  // Whether this can appear in a mana cost
    hybrid: boolean;              // Whether this is a hybrid mana symbol
    phyrexian: boolean;          // Whether this is a Phyrexian mana symbol

    // Numerical values
    mana_value: number;          // The mana value this symbol contributes
    cmc: number;                 // The converted mana cost (same as mana_value)

    // Special properties
    funny: boolean;              // Whether this symbol is from a Un-set or similar
    colors: string[];            // Array of colors this symbol represents (e.g. ["W", "U"])
}

/**
 * Represents the full response from Scryfall's symbology endpoint.
 * This is the top-level structure of the JSON data.
 */
export interface SymbologyResponse {
    object: 'list';
    has_more: boolean;     // Whether there are more pages (always false for symbology)
    data: ManaSymbol[];    // Array of all mana symbols
}

/**
 * Represents a parsed mana cost after analysis.
 * This is used for internal calculations and display logic.
 */
export interface ParsedManaCost {
    symbols: string[];     // Array of individual symbols, e.g. ["{1}", "{W}", "{W}"]
    totalValue: number;    // Total mana value of all symbols
    colors: string[];      // All unique colors in the mana cost
}

/**
 * Valid color identifiers in Magic: The Gathering.
 * Used for type safety when working with colors.
 */
export type ManaColor = 'W' | 'U' | 'B' | 'R' | 'G';

/**
 * Properties shared by both ManaSymbol and ManaCost components.
 * Used to maintain consistency across the component system.
 */
export interface BaseSymbolProps {
    size?: number;         // Display size in pixels
    className?: string;    // Additional CSS classes
}

/**
 * Component props for the ManaSymbol component.
 */
export interface ManaSymbolProps extends BaseSymbolProps {
    symbol: string;        // The symbol to display, e.g. "{W}"
}

/**
 * Component props for the ManaCost component.
 */
export interface ManaCostProps extends BaseSymbolProps {
    cost: string;          // The full mana cost, e.g. "{2}{W}{W}"
}