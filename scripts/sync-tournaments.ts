#!/usr/bin/env npx tsx
/**
 * Tournament Sync Script (Seed)
 * 
 * Fetches tournament data from TopDeck.gg and syncs to Supabase.
 * Run with: npx tsx scripts/sync-tournaments.ts
 * 
 * Pipeline: seed (this) -> enrich -> aggregate
 * 
 * This script handles:
 * - Tournament metadata (name, date, size, rounds, top cut)
 * - Player records
 * - Commander records  
 * - Entry records (standings, wins/losses)
 * - Decklist cards (from deckObj)
 * - Game/round data for seat position tracking
 * 
 * Decklist validation is done separately in enrich-cards.ts to allow
 * quick iteration without re-running the full sync.
 * 
 * Environment variables required:
 * - TOPDECK_API_KEY: TopDeck.gg API key
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/db/types';
import {
  generateWeeklyRanges,
  listTournaments
} from '../lib/topdeck';
import type {
  DeckObj,
  StandingPlayer,
  TopdeckTournament,
  TournamentRound
} from '../lib/topdeck/types';
import {
  getCommanderCards,
  getMainboardCards,
  normalizeCommanderName
} from '../lib/topdeck/types';

/**
 * Future Enhancement: Moxfield Integration
 * 
 * Some tournament entries include Moxfield URLs instead of inline decklists.
 * To capture this data, we would need to:
 * 
 * 1. Detect Moxfield URLs in the decklist field (e.g., https://moxfield.com/decks/...)
 * 2. Fetch deck data from Moxfield's API (requires API key)
 * 3. Convert Moxfield's response format to our decklist format
 * 4. Validate with Scrollrack (same as current flow)
 * 5. Store cards in decklist_items table
 * 
 * Moxfield API: https://api.moxfield.com/v2/decks/{deck_id}
 * Note: Public decks can be fetched without authentication, but rate limits apply.
 * 
 * This would increase our deck data coverage for tournaments where players
 * submit Moxfield links rather than copy-pasting their decklist.
 */

// ============================================
// Configuration
// ============================================

const START_DATE = new Date('2025-05-19T00:00:00Z');
const DECKLIST_BATCH_SIZE = 500; // Batch size for decklist_items inserts
const PAGE_SIZE = 1000; // For pre-loading existing data

// ============================================
// Telemetry / Progress Tracking
// ============================================

class ProgressTracker {
  private startTime: number;
  private phaseStartTime: number;
  private totalItems: number;
  private processedItems: number;
  private phaseName: string;

  constructor() {
    this.startTime = Date.now();
    this.phaseStartTime = Date.now();
    this.totalItems = 0;
    this.processedItems = 0;
    this.phaseName = '';
  }

  startPhase(name: string, totalItems: number): void {
    this.phaseName = name;
    this.totalItems = totalItems;
    this.processedItems = 0;
    this.phaseStartTime = Date.now();
    console.log(`\n⏱️  Starting: ${name} (${totalItems} items)`);
  }

  update(processed: number): void {
    this.processedItems = processed;
  }

  increment(count: number = 1): void {
    this.processedItems += count;
  }

  getElapsed(): string {
    const elapsed = Date.now() - this.startTime;
    return this.formatDuration(elapsed);
  }

  getPhaseElapsed(): string {
    const elapsed = Date.now() - this.phaseStartTime;
    return this.formatDuration(elapsed);
  }

  getETA(): string {
    if (this.processedItems === 0 || this.totalItems === 0) return 'calculating...';
    
    const elapsed = Date.now() - this.phaseStartTime;
    const rate = this.processedItems / elapsed; // items per ms
    const remaining = this.totalItems - this.processedItems;
    const etaMs = remaining / rate;
    
    return this.formatDuration(etaMs);
  }

  getProgress(): string {
    if (this.totalItems === 0) return '0%';
    const pct = (this.processedItems / this.totalItems * 100).toFixed(1);
    return `${pct}%`;
  }

  getRate(): string {
    const elapsed = (Date.now() - this.phaseStartTime) / 1000; // seconds
    if (elapsed === 0) return '0/s';
    const rate = this.processedItems / elapsed;
    return `${rate.toFixed(1)}/s`;
  }

