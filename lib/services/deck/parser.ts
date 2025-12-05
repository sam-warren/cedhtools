// Deck Parser - Parses plaintext decklists and Moxfield URLs

export interface ParsedCard {
  name: string;
  quantity: number;
  isCommander: boolean;
  section?: string;
}

export interface ParsedDeck {
  commanders: ParsedCard[];
  mainboard: ParsedCard[];
  sideboard: ParsedCard[];
  maybeboard: ParsedCard[];
  totalCards: number;
  errors: string[];
}

// Section header patterns
const SECTION_PATTERNS = {
  commander: /^(?:commander|cmdr|command zone)s?:?\s*$/i,
  mainboard: /^(?:mainboard|main|deck|maindeck):?\s*$/i,
  sideboard: /^(?:sideboard|side):?\s*$/i,
  maybeboard: /^(?:maybeboard|maybe|considering):?\s*$/i,
};

// Card line patterns
const CARD_LINE_PATTERNS = [
  // "1x Card Name" or "1 x Card Name"
  /^(\d+)\s*x\s+(.+?)(?:\s*\(.+\))?(?:\s*\[.+\])?(?:\s*\*.+)?$/i,
  // "1 Card Name"
  /^(\d+)\s+(.+?)(?:\s*\(.+\))?(?:\s*\[.+\])?(?:\s*\*.+)?$/i,
  // "Card Name" (assumes quantity of 1)
  /^([A-Z][^0-9\n]+?)(?:\s*\(.+\))?(?:\s*\[.+\])?(?:\s*\*.+)?$/i,
];

// Moxfield URL patterns
const MOXFIELD_URL_PATTERN = /(?:https?:\/\/)?(?:www\.)?moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/;

export function parseDecklist(input: string): ParsedDeck {
  const result: ParsedDeck = {
    commanders: [],
    mainboard: [],
    sideboard: [],
    maybeboard: [],
    totalCards: 0,
    errors: [],
  };

  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  type DeckSection = "commanders" | "mainboard" | "sideboard" | "maybeboard";
  let currentSection: DeckSection = "mainboard";

  for (const line of lines) {
    // Skip comments
    if (line.startsWith("//") || line.startsWith("#")) {
      continue;
    }

    // Check if this is a section header
    let foundSection = false;
    for (const [section, pattern] of Object.entries(SECTION_PATTERNS)) {
      if (pattern.test(line)) {
        currentSection = section as DeckSection;
        foundSection = true;
        break;
      }
    }
    if (foundSection) continue;

    // Try to parse as a card line
    const parsedCard = parseCardLine(line);

    if (parsedCard) {
      const card: ParsedCard = {
        ...parsedCard,
        isCommander: currentSection === "commanders",
        section: currentSection,
      };

      result[currentSection].push(card);
      result.totalCards += parsedCard.quantity;
    } else if (line.length > 0 && !line.startsWith("-")) {
      // Only add to errors if it looks like it should be a card
      if (!/^[-=]+$/.test(line)) {
        result.errors.push(`Could not parse line: "${line}"`);
      }
    }
  }

  // If no commanders section but mainboard has legendary creatures at start,
  // try to detect commanders heuristically
  if (result.commanders.length === 0 && result.mainboard.length > 0) {
    // Check if first 1-2 cards look like commanders (heuristic)
    // This is imperfect but helps with simple formats
  }

  return result;
}

function parseCardLine(line: string): { name: string; quantity: number } | null {
  // Skip empty lines and obvious non-card lines
  if (!line || line.length < 2) return null;

  for (const pattern of CARD_LINE_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      // Pattern with explicit quantity
      if (match.length === 3) {
        const quantity = parseInt(match[1], 10);
        const name = cleanCardName(match[2]);
        if (name && quantity > 0 && quantity <= 100) {
          return { name, quantity };
        }
      }
      // Pattern with just card name (quantity = 1)
      else if (match.length === 2) {
        const name = cleanCardName(match[1]);
        if (name) {
          return { name, quantity: 1 };
        }
      }
    }
  }

  return null;
}

function cleanCardName(name: string): string {
  return name
    .trim()
    // Remove set codes in parentheses: "Sol Ring (C21)"
    .replace(/\s*\([A-Z0-9]+\)\s*$/, "")
    // Remove collector numbers in brackets: "Sol Ring [123]"
    .replace(/\s*\[\d+\]\s*$/, "")
    // Remove foil/promo markers: "Sol Ring *F*"
    .replace(/\s*\*[A-Z]+\*\s*$/, "")
    // Remove trailing numbers that might be collector numbers
    .replace(/\s+\d+$/, "")
    .trim();
}

