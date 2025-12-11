/**
 * Tournament Sync Job
 * 
 * Fetches tournament data from TopDeck.gg and syncs to Supabase.
 * Supports incremental updates - skips tournaments already in the database.
 * 
 * Pipeline: sync (this) -> enrich -> aggregate
 */

import {
  generateWeeklyRanges,
  listTournaments
} from '../api/topdeck';
import type {
  DeckObj,
  StandingPlayer,
  TopdeckTournament,
  TournamentRound
} from '../api/topdeck/types';
import {
  getCommanderCards,
  getMainboardCards,
  normalizeCommanderName
} from '../api/topdeck/types';
import {
  type SupabaseAdmin,
  type SyncStats,
  type ProgressLogger,
  createProgressLogger,
  normalizeText,
  getFrontFaceName,
  PAGE_SIZE,
} from './utils';

// ============================================
// Configuration
// ============================================

const DECKLIST_BATCH_SIZE = 500;
const ENTITY_BATCH_SIZE = 200;

// ============================================
// Cache Types
// ============================================

interface PlayerCache {
  [topdeckId: string]: number;
}

interface CommanderCache {
  [name: string]: number;
}

interface CardCache {
  [name: string]: number;
}

interface DecklistItem {
  entry_id: number;
  card_id: number;
  quantity: number;
}

// ============================================
// Cache Pre-loading
// ============================================

async function preloadPlayerCache(
  supabase: SupabaseAdmin,
  logger: ProgressLogger
): Promise<PlayerCache> {
  const startTime = Date.now();
  logger.debug('Pre-loading player cache...');
  const cache: PlayerCache = {};
  let offset = 0;
  let total = 0;
  let pages = 0;
  
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
    pages++;
    if (data.length < PAGE_SIZE) break;
  }
  
  logger.log(`Loaded ${logger.formatNumber(total)} players into cache (${pages} pages, ${Date.now() - startTime}ms)`);
  return cache;
}

async function preloadCommanderCache(
  supabase: SupabaseAdmin,
  logger: ProgressLogger
): Promise<CommanderCache> {
  const startTime = Date.now();
  logger.debug('Pre-loading commander cache...');
  const cache: CommanderCache = {};
  let offset = 0;
  let total = 0;
  let pages = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('commanders')
      .select('id, name')
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    for (const cmd of data) {
      cache[cmd.name] = cmd.id;
      // Also cache by front face for DFC lookup
      const frontFace = getFrontFaceName(cmd.name);
      if (frontFace !== cmd.name) {
        cache[frontFace] = cmd.id;
      }
    }
    
    total += data.length;
    offset += PAGE_SIZE;
    pages++;
    if (data.length < PAGE_SIZE) break;
  }
  
  logger.log(`Loaded ${logger.formatNumber(total)} commanders into cache (${pages} pages, ${Date.now() - startTime}ms)`);
  return cache;
}

async function preloadCardCache(
  supabase: SupabaseAdmin,
  logger: ProgressLogger
): Promise<CardCache> {
  const startTime = Date.now();
  logger.debug('Pre-loading card cache...');
  const cache: CardCache = {};
  let offset = 0;
  let total = 0;
  let pages = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('cards')
      .select('id, name')
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    for (const card of data) {
      cache[card.name] = card.id;
      // Also cache by front face for DFC lookup
      const frontFace = getFrontFaceName(card.name);
      if (frontFace !== card.name) {
        cache[frontFace] = card.id;
      }
    }
    
    total += data.length;
    offset += PAGE_SIZE;
    pages++;
    if (data.length < PAGE_SIZE) break;
  }
  
  logger.log(`Loaded ${logger.formatNumber(total)} cards into cache (${pages} pages, ${Date.now() - startTime}ms)`);
  return cache;
}

// ============================================
// Batch Upsert Functions (Optimized for remote DB)
// ============================================

interface PlayerInput {
  name: string;
  topdeckId: string | null;
}