  logProgress(extra?: string): void {
    const progress = this.getProgress();
    const elapsed = this.getPhaseElapsed();
    const eta = this.getETA();
    const rate = this.getRate();
    
    let status = `[${progress}] ${this.processedItems}/${this.totalItems} | ⏱️ ${elapsed} | ETA: ${eta} | ${rate}`;
    if (extra) status += ` | ${extra}`;
    
    // Use \r to overwrite line for cleaner output
    process.stdout.write(`\r  📊 ${status}    `);
  }

  logLine(message: string): void {
    console.log(`  ${message}`);
  }

  endPhase(): void {
    const elapsed = this.getPhaseElapsed();
    const rate = this.getRate();
    console.log(`\n  ✅ ${this.phaseName} complete: ${this.processedItems} items in ${elapsed} (${rate})`);
  }

  summary(): void {
    console.log(`\n⏱️  Total execution time: ${this.getElapsed()}`);
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Global progress tracker
const progress = new ProgressTracker();

// ============================================
// Text Normalization
// ============================================

/**
 * Normalize text by replacing special characters with ASCII equivalents.
 * 
 * This prevents duplicate database records caused by inconsistent character encoding
 * from different data sources. For example:
 * - "Thassa's Oracle" (straight apostrophe from one source)
 * - "Thassa's Oracle" (curly apostrophe from another source)
 * 
 * Without normalization, these would create two separate card/commander records.
 * 
 * This is still necessary because:
 * 1. TopDeck.gg data may use different encodings depending on how decks were submitted
 * 2. Scryfall uses straight ASCII characters consistently
 * 3. User-submitted data (via Moxfield, etc.) may have copy-pasted curly quotes
 * 
 * By normalizing to ASCII, we ensure consistent matching regardless of source.
 */
function normalizeText(text: string): string {
  return text
    // Normalize apostrophes (curly to straight)
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    // Normalize quotes (curly to straight)
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    // Normalize dashes (em/en dash to hyphen)
    .replace(/[\u2013\u2014]/g, '-')
    // Normalize ellipsis
    .replace(/\u2026/g, '...')
    // Trim whitespace
    .trim();
}

/**
 * Extract front face name from a card name (for DFC lookup)
 */
function getFrontFaceName(name: string): string {
  if (name.includes(' // ')) {
    return name.split(' // ')[0].trim();
  }
  return name;
}

/**
 * Check if this is a DFC name (contains " // ")
 */
function isDFCName(name: string): boolean {
  return name.includes(' // ');
}

// ============================================
// Supabase Client
// ============================================

function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient<Database>(supabaseUrl, supabaseKey);
}

// ============================================
// Helper Types
// ============================================

interface SyncStats {
  tournamentsProcessed: number;
  tournamentsSkipped: number;
  playersCreated: number;
  commandersCreated: number;
  cardsCreated: number;
  entriesCreated: number;
  gamesCreated: number;
  errors: string[];
}

interface PlayerCache {
  [topdeckId: string]: number; // Maps topdeck ID to our player ID
}

interface CommanderCache {
  [name: string]: number; // Maps commander name to our commander ID
}

interface CardCache {
  [name: string]: number; // Maps card name to our card ID
}

// ============================================
// Cache Pre-loading (reduces DB queries from millions to thousands)
// ============================================

async function preloadPlayerCache(
  supabase: ReturnType<typeof createSupabaseAdmin>
): Promise<PlayerCache> {
  console.log('  📦 Pre-loading player cache...');
  const cache: PlayerCache = {};
  let offset = 0;
  let total = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('players')
      .select('id, topdeck_id')
      .not('topdeck_id', 'is', null)
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    for (const player of data) {
      if (player.topdeck_id) {
        cache[player.topdeck_id] = player.id;
      }
    }
    
    total += data.length;
    offset += PAGE_SIZE;
    if (data.length < PAGE_SIZE) break;
  }
  
  console.log(`  ✅ Loaded ${total} players into cache`);
  return cache;
}

