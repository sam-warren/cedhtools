// Scrollrack API Client
// Used for deck validation via scrollrack.topdeck.gg

import { normalizeText } from "@/lib/utils/text";

const SCROLLRACK_API_URL = "https://scrollrack.topdeck.gg/api";

/**
 * Scrollrack validation error
 */
export class ScrollrackClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ScrollrackClientError';
  }
}

/**
 * Validation result from Scrollrack API
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  decklist: string;
  deckObj: Record<string, unknown>;
}

/**
 * Validate a decklist for commander format
 * 
 * @param decklist - Plaintext decklist string
 * @returns ValidationResult with valid flag and any errors
 */
export async function validateDecklist(decklist: string): Promise<ValidationResult> {
  // Unescape literal \n, \r\n, \', and \" to actual characters
  // TopDeck stores decklists with escaped characters
  const unescaped = decklist
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"');
  
  // Normalize special characters (curly quotes, em-dashes, etc.)
  // Card names like "Thassa's Oracle" may have curly apostrophes from copy-paste
  // which Scrollrack won't recognize
  const normalized = normalizeText(unescaped);
  
  // Process line by line:
  // - Remove metadata lines (e.g., "Imported from https://...")
  // - Trim whitespace from each line
  // - Filter out empty lines at the end
  const lines = normalized
    .split('\n')
    .map(line => line.trim())
    .filter(line => !line.startsWith('Imported from '));
  
  // Remove trailing empty lines but preserve internal structure
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  
  const normalizedDecklist = lines.join('\n');

  const response = await fetch(`${SCROLLRACK_API_URL}/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      game: 'mtg',
      format: 'commander',
      list: normalizedDecklist,
    }),
  });

  const text = await response.text();

  if (!response.ok) {
    let errorBody: unknown = text;
    try {
      errorBody = JSON.parse(text);
    } catch {
      // Keep as text
    }
    throw new ScrollrackClientError(
      `Scrollrack API error: ${response.status} ${response.statusText}`,
      response.status,
      errorBody
    );
  }

  return JSON.parse(text) as ValidationResult;
}

/**
 * Validate a decklist with retry logic
 * 
 * @param decklist - Plaintext decklist string
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param delayMs - Delay between retries in ms (default: 1000)
 * @returns ValidationResult or null if all retries failed
 */
export async function validateDecklistWithRetry(
  decklist: string,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<ValidationResult | null> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await validateDecklist(decklist);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on client errors (4xx)
      if (error instanceof ScrollrackClientError && error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }
      
      // Wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  // Log the error but don't throw - return null to indicate validation couldn't be performed
  console.error(`Scrollrack validation failed after ${maxRetries} attempts:`, lastError?.message);
  return null;
}