async function batchUpsertPlayers(
  supabase: SupabaseAdmin,
  players: PlayerInput[],
  cache: PlayerCache
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  
  // Filter to only players not in cache
  const toInsert = players.filter(p => !p.topdeckId || !cache[p.topdeckId]);
  
  // Return cached results for those already known
  for (const p of players) {
    if (p.topdeckId && cache[p.topdeckId]) {
      result.set(p.topdeckId, cache[p.topdeckId]);
    }
  }
  
  if (toInsert.length === 0) return result;
  
  // Batch insert with ON CONFLICT DO NOTHING
  const insertData = toInsert.map(p => ({
    name: p.name,
    topdeck_id: p.topdeckId,
  }));
  
  for (let i = 0; i < insertData.length; i += ENTITY_BATCH_SIZE) {
    const batch = insertData.slice(i, i + ENTITY_BATCH_SIZE);
    await supabase
      .from('players')
      .upsert(batch, { onConflict: 'topdeck_id', ignoreDuplicates: true });
  }
  
  // Query back all IDs we need
  const topdeckIds = toInsert
    .map(p => p.topdeckId)
    .filter((id): id is string => id !== null);
  
  if (topdeckIds.length > 0) {
    for (let i = 0; i < topdeckIds.length; i += ENTITY_BATCH_SIZE) {
      const batch = topdeckIds.slice(i, i + ENTITY_BATCH_SIZE);
      const { data } = await supabase
        .from('players')
        .select('id, topdeck_id')
        .in('topdeck_id', batch);
      
      if (data) {
        for (const row of data) {
          if (row.topdeck_id) {
            cache[row.topdeck_id] = row.id;
            result.set(row.topdeck_id, row.id);
          }
        }
      }
    }
  }
  
  return result;
}

interface CommanderInput {
  name: string;
}

async function batchUpsertCommanders(
  supabase: SupabaseAdmin,
  commanders: CommanderInput[],
  cache: CommanderCache
): Promise<void> {
  // Normalize names and filter to only new ones
  const toInsert: { name: string; normalizedName: string }[] = [];
  
  for (const cmd of commanders) {
    const normalizedName = normalizeText(cmd.name);
    const frontFaceName = getFrontFaceName(normalizedName);
    
    if (!cache[normalizedName] && !cache[frontFaceName]) {
      toInsert.push({ name: cmd.name, normalizedName });
    }
  }
  
  if (toInsert.length === 0) return;
  
  // Deduplicate
  const uniqueNames = [...new Set(toInsert.map(c => c.normalizedName))];
  
  // Batch insert
  const insertData = uniqueNames.map(name => ({
    name,
    color_id: '',
  }));
  
  for (let i = 0; i < insertData.length; i += ENTITY_BATCH_SIZE) {
    const batch = insertData.slice(i, i + ENTITY_BATCH_SIZE);
    await supabase
      .from('commanders')
      .upsert(batch, { onConflict: 'name', ignoreDuplicates: true });
  }
  
  // Query back all IDs
  for (let i = 0; i < uniqueNames.length; i += ENTITY_BATCH_SIZE) {
    const batch = uniqueNames.slice(i, i + ENTITY_BATCH_SIZE);
    const { data } = await supabase
      .from('commanders')
      .select('id, name')
      .in('name', batch);
    
    if (data) {
      for (const row of data) {
        cache[row.name] = row.id;
        // Also cache by front face for DFC lookup
        const frontFace = getFrontFaceName(row.name);
        if (frontFace !== row.name) {
          cache[frontFace] = row.id;
        }
      }
    }
  }
}

interface CardInput {
  name: string;
  oracleId: string | null;
}