async function preloadCommanderCache(
  supabase: ReturnType<typeof createSupabaseAdmin>
): Promise<CommanderCache> {
  console.log('  📦 Pre-loading commander cache...');
  const cache: CommanderCache = {};
  let offset = 0;
  let total = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('commanders')
      .select('id, name')
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    for (const cmd of data) {
      cache[cmd.name] = cmd.id;
      // Also cache front-face name for DFC lookup
      if (cmd.name.includes(' // ')) {
        const frontFace = cmd.name.split(' // ')[0].trim();
        cache[frontFace] = cmd.id;
      }
    }
    
    total += data.length;
    offset += PAGE_SIZE;
    if (data.length < PAGE_SIZE) break;
  }
  
  console.log(`  ✅ Loaded ${total} commanders into cache`);
  return cache;
}

async function preloadCardCache(
  supabase: ReturnType<typeof createSupabaseAdmin>
): Promise<CardCache> {
  console.log('  📦 Pre-loading card cache...');
  const cache: CardCache = {};
  let offset = 0;
  let total = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('cards')
      .select('id, name')
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    for (const card of data) {
      cache[card.name] = card.id;
      // Also cache front-face name for DFC lookup
      if (card.name.includes(' // ')) {
        const frontFace = card.name.split(' // ')[0].trim();
        cache[frontFace] = card.id;
      }
    }
    
    total += data.length;
    offset += PAGE_SIZE;
    if (data.length < PAGE_SIZE) break;
  }
  
  console.log(`  ✅ Loaded ${total} cards into cache`);
  return cache;
}

// ============================================
// Sync Logic
// ============================================

async function upsertPlayer(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  name: string,
  topdeckId: string | null,
  cache: PlayerCache
): Promise<number> {
  // Check cache first
  if (topdeckId && cache[topdeckId]) {
    return cache[topdeckId];
  }

  // Try to find existing player by topdeck ID
  if (topdeckId) {
    const { data: existing } = await supabase
      .from('players')
      .select('id')
      .eq('topdeck_id', topdeckId)
      .single();

    if (existing) {
      cache[topdeckId] = existing.id;
      return existing.id;
    }
  }

  // Insert new player
  const { data, error } = await supabase
    .from('players')
    .insert({ name, topdeck_id: topdeckId })
    .select('id')
    .single();

  if (error) {
    // Handle unique constraint violation (error code 23505).
    // This can occur in a race condition: between our SELECT check and INSERT,
    // another concurrent process may have inserted the same record.
    // When this happens, we simply fetch the existing record instead of failing.
    // This pattern makes the upsert operation idempotent and safe for parallel execution.
    if (error.code === '23505' && topdeckId) {
      const { data: existing } = await supabase
        .from('players')
        .select('id')
        .eq('topdeck_id', topdeckId)
        .single();

      if (existing) {
        cache[topdeckId] = existing.id;
        return existing.id;
      }
    }
    throw error;
  }

  if (topdeckId) {
    cache[topdeckId] = data.id;
  }
  return data.id;
}

