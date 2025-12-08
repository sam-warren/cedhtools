#!/usr/bin/env npx tsx
/**
 * Tournament Sync Script
 * 
 * Fetches tournament data from TopDeck.gg and syncs to Supabase.
 * Run with: npx tsx scripts/sync-tournaments.ts
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
import { validateDecklistWithRetry } from '../lib/scrollrack';
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
  decklistsValidated: number;
  decklistsValid: number;
  decklistsInvalid: number;
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
  // Normalize name to prevent duplicates from encoding differences
  const normalizedName = normalizeText(name);

  // Check cache first
  if (cache[normalizedName]) {
    return cache[normalizedName];
  }

  // Try to find existing
  const { data: existing } = await supabase
    .from('commanders')
    .select('id')
    .eq('name', normalizedName)
    .single();

  if (existing) {
    cache[normalizedName] = existing.id;
    return existing.id;
  }

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
        return existing.id;
      }
    }
    throw error;
  }

  cache[normalizedName] = data.id;
  return data.id;
}

async function upsertCard(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  name: string,
  oracleId: string | null,
  cache: CardCache
): Promise<number> {
  // Normalize name to prevent duplicates from encoding differences
  const normalizedName = normalizeText(name);

  // Check cache first
  if (cache[normalizedName]) {
    return cache[normalizedName];
  }

  // Try to find existing
  const { data: existing } = await supabase
    .from('cards')
    .select('id')
    .eq('name', normalizedName)
    .single();

  if (existing) {
    cache[normalizedName] = existing.id;
    return existing.id;
  }

  // Insert new card with normalized name
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
        return existing.id;
      }
    }
    throw error;
  }

  cache[normalizedName] = data.id;
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

    /**
     * Decklist Validation via Scrollrack API
     * 
     * We use the Scrollrack API (scrollrack.topdeck.gg/api/validate) to validate
     * decklists against Commander format legality rules.
     * 
     * Known Issue: Some valid decklists may be incorrectly marked as invalid.
     * 
     * Observed patterns:
     * - Decklists WITHOUT a trailing Moxfield URL tend to fail validation more often
     * - Decklists WITH "Imported from https://moxfield.com/..." at the end tend to pass
     * - The banlist is correctly applied (e.g., Mana Crypt flagged as illegal post-ban)
     * 
     * Possible causes to investigate:
     * 1. Scrollrack may expect a specific decklist format
     * 2. Character encoding issues in card names (curly quotes, accents)
     * 3. New/unreleased cards not yet in Scrollrack's database
     * 4. Rate limiting causing intermittent failures
     * 
     * API Documentation: https://scrollrack.topdeck.gg/docs
     * 
     * Expected decklist format:
     *   ~~Commanders~~
     *   1 Commander Name
     *   
     *   ~~Mainboard~~
     *   1 Card Name
     *   ...
     * 
     * Workaround: If validation fails or times out, decklist_valid is left as NULL
     * rather than false, so the aggregation script can decide how to handle
     * unvalidated decks (currently they are excluded from card stats).
     * 
     * @see lib/scrollrack.ts for the validation implementation
     * 
     * Historical note: Previous investigation found that decklists that include
     * "Imported from [moxfield_url]" at the end tend to validate successfully,
     * while those without tend to fail. This may indicate Scrollrack has specific
     * parsing expectations.
     *
     * Test the API manually with:
     *   curl -X POST https://scrollrack.topdeck.gg/api/validate \
     *     -H "Content-Type: application/json" \
     *     -d '{"game": "mtg", "format": "commander", "list": "~~Commanders~~\n1 Thrasios, Triton Hero\n\n~~Mainboard~~\n99 Island"}'
     */

    if (standing.decklist) {
      try {
        const validationResult = await validateDecklistWithRetry(standing.decklist);
        stats.decklistsValidated++;

        if (validationResult) {
          const isValid = validationResult.valid;
          if (isValid) {
            stats.decklistsValid++;
          } else {
            stats.decklistsInvalid++;
          }

          // Update entry with validation result
          await supabase
            .from('entries')
            .update({ decklist_valid: isValid })
            .eq('id', entryId);
        }
        // If validationResult is null (API failed), decklist_valid remains NULL
      } catch {
        // Validation error - leave decklist_valid as NULL
        // Don't throw - we don't want to fail the entire sync for validation issues
      }

      // Small delay between validation calls to be nice to scrollrack API
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Process decklist
    if (standing.deckObj) {
      await processDeck(supabase, entryId, standing.deckObj, cardCache, stats);
    }
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

async function processDeck(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  entryId: number,
  deckObj: DeckObj,
  cardCache: CardCache,
  stats: SyncStats
): Promise<void> {
  // Get all cards (mainboard + commanders)
  const mainboardCards = getMainboardCards(deckObj);
  const commanderCards = getCommanderCards(deckObj);
  const allCards = [...mainboardCards, ...commanderCards];

  for (const card of allCards) {
    const cardId = await upsertCard(supabase, card.name, card.oracleId, cardCache);
    stats.cardsCreated++;

    // Insert decklist item (ignore conflicts)
    await supabase
      .from('decklist_items')
      .upsert({
        entry_id: entryId,
        card_id: cardId,
        quantity: card.count,
      }, { onConflict: 'entry_id,card_id', ignoreDuplicates: true });
  }
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
    if (standing.id) {
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
      if (!isDraw && table.winner) {
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
    decklistsValidated: 0,
    decklistsValid: 0,
    decklistsInvalid: 0,
    errors: [],
  };

  // Shared caches (persist across weeks for efficiency)
  const playerCache: PlayerCache = {};
  const commanderCache: CommanderCache = {};
  const cardCache: CardCache = {};

  console.log('🚀 Starting tournament sync...');
  console.log(`📅 Processing tournaments from ${START_DATE.toISOString()} to now`);

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

  for (let weekIdx = 0; weekIdx < weeks.length; weekIdx++) {
    const week = weeks[weekIdx];
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`📅 Week ${weekIdx + 1}/${weeks.length}: ${week.label}`);
    console.log('─'.repeat(50));

    // Fetch tournaments for this week
    let tournaments;
    try {
      tournaments = await listTournaments(week.start, week.end);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
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
        process.stdout.write(`    [${i + 1}/${newTournaments.length}] ${tournament.tournamentName.substring(0, 40)}...`);

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

        console.log(' ✅');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(` ❌ ${errorMsg}`);
        stats.errors.push(`${tournament.TID}: ${errorMsg}`);
      }
    }

    // Small delay between weeks to be nice to the API
    if (weekIdx < weeks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 350));
    }
  }

  return stats;
}

// ============================================
// Entry Point
// ============================================

async function main() {
  console.log('═'.repeat(60));
  console.log('cEDH Tools - Tournament Sync');
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
    console.log(`Decklists validated:   ${stats.decklistsValidated}`);
    console.log(`  - Valid:             ${stats.decklistsValid}`);
    console.log(`  - Invalid:           ${stats.decklistsInvalid}`);

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