async function batchUpsertCards(
  supabase: SupabaseAdmin,
  cards: CardInput[],
  cache: CardCache
): Promise<void> {
  // Normalize names and filter to only new ones
  const toInsert: { normalizedName: string; oracleId: string | null }[] = [];
  
  for (const card of cards) {
    const normalizedName = normalizeText(card.name);
    const frontFaceName = getFrontFaceName(normalizedName);
    
    if (!cache[normalizedName] && !cache[frontFaceName]) {
      toInsert.push({ normalizedName, oracleId: card.oracleId });
    }
  }
  
  if (toInsert.length === 0) return;
  
  // Deduplicate by name
  const uniqueByName = new Map<string, string | null>();
  for (const c of toInsert) {
    if (!uniqueByName.has(c.normalizedName)) {
      uniqueByName.set(c.normalizedName, c.oracleId);
    }
  }
  
  const uniqueCards = Array.from(uniqueByName.entries()).map(([name, oracleId]) => ({
    name,
    oracle_id: oracleId,
  }));
  
  // Batch insert
  for (let i = 0; i < uniqueCards.length; i += ENTITY_BATCH_SIZE) {
    const batch = uniqueCards.slice(i, i + ENTITY_BATCH_SIZE);
    await supabase
      .from('cards')
      .upsert(batch, { onConflict: 'name', ignoreDuplicates: true });
  }
  
  // Query back all IDs
  const allNames = Array.from(uniqueByName.keys());
  for (let i = 0; i < allNames.length; i += ENTITY_BATCH_SIZE) {
    const batch = allNames.slice(i, i + ENTITY_BATCH_SIZE);
    const { data } = await supabase
      .from('cards')
      .select('id, name')
      .in('name', batch);
    
    if (data) {
      for (const row of data) {
        cache[row.name] = row.id;
        // Also cache by front face for DFC lookup
        const frontFace = getFrontFaceName(row.name);
        if (frontFace !== row.name) {
          cache[frontFace] = row.id;
        }
      }
    }
  }
}

// ============================================
// Single Upsert Functions (fallback, uses cache)
// ============================================

async function upsertPlayer(
  supabase: SupabaseAdmin,
  name: string,
  topdeckId: string | null,
  cache: PlayerCache
): Promise<number> {
  if (topdeckId && cache[topdeckId]) {
    return cache[topdeckId];
  }

  // Single insert with conflict handling
  const { data, error } = await supabase
    .from('players')
    .upsert({ name, topdeck_id: topdeckId }, { onConflict: 'topdeck_id' })
    .select('id')
    .single();

  if (error) throw error;

  if (topdeckId) {
    cache[topdeckId] = data.id;
  }
  return data.id;
}

async function upsertCommander(
  supabase: SupabaseAdmin,
  name: string,
  cache: CommanderCache
): Promise<number> {
  const normalizedName = normalizeText(name);
  const frontFaceName = getFrontFaceName(normalizedName);

  // Check cache first
  if (cache[normalizedName]) return cache[normalizedName];
  if (cache[frontFaceName]) return cache[frontFaceName];

  // Single upsert with conflict handling
  const { data, error } = await supabase
    .from('commanders')
    .upsert({ name: normalizedName, color_id: '' }, { onConflict: 'name' })
    .select('id')
    .single();

  if (error) throw error;

  cache[normalizedName] = data.id;
  cache[frontFaceName] = data.id;
  return data.id;
}

async function upsertCard(
  supabase: SupabaseAdmin,
  name: string,
  oracleId: string | null,
  cache: CardCache
): Promise<number> {
  const normalizedName = normalizeText(name);
  const frontFaceName = getFrontFaceName(normalizedName);

  // Check cache first
  if (cache[normalizedName]) return cache[normalizedName];
  if (cache[frontFaceName]) return cache[frontFaceName];

  // Single upsert with conflict handling
  const { data, error } = await supabase
    .from('cards')
    .upsert({ name: normalizedName, oracle_id: oracleId }, { onConflict: 'name' })
    .select('id')
    .single();

  if (error) throw error;

  cache[normalizedName] = data.id;
  cache[frontFaceName] = data.id;
  return data.id;
}

// ============================================
// Decklist Processing
// ============================================

async function processDeck(
  supabase: SupabaseAdmin,
  entryId: number,
  deckObj: DeckObj,
  cardCache: CardCache,
  stats: SyncStats,
  pendingItems: DecklistItem[]
): Promise<void> {
  const mainboardCards = getMainboardCards(deckObj);
  const commanderCards = getCommanderCards(deckObj);
  const allCards = [...mainboardCards, ...commanderCards];

  for (const card of allCards) {
    const cardId = await upsertCard(supabase, card.name, card.oracleId, cardCache);
    stats.cardsCreated++;

    pendingItems.push({
      entry_id: entryId,
      card_id: cardId,
      quantity: card.count,
    });
  }
}