async function upsertCommander(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  name: string,
  cache: CommanderCache
): Promise<number> {
  // Normalize text encoding only (preserve DFC names)
  const normalizedName = normalizeText(name);
  const frontFaceName = getFrontFaceName(normalizedName);

  // Check cache first (try both exact name and front-face)
  if (cache[normalizedName]) {
    return cache[normalizedName];
  }
  if (cache[frontFaceName]) {
    // Front-face name maps to a DFC version (or itself)
    return cache[frontFaceName];
  }

  // CASE 1: We have a SHORT name - check if DFC version exists
  if (!isDFCName(normalizedName)) {
    const { data: dfcVersion } = await supabase
      .from('commanders')
      .select('id, name')
      .like('name', `${normalizedName} // %`)
      .limit(1)
      .single();
    
    if (dfcVersion) {
      cache[normalizedName] = dfcVersion.id;
      cache[dfcVersion.name] = dfcVersion.id;
      cache[frontFaceName] = dfcVersion.id;
      return dfcVersion.id;
    }
  }

  // CASE 2: We have a DFC name - check if SHORT version exists and UPGRADE it
  if (isDFCName(normalizedName)) {
    const { data: shortVersion } = await supabase
      .from('commanders')
      .select('id')
      .eq('name', frontFaceName)
      .single();
    
    if (shortVersion) {
      // Upgrade the short name record to use the full DFC name
      await supabase
        .from('commanders')
        .update({ name: normalizedName })
        .eq('id', shortVersion.id);
      
      cache[normalizedName] = shortVersion.id;
      cache[frontFaceName] = shortVersion.id;
      return shortVersion.id;
    }
  }

  // Try to find exact match
  const { data: existing } = await supabase
    .from('commanders')
    .select('id')
    .eq('name', normalizedName)
    .single();

  if (existing) {
    cache[normalizedName] = existing.id;
    cache[frontFaceName] = existing.id;
    return existing.id;
  }

  // Insert new commander
  const { data, error } = await supabase
    .from('commanders')
    .insert({ name: normalizedName, color_id: '' })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('commanders')
        .select('id')
        .eq('name', normalizedName)
        .single();

      if (existing) {
        cache[normalizedName] = existing.id;
        cache[frontFaceName] = existing.id;
        return existing.id;
      }
    }
    throw error;
  }

  cache[normalizedName] = data.id;
  cache[frontFaceName] = data.id;
  return data.id;
}

async function upsertCard(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  name: string,
  oracleId: string | null,
  cache: CardCache
): Promise<number> {
  // Normalize text encoding only (preserve DFC names)
  const normalizedName = normalizeText(name);
  const frontFaceName = getFrontFaceName(normalizedName);

  // Check cache first (try both exact name and front-face)
  if (cache[normalizedName]) {
    return cache[normalizedName];
  }
  if (cache[frontFaceName]) {
    // Front-face name maps to a DFC version (or itself)
    return cache[frontFaceName];
  }

  // CASE 1: We have a SHORT name - check if DFC version exists
  if (!isDFCName(normalizedName)) {
    const { data: dfcVersion } = await supabase
      .from('cards')
      .select('id, name')
      .like('name', `${normalizedName} // %`)
      .limit(1)
      .single();
    
    if (dfcVersion) {
      cache[normalizedName] = dfcVersion.id;
      cache[dfcVersion.name] = dfcVersion.id;
      cache[frontFaceName] = dfcVersion.id;
      return dfcVersion.id;
    }
  }

  // CASE 2: We have a DFC name - check if SHORT version exists and UPGRADE it
  if (isDFCName(normalizedName)) {
    const { data: shortVersion } = await supabase
      .from('cards')
      .select('id')
      .eq('name', frontFaceName)
      .single();
    
    if (shortVersion) {
      // Upgrade the short name record to use the full DFC name
      await supabase
        .from('cards')
        .update({ name: normalizedName })
        .eq('id', shortVersion.id);
      
      cache[normalizedName] = shortVersion.id;
      cache[frontFaceName] = shortVersion.id;
      return shortVersion.id;
    }
  }

  // Try to find exact match
  const { data: existing } = await supabase
    .from('cards')
    .select('id')
    .eq('name', normalizedName)
    .single();

  if (existing) {
    cache[normalizedName] = existing.id;
    cache[frontFaceName] = existing.id;
    return existing.id;
  }

  // Insert new card
  const { data, error } = await supabase
    .from('cards')
    .insert({ name: normalizedName, oracle_id: oracleId })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('cards')
        .select('id')
        .eq('name', normalizedName)
        .single();

      if (existing) {
        cache[normalizedName] = existing.id;
        cache[frontFaceName] = existing.id;
        return existing.id;
      }
    }
    throw error;
  }

  cache[normalizedName] = data.id;
  cache[frontFaceName] = data.id;
  return data.id;
}

