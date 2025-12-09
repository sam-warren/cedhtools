// TopDeck.gg API Types

/**
 * Card entry in a deck with Scryfall oracle ID
 */
export interface DeckCard {
  id: string; // Scryfall oracle ID
  count: number;
}

/**
 * Deck object containing commanders and mainboard
 */
export interface DeckObj {
  Commanders: Record<string, DeckCard>;
  Mainboard: Record<string, DeckCard>;
  metadata?: {
    game: string;
    format: string;
    importedFrom?: string;
  };
}

/**
 * Player in a round/table
 */
export interface RoundPlayer {
  name: string;
  id: string | null;
  decklist: string | null;
  deckObj: DeckObj | null;
}

/**
 * Table in a round
 */
export interface RoundTable {
  table: number;
  players: RoundPlayer[];
  winner: string;
  winner_id?: string;
  status: string;
}

/**
 * Round in a tournament
 */
export interface TournamentRound {
  round: number | string; // Can be "Top 4", "Top 10", etc.
  tables: RoundTable[];
}

/**
 * Player standing in tournament results
 */
export interface StandingPlayer {
  name: string;
  decklist: string | null;
  deckObj: DeckObj | null;
  wins: number;
  winsSwiss: number;
  winsBracket: number;
  byes: number;
  draws: number;
  losses: number;
  lossesSwiss: number;
  lossesBracket: number;
  id: string | null;
}

/**
 * Full tournament response from TopDeck API
 */
export interface TopdeckTournament {
  TID: string;
  tournamentName: string;
  swissNum: number;
  startDate: number; // Unix timestamp in seconds
  game: string;
  format: string;
  averageElo?: number;
  modeElo?: number;
  medianElo?: number;
  topElo?: number;
  eventData?: Record<string, unknown>;
  rounds: TournamentRound[];
  topCut: number;
  standings: StandingPlayer[];
}

/**
 * Tournament list item (from POST /tournaments)
 * When rounds=true, this returns full tournament data
 */
export interface TopdeckTournamentListItem extends TopdeckTournament {
  // Extends TopdeckTournament since the list endpoint with rounds=true
  // returns the same structure as individual tournament details
}

/**
 * Request body for listing tournaments
 */
export interface TournamentListRequest {
  game: string;
  format: string;
  start: number; // Unix timestamp in seconds
  end: number; // Unix timestamp in seconds
  columns?: string[];
  rounds?: boolean;
  tables?: string[];
  players?: string[];
}

/**
 * Player profile from TopDeck API
 */
export interface TopdeckPlayer {
  id: string;
  name: string;
  elo?: number;
}

/**
 * API error response
 */
export interface TopdeckError {
  error: string;
  message?: string;
}

/**
 * Normalized commander name helper type
 */
export type CommanderName = string;

/**
 * Helper to extract commander names from DeckObj
 */
export function getCommanderNames(deckObj: DeckObj | null): string[] {
  if (!deckObj?.Commanders) return [];
  return Object.keys(deckObj.Commanders).sort();
}

/**
 * Normalize commander name (sorted alphabetically, joined with " / ")
 * Preserves full DFC names as provided by TopDeck
 */
export function normalizeCommanderName(deckObj: DeckObj | null): CommanderName | null {
  const names = getCommanderNames(deckObj);
  if (names.length === 0) return null;
  return names.join(' / ');
}

/**
 * Get all mainboard cards from DeckObj
 */
export function getMainboardCards(deckObj: DeckObj | null): Array<{ name: string; oracleId: string; count: number }> {
  if (!deckObj?.Mainboard) return [];
  return Object.entries(deckObj.Mainboard).map(([name, card]) => ({
    name,
    oracleId: card.id,
    count: card.count,
  }));
}

/**
 * Get all commander cards from DeckObj
 */
export function getCommanderCards(deckObj: DeckObj | null): Array<{ name: string; oracleId: string; count: number }> {
  if (!deckObj?.Commanders) return [];
  return Object.entries(deckObj.Commanders).map(([name, card]) => ({
    name,
    oracleId: card.id,
    count: card.count,
  }));
}

/**
 * Check if a round is bracket/top cut round
 */
export function isBracketRound(round: number | string): boolean {
  if (typeof round === 'string') {
    return round.toLowerCase().includes('top');
  }
  return false;
}

/**
 * Parse round string to get top cut number
 */
export function parseTopCutRound(round: string): number | null {
  const match = round.match(/top\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