async function flushDecklistItems(
  supabase: SupabaseAdmin,
  items: DecklistItem[]
): Promise<number> {
  if (items.length === 0) return 0;
  
  let inserted = 0;
  
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

// ============================================
// Round/Game Processing
// ============================================

async function processRounds(
  supabase: SupabaseAdmin,
  tournamentId: number,
  rounds: TournamentRound[],
  standings: StandingPlayer[],
  playerCache: PlayerCache,
  entryMap: Map<string, number>,
  stats: SyncStats
): Promise<void> {
  const playerNameToId = new Map<string, string>();
  for (const standing of standings) {
    if (standing.id && standing.name) {
      playerNameToId.set(standing.name.toLowerCase(), standing.id);
    }
  }

  for (const round of rounds) {
    const roundStr = String(round.round);

    for (const table of round.tables) {
      const isDraw = table.winner === 'Draw' || table.winner_id === 'Draw';

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

      for (let seatIndex = 0; seatIndex < table.players.length; seatIndex++) {
        const player = table.players[seatIndex];
        if (!player.id) continue;

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
            seat_position: seatIndex + 1,
          }, { onConflict: 'game_id,player_id', ignoreDuplicates: true });
      }
    }
  }
}

// ============================================
// Tournament Processing Context
// ============================================

interface TournamentContext {
  weekIdx: number;
  totalWeeks: number;
  tournamentIdx: number;
  totalTournaments: number;
}

// ============================================
// Tournament Processing
// ============================================