async function processTournament(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  tournament: TopdeckTournament,
  playerCache: PlayerCache,
  commanderCache: CommanderCache,
  cardCache: CardCache,
  stats: SyncStats
): Promise<void> {
  // 1. Upsert tournament
  const tournamentDate = new Date(tournament.startDate * 1000);

  const { data: tournamentRow, error: tournamentError } = await supabase
    .from('tournaments')
    .upsert({
      tid: tournament.TID,
      name: tournament.tournamentName,
      tournament_date: tournamentDate.toISOString(),
      size: tournament.standings.length,
      swiss_rounds: tournament.swissNum,
      top_cut: tournament.topCut,
    }, { onConflict: 'tid' })
    .select('id')
    .single();

  if (tournamentError) throw tournamentError;
  const tournamentId = tournamentRow.id;

  // 2. Process standings (create players, commanders, entries)
  const entryMap = new Map<string, number>(); // Maps player topdeck ID to entry ID
  const pendingDecklistItems: DecklistItem[] = []; // Collect for batch insert

  for (let i = 0; i < tournament.standings.length; i++) {
    const standing = tournament.standings[i];

    // Create/get player
    const playerId = await upsertPlayer(
      supabase,
      standing.name,
      standing.id,
      playerCache
    );

    // Create/get commander
    let commanderId: number | null = null;
    const commanderName = normalizeCommanderName(standing.deckObj);
    if (commanderName) {
      commanderId = await upsertCommander(supabase, commanderName, commanderCache);
      stats.commandersCreated++;
    }

    // Create entry
    const { data: entryRow, error: entryError } = await supabase
      .from('entries')
      .upsert({
        tournament_id: tournamentId,
        player_id: playerId,
        commander_id: commanderId,
        standing: i + 1,
        wins_swiss: standing.winsSwiss,
        wins_bracket: standing.winsBracket,
        losses_swiss: standing.lossesSwiss,
        losses_bracket: standing.lossesBracket,
        draws: standing.draws,
        decklist: standing.decklist,
      }, { onConflict: 'tournament_id,player_id' })
      .select('id')
      .single();

    if (entryError) throw entryError;

    const entryId = entryRow.id;
    if (standing.id) {
      entryMap.set(standing.id, entryId);
    }
    stats.entriesCreated++;

    // Process decklist cards (validation is done separately in enrich-cards.ts)
    if (standing.deckObj) {
      await processDeck(supabase, entryId, standing.deckObj, cardCache, stats, pendingDecklistItems);
    }
    
    // Flush decklist items periodically to manage memory
    if (pendingDecklistItems.length >= DECKLIST_BATCH_SIZE) {
      await flushDecklistItems(supabase, pendingDecklistItems);
      pendingDecklistItems.length = 0; // Clear the array
    }
  }

  // Flush remaining decklist items
  if (pendingDecklistItems.length > 0) {
    await flushDecklistItems(supabase, pendingDecklistItems);
  }

  // 3. Process rounds/games for seat position tracking
  await processRounds(
    supabase,
    tournamentId,
    tournament.rounds,
    tournament.standings,
    playerCache,
    entryMap,
    stats
  );

  stats.tournamentsProcessed++;
}

interface DecklistItem {
  entry_id: number;
  card_id: number;
  quantity: number;
}

async function processDeck(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  entryId: number,
  deckObj: DeckObj,
  cardCache: CardCache,
  stats: SyncStats,
  pendingItems: DecklistItem[] // Collect items for batch insert
): Promise<void> {
  // Get all cards (mainboard + commanders)
  const mainboardCards = getMainboardCards(deckObj);
  const commanderCards = getCommanderCards(deckObj);
  const allCards = [...mainboardCards, ...commanderCards];

  for (const card of allCards) {
    const cardId = await upsertCard(supabase, card.name, card.oracleId, cardCache);
    stats.cardsCreated++;

    // Collect for batch insert instead of inserting one by one
    pendingItems.push({
      entry_id: entryId,
      card_id: cardId,
      quantity: card.count,
    });
  }
}

async function flushDecklistItems(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  items: DecklistItem[]
): Promise<number> {
  if (items.length === 0) return 0;
  
  let inserted = 0;
  
  // Insert in batches to avoid memory issues
  for (let i = 0; i < items.length; i += DECKLIST_BATCH_SIZE) {
    const batch = items.slice(i, i + DECKLIST_BATCH_SIZE);
    
    const { error } = await supabase
      .from('decklist_items')
      .upsert(batch, { onConflict: 'entry_id,card_id', ignoreDuplicates: true });
    
    if (error) throw error;
    inserted += batch.length;
  }
  
  return inserted;
}

