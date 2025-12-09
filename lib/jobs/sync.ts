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
} from '../topdeck';
import type {
  DeckObj,
  StandingPlayer,
  TopdeckTournament,
  TournamentRound
} from '../topdeck/types';
import {
  getCommanderCards,
  getMainboardCards,
  normalizeCommanderName
} from '../topdeck/types';
import {
  type SupabaseAdmin,
  type SyncStats,
  type ProgressLogger,
  createProgressLogger,
  normalizeText,
  getFrontFaceName,
  isDFCName,
  PAGE_SIZE,
  BATCH_SIZE,
} from './utils';

// ============================================
// Configuration
// ============================================

const DECKLIST_BATCH_SIZE = 500;

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
  logger.log('Pre-loading player cache...');
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
  
  logger.log(`Loaded ${total} players into cache`);
  return cache;
}

async function preloadCommanderCache(
  supabase: SupabaseAdmin,
  logger: ProgressLogger
): Promise<CommanderCache> {
  logger.log('Pre-loading commander cache...');
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
      if (cmd.name.includes(' // ')) {
        const frontFace = cmd.name.split(' // ')[0].trim();
        cache[frontFace] = cmd.id;
      }
    }
    
    total += data.length;
    offset += PAGE_SIZE;
    if (data.length < PAGE_SIZE) break;
  }
  
  logger.log(`Loaded ${total} commanders into cache`);
  return cache;
}

async function preloadCardCache(
  supabase: SupabaseAdmin,
  logger: ProgressLogger
): Promise<CardCache> {
  logger.log('Pre-loading card cache...');
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
      if (card.name.includes(' // ')) {
        const frontFace = card.name.split(' // ')[0].trim();
        cache[frontFace] = card.id;
      }
    }
    
    total += data.length;
    offset += PAGE_SIZE;
    if (data.length < PAGE_SIZE) break;
  }
  
  logger.log(`Loaded ${total} cards into cache`);
  return cache;
}

// ============================================
// Upsert Functions
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

  const { data, error } = await supabase
    .from('players')
    .insert({ name, topdeck_id: topdeckId })
    .select('id')
    .single();

  if (error) {
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
  supabase: SupabaseAdmin,
  name: string,
  cache: CommanderCache
): Promise<number> {
  const normalizedName = normalizeText(name);
  const frontFaceName = getFrontFaceName(normalizedName);

  if (cache[normalizedName]) {
    return cache[normalizedName];
  }
  if (cache[frontFaceName]) {
    return cache[frontFaceName];
  }

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

  if (isDFCName(normalizedName)) {
    const { data: shortVersion } = await supabase
      .from('commanders')
      .select('id')
      .eq('name', frontFaceName)
      .single();
    
    if (shortVersion) {
      await supabase
        .from('commanders')
        .update({ name: normalizedName })
        .eq('id', shortVersion.id);
      
      cache[normalizedName] = shortVersion.id;
      cache[frontFaceName] = shortVersion.id;
      return shortVersion.id;
    }
  }

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
  supabase: SupabaseAdmin,
  name: string,
  oracleId: string | null,
  cache: CardCache
): Promise<number> {
  const normalizedName = normalizeText(name);
  const frontFaceName = getFrontFaceName(normalizedName);

  if (cache[normalizedName]) {
    return cache[normalizedName];
  }
  if (cache[frontFaceName]) {
    return cache[frontFaceName];
  }

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

  if (isDFCName(normalizedName)) {
    const { data: shortVersion } = await supabase
      .from('cards')
      .select('id')
      .eq('name', frontFaceName)
      .single();
    
    if (shortVersion) {
      await supabase
        .from('cards')
        .update({ name: normalizedName })
        .eq('id', shortVersion.id);
      
      cache[normalizedName] = shortVersion.id;
      cache[frontFaceName] = shortVersion.id;
      return shortVersion.id;
    }
  }

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
// Tournament Processing
// ============================================

async function processTournament(
  supabase: SupabaseAdmin,
  tournament: TopdeckTournament,
  playerCache: PlayerCache,
  commanderCache: CommanderCache,
  cardCache: CardCache,
  stats: SyncStats
): Promise<void> {
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

  const entryMap = new Map<string, number>();
  const pendingDecklistItems: DecklistItem[] = [];

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

    if (standing.deckObj) {
      await processDeck(supabase, entryId, standing.deckObj, cardCache, stats, pendingDecklistItems);
    }
    
    if (pendingDecklistItems.length >= DECKLIST_BATCH_SIZE) {
      await flushDecklistItems(supabase, pendingDecklistItems);
      pendingDecklistItems.length = 0;
    }
  }

  if (pendingDecklistItems.length > 0) {
    await flushDecklistItems(supabase, pendingDecklistItems);
  }

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

  logger.log(`Syncing tournaments from ${startDate.toISOString()} to ${endDate.toISOString()}`);

  // Pre-load caches
  const playerCache = await preloadPlayerCache(supabase, logger);
  const commanderCache = await preloadCommanderCache(supabase, logger);
  const cardCache = await preloadCardCache(supabase, logger);

  // Get existing tournament IDs
  const existingTids = new Set<string>();
  const { data: existingTournaments } = await supabase
    .from('tournaments')
    .select('tid');

  if (existingTournaments) {
    for (const t of existingTournaments as { tid: string }[]) {
      existingTids.add(t.tid);
    }
  }
  logger.log(`Found ${existingTids.size} existing tournaments`);

  // Process week by week
  const weeks = [...generateWeeklyRanges(startDate, endDate)];
  logger.startPhase('Processing weeks', weeks.length);

  for (let weekIdx = 0; weekIdx < weeks.length; weekIdx++) {
    const week = weeks[weekIdx];

    let tournaments;
    try {
      tournaments = await listTournaments(week.start, week.end);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.log(`Failed to fetch week ${week.label}: ${errorMsg}`);
      stats.errors.push(`Week ${week.label}: ${errorMsg}`);
      continue;
    }

    // Filter to new tournaments only
    const newTournaments = tournaments.filter(t => !existingTids.has(t.TID));
    const skippedCount = tournaments.length - newTournaments.length;

    if (skippedCount > 0) {
      stats.tournamentsSkipped += skippedCount;
    }

    if (newTournaments.length === 0) {
      logger.increment();
      continue;
    }

    logger.log(`Week ${week.label}: ${newTournaments.length} new tournaments`);

    for (const tournament of newTournaments) {
      if (!tournament.standings || tournament.standings.length === 0) {
        stats.tournamentsSkipped++;
        continue;
      }

      try {
        await processTournament(
          supabase,
          tournament,
          playerCache,
          commanderCache,
          cardCache,
          stats
        );
        existingTids.add(tournament.TID);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        stats.errors.push(`${tournament.TID}: ${errorMsg}`);
      }
    }

    logger.increment();

    // Small delay between weeks
    if (weekIdx < weeks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 350));
    }
  }

  logger.endPhase();
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