async function processTournament(
  supabase: SupabaseAdmin,
  tournament: TopdeckTournament,
  playerCache: PlayerCache,
  commanderCache: CommanderCache,
  cardCache: CardCache,
  stats: SyncStats,
  logger: ProgressLogger,
  context: TournamentContext
): Promise<{ entries: number; games: number; cards: number; durationMs: number }> {
  const tournamentStartTime = Date.now();
  const tournamentDate = new Date(tournament.startDate * 1000);
  const tournamentName = tournament.tournamentName || 'Unnamed Tournament';

  // Log tournament start with full context
  logger.logTournamentStart(
    tournamentName,
    tournament.TID,
    tournament.standings.length,
    context.weekIdx,
    context.totalWeeks
  );

  // === PHASE 1: Collect all entities needed ===
  const phase1Start = Date.now();
  const playersToUpsert: PlayerInput[] = [];
  const commandersToUpsert: CommanderInput[] = [];
  const cardsToUpsert: CardInput[] = [];
  
  // Collect from standings
  for (const standing of tournament.standings) {
    playersToUpsert.push({ name: standing.name, topdeckId: standing.id });
    
    const commanderName = normalizeCommanderName(standing.deckObj);
    if (commanderName) {
      commandersToUpsert.push({ name: commanderName });
    }
    
    if (standing.deckObj) {
      const mainboardCards = getMainboardCards(standing.deckObj);
      const commanderCards = getCommanderCards(standing.deckObj);
      for (const card of [...mainboardCards, ...commanderCards]) {
        cardsToUpsert.push({ name: card.name, oracleId: card.oracleId });
      }
    }
  }
  
  // Collect from rounds
  for (const round of tournament.rounds) {
    for (const table of round.tables) {
      for (const player of table.players) {
        if (player.id) {
          playersToUpsert.push({ name: player.name, topdeckId: player.id });
        }
      }
    }
  }
  
  logger.logTournamentProgress(
    tournamentName,
    'Collect entities',
    `${playersToUpsert.length} players, ${commandersToUpsert.length} commanders, ${cardsToUpsert.length} cards (${Date.now() - phase1Start}ms)`
  );

  // === PHASE 2: Batch upsert all entities ===
  const phase2Start = Date.now();
  await batchUpsertPlayers(supabase, playersToUpsert, playerCache);
  await batchUpsertCommanders(supabase, commandersToUpsert, commanderCache);
  await batchUpsertCards(supabase, cardsToUpsert, cardCache);
  
  logger.logTournamentProgress(
    tournamentName,
    'Batch upsert',
    `entities synced (${Date.now() - phase2Start}ms)`
  );
  
  // === PHASE 3: Insert tournament ===
  const phase3Start = Date.now();
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

  logger.logTournamentProgress(
    tournamentName,
    'Tournament record',
    `id=${tournamentId} (${Date.now() - phase3Start}ms)`
  );

  // === PHASE 4: Process entries (now using cached IDs) ===
  const phase4Start = Date.now();
  const entryMap = new Map<string, number>();
  const pendingDecklistItems: DecklistItem[] = [];
  let entriesProcessed = 0;
  let cardsProcessed = 0;

  for (let i = 0; i < tournament.standings.length; i++) {
    const standing = tournament.standings[i];

    const playerId = await upsertPlayer(
      supabase,
      standing.name,
      standing.id,
      playerCache
    );

    let commanderId: number | null = null;
    const commanderName = normalizeCommanderName(standing.deckObj);
    if (commanderName) {
      commanderId = await upsertCommander(supabase, commanderName, commanderCache);
      stats.commandersCreated++;
    }

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
    entriesProcessed++;

    if (standing.deckObj) {
      const beforeCards = pendingDecklistItems.length;
      await processDeck(supabase, entryId, standing.deckObj, cardCache, stats, pendingDecklistItems);
      cardsProcessed += pendingDecklistItems.length - beforeCards;
    }
    
    if (pendingDecklistItems.length >= DECKLIST_BATCH_SIZE) {
      await flushDecklistItems(supabase, pendingDecklistItems);
      pendingDecklistItems.length = 0;
    }
    
    // Log progress every 10 entries for large tournaments
    if (tournament.standings.length >= 30 && (i + 1) % 10 === 0) {
      logger.logTournamentProgress(
        tournamentName,
        'Entries',
        `${i + 1}/${tournament.standings.length} processed`
      );
    }
  }

  if (pendingDecklistItems.length > 0) {
    await flushDecklistItems(supabase, pendingDecklistItems);
  }

  logger.logTournamentProgress(
    tournamentName,
    'Entries complete',
    `${entriesProcessed} entries, ${cardsProcessed} decklist items (${Date.now() - phase4Start}ms)`
  );

  // === PHASE 5: Process rounds/games ===
  const phase5Start = Date.now();
  const gamesBeforeCount = stats.gamesCreated;
  
  await processRounds(
    supabase,
    tournamentId,
    tournament.rounds,
    tournament.standings,
    playerCache,
    entryMap,
    stats
  );

  const gamesCreated = stats.gamesCreated - gamesBeforeCount;
  logger.logTournamentProgress(
    tournamentName,
    'Rounds complete',
    `${tournament.rounds.length} rounds, ${gamesCreated} games (${Date.now() - phase5Start}ms)`
  );

  stats.tournamentsProcessed++;
  
  const totalDuration = Date.now() - tournamentStartTime;
  logger.logTournamentComplete(tournamentName, tournament.TID, entriesProcessed, gamesCreated, totalDuration);
  
  return {
    entries: entriesProcessed,
    games: gamesCreated,
    cards: cardsProcessed,
    durationMs: totalDuration,
  };
}

// ============================================
// Main Sync Function
// ============================================

export interface SyncOptions {
  /** Start date for syncing (defaults to 7 days ago for daily updates) */
  startDate?: Date;
  /** End date for syncing (defaults to now) */
  endDate?: Date;
  /** Custom progress logger */
  logger?: ProgressLogger;
}

/**
 * Sync tournaments from TopDeck.gg to the database.
 * Supports incremental updates - automatically skips existing tournaments.
 */