async function processRounds(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  tournamentId: number,
  rounds: TournamentRound[],
  standings: StandingPlayer[],
  playerCache: PlayerCache,
  entryMap: Map<string, number>,
  stats: SyncStats
): Promise<void> {
  // Build a map of player names to their topdeck IDs from standings
  const playerNameToId = new Map<string, string>();
  for (const standing of standings) {
    if (standing.id && standing.name) {
      playerNameToId.set(standing.name.toLowerCase(), standing.id);
    }
  }

  for (const round of rounds) {
    const roundStr = String(round.round);

    for (const table of round.tables) {
      // Create game
      const isDraw = table.winner === 'Draw' || table.winner_id === 'Draw';

      // Find winner player ID
      let winnerPlayerId: number | null = null;
      if (!isDraw && table.winner && typeof table.winner === 'string') {
        const winnerTopdeckId = playerNameToId.get(table.winner.toLowerCase());
        if (winnerTopdeckId && playerCache[winnerTopdeckId]) {
          winnerPlayerId = playerCache[winnerTopdeckId];
        }
      }

      const { data: gameRow, error: gameError } = await supabase
        .from('games')
        .upsert({
          tournament_id: tournamentId,
          round: roundStr,
          table_number: table.table,
          winner_player_id: winnerPlayerId,
          is_draw: isDraw,
        }, { onConflict: 'tournament_id,round,table_number' })
        .select('id')
        .single();

      if (gameError) throw gameError;
      const gameId = gameRow.id;
      stats.gamesCreated++;

      // Create game_players with seat positions
      for (let seatIndex = 0; seatIndex < table.players.length; seatIndex++) {
        const player = table.players[seatIndex];
        if (!player.id) continue;

        // Get or create player
        const playerId = await upsertPlayer(
          supabase,
          player.name,
          player.id,
          playerCache
        );

        const entryId = entryMap.get(player.id) || null;

        await supabase
          .from('game_players')
          .upsert({
            game_id: gameId,
            player_id: playerId,
            entry_id: entryId,
            seat_position: seatIndex + 1, // 1-indexed seat position
          }, { onConflict: 'game_id,player_id', ignoreDuplicates: true });
      }
    }
  }
}

// ============================================
// Main Sync Function
// ============================================