// Moxfield API Integration
export interface MoxfieldDeck {
  id: string;
  name: string;
  publicUrl: string;
  commanders: MoxfieldCard[];
  mainboard: MoxfieldCard[];
  sideboard: MoxfieldCard[];
  maybeboard: MoxfieldCard[];
}

export interface MoxfieldCard {
  quantity: number;
  card: {
    name: string;
    scryfall_id: string;
    type_line: string;
  };
}

export function extractMoxfieldId(input: string): string | null {
  const match = input.match(MOXFIELD_URL_PATTERN);
  return match ? match[1] : null;
}

export async function fetchMoxfieldDeck(
  deckId: string
): Promise<ParsedDeck | null> {
  try {
    // Moxfield's public API endpoint
    const response = await fetch(
      `https://api2.moxfield.com/v2/decks/all/${deckId}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    const result: ParsedDeck = {
      commanders: [],
      mainboard: [],
      sideboard: [],
      maybeboard: [],
      totalCards: 0,
      errors: [],
    };

    // Parse commanders
    if (data.commanders) {
      for (const [, cardData] of Object.entries(data.commanders)) {
        const card = cardData as { quantity: number; card: { name: string } };
        result.commanders.push({
          name: card.card.name,
          quantity: card.quantity,
          isCommander: true,
          section: "commanders",
        });
      }
    }

    // Parse mainboard
    if (data.mainboard) {
      for (const [, cardData] of Object.entries(data.mainboard)) {
        const card = cardData as { quantity: number; card: { name: string } };
        result.mainboard.push({
          name: card.card.name,
          quantity: card.quantity,
          isCommander: false,
          section: "mainboard",
        });
        result.totalCards += card.quantity;
      }
    }

    // Parse sideboard
    if (data.sideboard) {
      for (const [, cardData] of Object.entries(data.sideboard)) {
        const card = cardData as { quantity: number; card: { name: string } };
        result.sideboard.push({
          name: card.card.name,
          quantity: card.quantity,
          isCommander: false,
          section: "sideboard",
        });
      }
    }

    // Parse maybeboard
    if (data.maybeboard) {
      for (const [, cardData] of Object.entries(data.maybeboard)) {
        const card = cardData as { quantity: number; card: { name: string } };
        result.maybeboard.push({
          name: card.card.name,
          quantity: card.quantity,
          isCommander: false,
          section: "maybeboard",
        });
      }
    }

    return result;
  } catch (error) {
    console.error("Error fetching Moxfield deck:", error);
    return null;
  }
}

// Main parsing function that handles both formats
export async function parseDeckInput(input: string): Promise<{
  deck: ParsedDeck | null;
  source: "moxfield" | "plaintext";
  error?: string;
}> {
  const trimmedInput = input.trim();

  // Check if it's a Moxfield URL
  const moxfieldId = extractMoxfieldId(trimmedInput);

  if (moxfieldId) {
    const deck = await fetchMoxfieldDeck(moxfieldId);
    if (deck) {
      return { deck, source: "moxfield" };
    } else {
      return {
        deck: null,
        source: "moxfield",
        error: "Could not fetch deck from Moxfield. Make sure the deck is public.",
      };
    }
  }

  // Otherwise, parse as plaintext
  const deck = parseDecklist(trimmedInput);

  if (deck.mainboard.length === 0 && deck.commanders.length === 0) {
    return {
      deck: null,
      source: "plaintext",
      error: "Could not parse any cards from the input.",
    };
  }

  return { deck, source: "plaintext" };
}

// Utility to get commander name from parsed deck
export function getCommanderName(deck: ParsedDeck): string {
  if (deck.commanders.length === 0) {
    return "Unknown Commander";
  }

  // Sort alphabetically and join with " / " for partner commanders
  return deck.commanders
    .map((c) => c.name)
    .sort()
    .join(" / ");
}

// Utility to get all unique card names from deck
export function getAllCardNames(deck: ParsedDeck): string[] {
  const allCards = [
    ...deck.commanders,
    ...deck.mainboard,
  ];

  return [...new Set(allCards.map((c) => c.name))];
}