export async function syncTournaments(
  supabase: SupabaseAdmin,
  options: SyncOptions = {}
): Promise<SyncStats> {
  const {
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Default: 7 days ago
    endDate = new Date(),
    logger = createProgressLogger(),
  } = options;

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

  const syncStartTime = Date.now();
  
  logger.log(`════════════════════════════════════════════════════════════════════════`);
  logger.log(`SYNC JOB STARTED`);
  logger.log(`Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
  logger.log(`════════════════════════════════════════════════════════════════════════`);
  logger.logMemory();

  // Pre-load caches with timing
  logger.log(`Loading entity caches from database...`);
  const cacheLoadStart = Date.now();
  const playerCache = await preloadPlayerCache(supabase, logger);
  const commanderCache = await preloadCommanderCache(supabase, logger);
  const cardCache = await preloadCardCache(supabase, logger);
  logger.log(`Cache loading complete in ${Date.now() - cacheLoadStart}ms`);
  logger.logMemory();

  // Get existing tournament IDs with pagination (Supabase default limit is 1000)
  logger.log(`Checking existing tournaments...`);
  const existingTids = new Set<string>();
  let offset = 0;
  
  while (true) {
    const { data: existingTournaments } = await supabase
      .from('tournaments')
      .select('tid')
      .range(offset, offset + PAGE_SIZE - 1);

    if (!existingTournaments || existingTournaments.length === 0) break;
    
    for (const t of existingTournaments as { tid: string }[]) {
      existingTids.add(t.tid);
    }
    
    offset += PAGE_SIZE;
    if (existingTournaments.length < PAGE_SIZE) break;
  }
  
  logger.log(`Found ${logger.formatNumber(existingTids.size)} existing tournaments in database`);

  // Calculate total tournaments to process (estimate for ETA)
  const weeks = [...generateWeeklyRanges(startDate, endDate)];
  logger.log(`Will process ${weeks.length} weeks of tournament data`);
  
  // Start the main processing phase
  logger.startPhase('Sync Tournaments', weeks.length);

  // Track cumulative stats for reporting
  let totalTournamentsThisRun = 0;
  let totalEntriesThisRun = 0;
  let totalGamesThisRun = 0;
  let totalCardsThisRun = 0;

  for (let weekIdx = 0; weekIdx < weeks.length; weekIdx++) {
    const weekStartTime = Date.now();
    const week = weeks[weekIdx];
    
    // Week header
    const weekStartDate = new Date(week.start * 1000);
    const weekEndDate = new Date(week.end * 1000);
    logger.log(`📆 ══════════════════════════════════════════════════════════════════════`);
    logger.log(`📆 WEEK ${weekIdx + 1}/${weeks.length}: ${week.label}`);
    logger.log(`📆 Date range: ${weekStartDate.toISOString().split('T')[0]} to ${weekEndDate.toISOString().split('T')[0]}`);
    logger.log(`📆 ══════════════════════════════════════════════════════════════════════`);

    // Fetch tournaments for this week
    let tournaments;
    try {
      logger.debug(`Fetching tournaments from TopDeck API...`);
      const fetchStart = Date.now();
      tournaments = await listTournaments(week.start, week.end);
      logger.debug(`API response: ${tournaments.length} tournaments in ${Date.now() - fetchStart}ms`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to fetch week ${week.label}: ${errorMsg}`);
      stats.errors.push(`Week ${week.label}: ${errorMsg}`);
      logger.logWeekSummary(week.label, weekIdx, weeks.length, 0, 0, 1, Date.now() - weekStartTime);
      continue;
    }

    // Filter to new tournaments only
    const newTournaments = tournaments.filter(t => !existingTids.has(t.TID));
    const skippedCount = tournaments.length - newTournaments.length;

    if (skippedCount > 0) {
      stats.tournamentsSkipped += skippedCount;
      logger.debug(`Skipping ${skippedCount} existing tournaments`);
    }

    if (newTournaments.length === 0) {
      logger.log(`No new tournaments this week (${skippedCount} already synced)`);
      logger.increment();
      logger.logWeekSummary(week.label, weekIdx, weeks.length, 0, skippedCount, 0, Date.now() - weekStartTime);
      continue;
    }

    logger.log(`Found ${newTournaments.length} new tournaments to process (${skippedCount} skipped)`);

    // Process each tournament
    let weekTournamentsProcessed = 0;
    let weekErrors = 0;
    let weekEntries = 0;
    let weekGames = 0;
    let weekCards = 0;

    for (let tIdx = 0; tIdx < newTournaments.length; tIdx++) {
      const tournament = newTournaments[tIdx];
      
      if (!tournament.standings || tournament.standings.length === 0) {
        logger.debug(`Skipping ${tournament.TID}: no standings data`);
        stats.tournamentsSkipped++;
        continue;
      }

      try {
        const result = await processTournament(
          supabase,
          tournament,
          playerCache,
          commanderCache,
          cardCache,
          stats,
          logger,
          {
            weekIdx,
            totalWeeks: weeks.length,
            tournamentIdx: tIdx,
            totalTournaments: newTournaments.length,
          }
        );
        
        existingTids.add(tournament.TID);
        weekTournamentsProcessed++;
        weekEntries += result.entries;
        weekGames += result.games;
        weekCards += result.cards;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : '';
        logger.error(`Tournament ${tournament.TID} failed: ${errorMsg}`);
        if (stack) logger.debug(`Stack trace: ${stack}`);
        stats.errors.push(`${tournament.TID}: ${errorMsg}`);
        weekErrors++;
      }
    }

    logger.increment();
    
    // Update cumulative totals
    totalTournamentsThisRun += weekTournamentsProcessed;
    totalEntriesThisRun += weekEntries;
    totalGamesThisRun += weekGames;
    totalCardsThisRun += weekCards;

    // Week summary with detailed stats
    const weekDuration = Date.now() - weekStartTime;
    logger.logWeekSummary(
      week.label,
      weekIdx,
      weeks.length,
      weekTournamentsProcessed,
      skippedCount,
      weekErrors,
      weekDuration
    );
    
    // Cumulative progress update
    logger.log(`📊 Cumulative: ${logger.formatNumber(totalTournamentsThisRun)} tournaments, ${logger.formatNumber(totalEntriesThisRun)} entries, ${logger.formatNumber(totalGamesThisRun)} games, ${logger.formatNumber(totalCardsThisRun)} decklist items`);

    // Clear caches between weeks to prevent memory buildup during long jobs
    const playerCacheSize = Object.keys(playerCache).length;
    const commanderCacheSize = Object.keys(commanderCache).length;
    const cardCacheSize = Object.keys(cardCache).length;
    
    for (const key in playerCache) delete playerCache[key];
    for (const key in commanderCache) delete commanderCache[key];
    for (const key in cardCache) delete cardCache[key];
    
    logger.debug(`Cleared caches: ${logger.formatNumber(playerCacheSize)} players, ${logger.formatNumber(commanderCacheSize)} commanders, ${logger.formatNumber(cardCacheSize)} cards`);
    logger.logMemory();

    // Small delay between weeks
    if (weekIdx < weeks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 350));
    }
  }

  logger.endPhase();
  
  // Final job summary
  const totalDuration = Date.now() - syncStartTime;
  logger.log(`════════════════════════════════════════════════════════════════════════`);
  logger.log(`🎉 SYNC JOB COMPLETE`);
  logger.log(`════════════════════════════════════════════════════════════════════════`);
  logger.log(`Total duration: ${Math.round(totalDuration / 1000 / 60)} minutes (${totalDuration}ms)`);
  logger.log(`Tournaments: ${logger.formatNumber(stats.tournamentsProcessed)} processed, ${logger.formatNumber(stats.tournamentsSkipped)} skipped`);
  logger.log(`Entries: ${logger.formatNumber(stats.entriesCreated)}`);
  logger.log(`Games: ${logger.formatNumber(stats.gamesCreated)}`);
  logger.log(`Commanders: ${logger.formatNumber(stats.commandersCreated)}`);
  logger.log(`Cards: ${logger.formatNumber(stats.cardsCreated)}`);
  if (stats.errors.length > 0) {
    logger.warn(`Errors: ${stats.errors.length}`);
    stats.errors.slice(0, 10).forEach(err => logger.error(`  - ${err}`));
    if (stats.errors.length > 10) {
      logger.warn(`  ... and ${stats.errors.length - 10} more errors`);
    }
  }
  logger.logMemory();
  logger.log(`════════════════════════════════════════════════════════════════════════`);
  
  return stats;
}

/**
 * Full sync from a specific start date (for initial seeding).
 */
export async function syncTournamentsFromDate(
  supabase: SupabaseAdmin,
  startDate: Date,
  logger?: ProgressLogger
): Promise<SyncStats> {
  return syncTournaments(supabase, {
    startDate,
    endDate: new Date(),
    logger,
  });
}