async function syncTournaments(): Promise<SyncStats> {
  const supabase = createSupabaseAdmin();

  const stats: SyncStats = {
    tournamentsProcessed: 0,
    tournamentsSkipped: 0,
    playersCreated: 0,
    commandersCreated: 0,
    cardsCreated: 0,
    entriesCreated: 0,
    gamesCreated: 0,
    errors: [],
  };

  console.log('🚀 Starting tournament sync...');
  console.log(`📅 Processing tournaments from ${START_DATE.toISOString()} to now`);
  console.log('');
  
  // Pre-load existing data into caches (massive speedup - avoids millions of DB lookups)
  console.log('📦 Pre-loading existing data into caches...');
  const playerCache = await preloadPlayerCache(supabase);
  const commanderCache = await preloadCommanderCache(supabase);
  const cardCache = await preloadCardCache(supabase);
  console.log('');

  // Get all existing tournament IDs upfront
  const existingTids = new Set<string>();
  const { data: existingTournaments } = await supabase
    .from('tournaments')
    .select('tid');

  if (existingTournaments) {
    for (const t of existingTournaments as { tid: string }[]) {
      existingTids.add(t.tid);
    }
  }
  console.log(`📊 Found ${existingTids.size} existing tournaments in database`);

  // Process week by week (fetch → process → move on)
  const weeks = [...generateWeeklyRanges(START_DATE, new Date())];
  
  progress.startPhase('Processing weeks', weeks.length);

  for (let weekIdx = 0; weekIdx < weeks.length; weekIdx++) {
    const week = weeks[weekIdx];
    
    // Update progress with ETA
    progress.update(weekIdx);
    const eta = progress.getETA();
    const elapsed = progress.getElapsed();
    
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📅 Week ${weekIdx + 1}/${weeks.length}: ${week.label} | ⏱️ ${elapsed} elapsed | ETA: ${eta}`);
    console.log('─'.repeat(60));

    // Fetch tournaments for this week
    let tournaments;
    try {
      tournaments = await listTournaments(week.start, week.end);
    } catch (error) {
      let errorMsg: string;
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMsg = JSON.stringify(error);
      } else {
        errorMsg = String(error);
      }
      console.error(`❌ Failed to fetch week: ${errorMsg}`);
      stats.errors.push(`Week ${week.label}: ${errorMsg}`);
      continue;
    }

    console.log(`  Found ${tournaments.length} tournaments`);

    // Filter to new tournaments only
    const newTournaments = tournaments.filter(t => !existingTids.has(t.TID));
    const skippedCount = tournaments.length - newTournaments.length;

    if (skippedCount > 0) {
      console.log(`  ⏭️ Skipping ${skippedCount} already processed`);
    }

    if (newTournaments.length === 0) {
      console.log(`  ✅ All tournaments already synced`);
      stats.tournamentsSkipped += skippedCount;
      continue;
    }

    console.log(`  🆕 Processing ${newTournaments.length} new tournaments...`);

    // Process each tournament in this week
    for (let i = 0; i < newTournaments.length; i++) {
      const tournament = newTournaments[i];

      // Skip tournaments without standings
      if (!tournament.standings || tournament.standings.length === 0) {
        stats.tournamentsSkipped++;
        continue;
      }

      try {
        const tournamentStart = Date.now();
        process.stdout.write(`    [${i + 1}/${newTournaments.length}] ${tournament.tournamentName.substring(0, 40).padEnd(40)}...`);

        await processTournament(
          supabase,
          tournament,
          playerCache,
          commanderCache,
          cardCache,
          stats
        );

        // Mark as processed so we don't retry on crash
        existingTids.add(tournament.TID);

        const tournamentTime = ((Date.now() - tournamentStart) / 1000).toFixed(1);
        console.log(` ✅ (${tournamentTime}s)`);
      } catch (error) {
        let errorMsg: string;
        if (error instanceof Error) {
          errorMsg = error.message;
        } else if (typeof error === 'object' && error !== null) {
          errorMsg = JSON.stringify(error);
        } else {
          errorMsg = String(error);
        }
        console.log(` ❌ ${errorMsg}`);
        stats.errors.push(`${tournament.TID}: ${errorMsg}`);
      }
    }

    progress.increment();

    // Small delay between weeks to be nice to the API
    if (weekIdx < weeks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 350));
    }
  }

  progress.endPhase();
  progress.summary();

  return stats;
}

// ============================================
// Entry Point
// ============================================

async function main() {
  console.log('═'.repeat(60));
  console.log('cedhtools - Tournament Sync');
  console.log('═'.repeat(60));

  try {
    const stats = await syncTournaments();

    console.log('\n' + '═'.repeat(60));
    console.log('Sync Complete!');
    console.log('═'.repeat(60));
    console.log(`Tournaments processed: ${stats.tournamentsProcessed}`);
    console.log(`Tournaments skipped:   ${stats.tournamentsSkipped}`);
    console.log(`Commanders created:    ${stats.commandersCreated}`);
    console.log(`Cards created:         ${stats.cardsCreated}`);
    console.log(`Entries created:       ${stats.entriesCreated}`);
    console.log(`Games created:         ${stats.gamesCreated}`);
    console.log('');
    console.log('Next step: Run enrich-cards.ts to validate decklists and add metadata');

    if (stats.errors.length > 0) {
      console.log(`\n⚠️ Errors (${stats.errors.length}):`);
      for (const error of stats.errors.slice(0, 10)) {
        console.log(`  - ${error}`);
      }
      if (stats.errors.length > 10) {
        console.log(`  ... and ${stats.errors.length - 10} more`);
      }
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();

