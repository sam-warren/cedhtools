// TopDeck.gg API Client

import {
  TopdeckTournament,
  TopdeckTournamentListItem,
  TournamentListRequest,
  TopdeckPlayer,
} from './types';

const TOPDECK_API_URL = 'https://topdeck.gg/api/v2';

/**
 * TopDeck API client error
 */
export class TopdeckClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'TopdeckClientError';
  }
}

/**
 * Get API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.TOPDECK_API_KEY;
  if (!apiKey) {
    throw new TopdeckClientError('TOPDECK_API_KEY environment variable is not set');
  }
  return apiKey;
}

// Timeout for API requests (5 minutes - the list endpoint can be slow for large date ranges)
const API_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Make authenticated request to TopDeck API
 * 
 * Uses response.json() directly instead of text() + JSON.parse()
 * to reduce memory usage by avoiding double-buffering of large responses.
 */
async function topdeckFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getApiKey();
  
  const url = `${TOPDECK_API_URL}${endpoint}`;
  
  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      // For error responses, we can read as text since they're small
      const text = await response.text();
      let errorBody: unknown = text;
      try {
        errorBody = JSON.parse(text);
      } catch {
        // Keep as text
      }
      throw new TopdeckClientError(
        `TopDeck API error: ${response.status} ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    // Use response.json() directly - this is more memory efficient than
    // response.text() + JSON.parse() as it avoids holding the full text string
    // in memory alongside the parsed object
    return await response.json() as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TopdeckClientError(
        `TopDeck API timeout after ${API_TIMEOUT_MS / 1000}s for ${endpoint}`,
        408
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * List tournaments within a date range
 * 
 * @param start - Start date (Unix timestamp in seconds)
 * @param end - End date (Unix timestamp in seconds)
 * @param options - Additional request options
 */
export async function listTournaments(
  start: number,
  end: number,
  options: Partial<TournamentListRequest> = {}
): Promise<TopdeckTournamentListItem[]> {
  const body: TournamentListRequest = {
    game: 'Magic: The Gathering',
    format: 'EDH',
    start,
    end,
    columns: [
      'name',
      'decklist',
      'wins',
      'winsSwiss',
      'winsBracket',
      'draws',
      'losses',
      'lossesSwiss',
      'lossesBracket',
      'id',
    ],
    rounds: true,
    tables: ['table', 'players', 'winner'],
    players: ['name', 'id', 'decklist'],
    ...options,
  };

  return topdeckFetch<TopdeckTournamentListItem[]>('/tournaments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Get full tournament details by TID
 * 
 * @param tid - Tournament ID
 */
export async function getTournament(tid: string): Promise<TopdeckTournament> {
  return topdeckFetch<TopdeckTournament>(`/tournaments/${encodeURIComponent(tid)}`);
}

/**
 * Get player profiles by IDs (max 15 at a time)
 * 
 * @param ids - Array of player IDs
 */
export async function getPlayers(ids: string[]): Promise<TopdeckPlayer[]> {
  if (ids.length === 0) return [];
  if (ids.length > 15) {
    throw new TopdeckClientError('Cannot fetch more than 15 players at once');
  }
  
  const query = ids.map(id => `id=${encodeURIComponent(id)}`).join('&');
  return topdeckFetch<TopdeckPlayer[]>(`/player?${query}`);
}

/**
 * Batch fetch players in chunks of 15
 * 
 * @param ids - Array of player IDs
 */
export async function getPlayersBatch(ids: string[]): Promise<TopdeckPlayer[]> {
  const uniqueIds = [...new Set(ids)];
  const chunks: string[][] = [];
  
  for (let i = 0; i < uniqueIds.length; i += 15) {
    chunks.push(uniqueIds.slice(i, i + 15));
  }
  
  const results = await Promise.all(chunks.map(chunk => getPlayers(chunk)));
  return results.flat();
}

/**
 * Generate weekly date ranges from start to end
 * 
 * @param startDate - Start date
 * @param endDate - End date (defaults to now)
 */
export function* generateWeeklyRanges(
  startDate: Date,
  endDate: Date = new Date()
): Generator<{ start: number; end: number; label: string }> {
  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
  
  let current = new Date(startDate);
  
  while (current < endDate) {
    const weekEnd = new Date(Math.min(current.getTime() + MS_PER_WEEK, endDate.getTime()));
    
    yield {
      start: Math.floor(current.getTime() / 1000),
      end: Math.floor(weekEnd.getTime() / 1000),
      label: `${current.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`,
    };
    
    current = weekEnd;
  }
}

/**
 * Fetch all tournaments from a date range in weekly batches
 * 
 * @param startDate - Start date
 * @param endDate - End date (defaults to now)
 * @param onProgress - Optional progress callback
 */
export async function fetchAllTournaments(
  startDate: Date,
  endDate: Date = new Date(),
  onProgress?: (current: number, total: number, label: string) => void
): Promise<TopdeckTournamentListItem[]> {
  const allTournaments: TopdeckTournamentListItem[] = [];
  const weeks = [...generateWeeklyRanges(startDate, endDate)];
  
  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i];
    onProgress?.(i + 1, weeks.length, week.label);
    
    try {
      const tournaments = await listTournaments(week.start, week.end);
      allTournaments.push(...tournaments);
      
      // Add a small delay to avoid rate limiting
      if (i < weeks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Error fetching week ${week.label}:`, error);
      // Continue with next week on error
    }
  }
  
  return allTournaments;
}

/**
 * Get the week start date (Monday) for a given date (UTC-based)
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  // Use UTC methods to avoid timezone issues
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

