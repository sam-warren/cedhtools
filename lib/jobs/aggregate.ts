/**
 * Stats Aggregation Job
 * 
 * Aggregates tournament data into weekly statistics tables.
 * Always performs a full rebuild for data consistency.
 * 
 * Pipeline: sync -> enrich -> aggregate (this)
 */

import {
  type SupabaseAdmin,
  type AggregationStats,
  type ProgressLogger,
  createProgressLogger,
  getWeekStart,
  PAGE_SIZE,
} from './utils';

// ============================================
// Configuration
// ============================================

const MIN_STATS_DATE = '2024-06-01';
const INSERT_BATCH_SIZE = 1000;

// ============================================
// Types
// ============================================

interface TournamentData {
  id: number;
  tournament_date: string;
  top_cut: number;
  size: number;
}

// ============================================
// Shared Data Loading
// ============================================

async function loadTournaments(
  supabase: SupabaseAdmin,
  logger: ProgressLogger
): Promise<Map<number, TournamentData>> {
  logger.logSubPhase('Loading Tournaments', `from ${MIN_STATS_DATE}`);
  
  const loadStart = Date.now();
  const tournamentMap = new Map<number, TournamentData>();
  let offset = 0;
  let pages = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, tournament_date, top_cut, size')
      .gte('tournament_date', MIN_STATS_DATE)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    for (const t of data as TournamentData[]) {
      tournamentMap.set(t.id, t);
    }
    
    pages++;
    offset += PAGE_SIZE;
    if (data.length < PAGE_SIZE) break;
  }
  
  const elapsed = Date.now() - loadStart;
  logger.log(`Loaded ${logger.formatNumber(tournamentMap.size)} tournaments in ${pages} pages (${elapsed}ms)`);
  return tournamentMap;
}

// ============================================
// Commander Weekly Stats
// ============================================

async function aggregateCommanderWeeklyStats(
  supabase: SupabaseAdmin,
  tournamentMap: Map<number, TournamentData>,
  logger: ProgressLogger
): Promise<number> {
  // Get count for progress
  const { count: totalEntries } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .not('commander_id', 'is', null);
  
  logger.startPhase('Commander Weekly Stats', totalEntries ?? 0);
  logger.log(`Processing entries with valid decklists only`);
  logger.log(`Tournaments in scope: ${logger.formatNumber(tournamentMap.size)}`);
  
  // Clear existing stats
  logger.logSubPhase('Clearing existing stats');
  const clearStart = Date.now();
  await supabase.from('commander_weekly_stats').delete().neq('id', 0);
  logger.debug(`Cleared existing stats (${Date.now() - clearStart}ms)`);
  
  const statsMap = new Map<string, {
    commander_id: number;
    week_start: string;
    entries: number;
    entries_with_decklists: number;
    top_cuts: number;
    expected_top_cuts: number;
    wins: number;
    draws: number;
    losses: number;
  }>();
  
  let offset = 0;
  let totalProcessed = 0;
  let batchNum = 0;
  let entriesWithValidDecklists = 0;
  let entriesSkipped = 0;
  let entriesNoTournament = 0;
  
  logger.logSubPhase('Processing entries');
  
  while (true) {
    const batchStart = Date.now();
    batchNum++;
    
    const { data, error } = await supabase
      .from('entries')
      .select(`
        id,
        tournament_id,
        commander_id,
        standing,
        wins_swiss,
        wins_bracket,
        losses_swiss,
        losses_bracket,
        draws,
        decklist_valid,
        decklist_items (id)
      `)
      .not('commander_id', 'is', null)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    interface EntryData {
      id: number;
      tournament_id: number;
      commander_id: number;
      standing: number | null;
      wins_swiss: number;
      wins_bracket: number;
      losses_swiss: number;
      losses_bracket: number;
      draws: number;
      decklist_valid: boolean | null;
      decklist_items: { id: number }[] | null;
    }
    
    const entries = data as EntryData[] | null;
    if (!entries || entries.length === 0) break;
    
    logger.logBatchStart(batchNum, entries.length, 'entries');
    
    let batchIncluded = 0;
    let batchSkipped = 0;
    
    for (const entry of entries) {
      // Only include entries with valid decklists for consistency with card stats
      if (entry.decklist_valid !== true) {
        entriesSkipped++;
        batchSkipped++;
        continue;
      }
      
      const tournament = tournamentMap.get(entry.tournament_id);
      if (!tournament) {
        entriesNoTournament++;
        continue;
      }
      
      entriesWithValidDecklists++;
      batchIncluded++;
      
      const weekStart = getWeekStart(new Date(tournament.tournament_date));
      const key = `${entry.commander_id}-${weekStart}`;
      
      const existing = statsMap.get(key) || {
        commander_id: entry.commander_id,
        week_start: weekStart,
        entries: 0,
        entries_with_decklists: 0,
        top_cuts: 0,
        expected_top_cuts: 0,
        wins: 0,
        draws: 0,
        losses: 0,
      };
      
      // All stats now only count entries with valid decklists
      existing.entries += 1;
      existing.entries_with_decklists += 1;  // Same as entries now
      existing.wins += entry.wins_swiss + entry.wins_bracket;
      existing.draws += entry.draws;
      existing.losses += entry.losses_swiss + entry.losses_bracket;
      
      if (tournament.size > 0) {
        existing.expected_top_cuts += tournament.top_cut / tournament.size;
      }
      if (entry.standing && entry.standing <= tournament.top_cut) {
        existing.top_cuts += 1;
      }
      
      statsMap.set(key, existing);
    }
    
    totalProcessed += entries.length;
    logger.update(totalProcessed);
    logger.logBatchComplete(batchNum, totalProcessed, totalEntries ?? 0, Date.now() - batchStart);
    logger.debug(`Batch ${batchNum}: ${batchIncluded} included, ${batchSkipped} skipped (no valid decklist)`);
    
    // Check for cancellation between batches
    await logger.checkCancelled();
    
    offset += PAGE_SIZE;
    if (entries.length < PAGE_SIZE) break;
  }
  
  // Log aggregation summary
  logger.log(`Aggregation complete: ${logger.formatNumber(entriesWithValidDecklists)} entries -> ${logger.formatNumber(statsMap.size)} stat rows`);
  logger.log(`Skipped: ${logger.formatNumber(entriesSkipped)} (no valid decklist), ${logger.formatNumber(entriesNoTournament)} (no tournament match)`);
  
  // Insert aggregated stats in batches
  logger.logSubPhase('Inserting aggregated stats', `${logger.formatNumber(statsMap.size)} rows`);
  const statsArray = Array.from(statsMap.values());
  const insertStart = Date.now();
  let insertedBatches = 0;
  
  for (let i = 0; i < statsArray.length; i += INSERT_BATCH_SIZE) {
    const batch = statsArray.slice(i, i + INSERT_BATCH_SIZE);
    const { error: insertError } = await supabase
      .from('commander_weekly_stats')
      .insert(batch);
    if (insertError) throw insertError;
    insertedBatches++;
    
    if (insertedBatches % 10 === 0) {
      logger.debug(`Inserted ${logger.formatNumber(i + batch.length)}/${logger.formatNumber(statsArray.length)} rows...`);
    }
  }
  
  logger.log(`Inserted ${logger.formatNumber(statsArray.length)} rows in ${insertedBatches} batches (${Date.now() - insertStart}ms)`);
  logger.endPhase();
  return statsArray.length;
}

// ============================================
// Card-Commander Weekly Stats
// ============================================

async function aggregateCardCommanderWeeklyStats(
  supabase: SupabaseAdmin,
  tournamentMap: Map<number, TournamentData>,
  logger: ProgressLogger
): Promise<number> {
  // Clear existing stats
  logger.logSubPhase('Clearing existing card-commander stats');
  const clearStart = Date.now();
  await supabase.from('card_commander_weekly_stats').delete().neq('id', 0);
  logger.debug(`Cleared existing stats (${Date.now() - clearStart}ms)`);
  
  // Load entries with valid decklists
  logger.logSubPhase('Loading entries with valid decklists');
  const entryLoadStart = Date.now();
  const entryMap = new Map<number, {
    commander_id: number;
    standing: number | null;
    wins_swiss: number;
    wins_bracket: number;
    losses_swiss: number;
    losses_bracket: number;
    draws: number;
    tournament_date: string;
    top_cut: number;
    tournament_size: number;
  }>();
  
  let entryOffset = 0;
  let entryPages = 0;
  let entriesSkipped = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('entries')
      .select(`
        id,
        tournament_id,
        commander_id,
        standing,
        wins_swiss,
        wins_bracket,
        losses_swiss,
        losses_bracket,
        draws
      `)
      .not('commander_id', 'is', null)
      .eq('decklist_valid', true)
      .order('id', { ascending: true })
      .range(entryOffset, entryOffset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    interface EntryData {
      id: number;
      tournament_id: number;
      commander_id: number;
      standing: number | null;
      wins_swiss: number;
      wins_bracket: number;
      losses_swiss: number;
      losses_bracket: number;
      draws: number;
    }
    
    const entries = data as EntryData[] | null;
    if (!entries || entries.length === 0) break;
    
    for (const entry of entries) {
      const tournament = tournamentMap.get(entry.tournament_id);
      if (!tournament) {
        entriesSkipped++;
        continue;
      }
      
      entryMap.set(entry.id, {
        commander_id: entry.commander_id,
        standing: entry.standing,
        wins_swiss: entry.wins_swiss,
        wins_bracket: entry.wins_bracket,
        losses_swiss: entry.losses_swiss,
        losses_bracket: entry.losses_bracket,
        draws: entry.draws,
        tournament_date: tournament.tournament_date,
        top_cut: tournament.top_cut,
        tournament_size: tournament.size,
      });
    }
    
    entryPages++;
    entryOffset += PAGE_SIZE;
    if (entries.length < PAGE_SIZE) break;
  }
  
  logger.log(`Loaded ${logger.formatNumber(entryMap.size)} entries in ${entryPages} pages (${Date.now() - entryLoadStart}ms)`);
  if (entriesSkipped > 0) {
    logger.debug(`Skipped ${logger.formatNumber(entriesSkipped)} entries (no matching tournament)`);
  }
  logger.logMemory();
  
  // Get count for progress
  const { count: totalItems } = await supabase
    .from('decklist_items')
    .select('id', { count: 'exact', head: true });
  
  logger.startPhase('Card-Commander Weekly Stats', totalItems ?? 0);
  logger.log(`Processing ${logger.formatNumber(totalItems ?? 0)} decklist items`);
  
  const statsMap = new Map<string, {
    card_id: number;
    commander_id: number;
    week_start: string;
    entries: number;
    top_cuts: number;
    expected_top_cuts: number;
    wins: number;
    draws: number;
    losses: number;
  }>();
  
  let itemOffset = 0;
  let totalProcessed = 0;
  let batchNum = 0;
  let itemsMatched = 0;
  let itemsNoEntry = 0;
  
  while (true) {
    const batchStart = Date.now();
    batchNum++;
    
    const { data, error } = await supabase
      .from('decklist_items')
      .select('entry_id, card_id')
      .order('id', { ascending: true })
      .range(itemOffset, itemOffset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    const items = data as { entry_id: number; card_id: number }[] | null;
    if (!items || items.length === 0) break;
    
    logger.logBatchStart(batchNum, items.length, 'decklist items');
    
    let batchMatched = 0;
    
    for (const item of items) {
      const entryId = typeof item.entry_id === 'string' ? parseInt(item.entry_id, 10) : item.entry_id;
      const entry = entryMap.get(entryId);
      if (!entry) {
        itemsNoEntry++;
        continue;
      }
      
      itemsMatched++;
      batchMatched++;
      
      const weekStart = getWeekStart(new Date(entry.tournament_date));
      const key = `${item.card_id}-${entry.commander_id}-${weekStart}`;
      
      const existing = statsMap.get(key) || {
        card_id: item.card_id,
        commander_id: entry.commander_id,
        week_start: weekStart,
        entries: 0,
        top_cuts: 0,
        expected_top_cuts: 0,
        wins: 0,
        draws: 0,
        losses: 0,
      };
      
      existing.entries += 1;
      existing.wins += entry.wins_swiss + entry.wins_bracket;
      existing.draws += entry.draws;
      existing.losses += entry.losses_swiss + entry.losses_bracket;
      
      if (entry.tournament_size > 0) {
        existing.expected_top_cuts += entry.top_cut / entry.tournament_size;
      }
      if (entry.standing !== null && entry.standing <= entry.top_cut) {
        existing.top_cuts += 1;
      }
      
      statsMap.set(key, existing);
    }
    
    totalProcessed += items.length;
    logger.update(totalProcessed);
    logger.logBatchComplete(batchNum, totalProcessed, totalItems ?? 0, Date.now() - batchStart);
    
    // Log stats map growth every 10 batches
    if (batchNum % 10 === 0) {
      logger.debug(`Stats map size: ${logger.formatNumber(statsMap.size)} unique card-commander-week combinations`);
    }
    
    // Check for cancellation between batches
    await logger.checkCancelled();
    
    itemOffset += PAGE_SIZE;
    if (items.length < PAGE_SIZE) break;
  }
  
  logger.log(`Aggregation complete: ${logger.formatNumber(itemsMatched)} items -> ${logger.formatNumber(statsMap.size)} stat rows`);
  if (itemsNoEntry > 0) {
    logger.debug(`Skipped ${logger.formatNumber(itemsNoEntry)} items (no matching entry with valid decklist)`);
  }
  
  // Insert aggregated stats in batches
  logger.logSubPhase('Inserting aggregated stats', `${logger.formatNumber(statsMap.size)} rows`);
  const statsArray = Array.from(statsMap.values());
  const insertStart = Date.now();
  let insertedBatches = 0;
  
  for (let i = 0; i < statsArray.length; i += INSERT_BATCH_SIZE) {
    const batch = statsArray.slice(i, i + INSERT_BATCH_SIZE);
    const { error: insertError } = await supabase
      .from('card_commander_weekly_stats')
      .insert(batch);
    if (insertError) throw insertError;
    insertedBatches++;
    
    // Log insert progress every 50 batches
    if (insertedBatches % 50 === 0) {
      const inserted = i + batch.length;
      const percent = ((inserted / statsArray.length) * 100).toFixed(1);
      logger.debug(`Inserted ${logger.formatNumber(inserted)}/${logger.formatNumber(statsArray.length)} rows (${percent}%)...`);
    }
  }
  
  logger.log(`Inserted ${logger.formatNumber(statsArray.length)} rows in ${insertedBatches} batches (${Date.now() - insertStart}ms)`);
  logger.endPhase();
  return statsArray.length;
}

// ============================================
// Seat Position Weekly Stats
// ============================================

async function aggregateSeatPositionWeeklyStats(
  supabase: SupabaseAdmin,
  tournamentMap: Map<number, TournamentData>,
  logger: ProgressLogger
): Promise<number> {
  // Clear existing stats
  logger.logSubPhase('Clearing existing seat position stats');
  const clearStart = Date.now();
  await supabase.from('seat_position_weekly_stats').delete().neq('id', 0);
  logger.debug(`Cleared existing stats (${Date.now() - clearStart}ms)`);
  
  // Load games
  logger.logSubPhase('Loading games');
  const gameLoadStart = Date.now();
  const gameMap = new Map<number, { 
    tournament_id: number; 
    winner_player_id: number | null;
    is_draw: boolean;
  }>();
  
  let gameOffset = 0;
  let gamePages = 0;
  let gamesSkipped = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('games')
      .select('id, tournament_id, winner_player_id, is_draw')
      .order('id', { ascending: true })
      .range(gameOffset, gameOffset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    const games = data as { id: number; tournament_id: number; winner_player_id: number | null; is_draw: boolean }[] | null;
    if (!games || games.length === 0) break;
    
    for (const g of games) {
      if (tournamentMap.has(g.tournament_id)) {
        gameMap.set(g.id, {
          tournament_id: g.tournament_id,
          winner_player_id: g.winner_player_id,
          is_draw: g.is_draw,
        });
      } else {
        gamesSkipped++;
      }
    }
    
    gamePages++;
    gameOffset += PAGE_SIZE;
    if (games.length < PAGE_SIZE) break;
  }
  
  logger.log(`Loaded ${logger.formatNumber(gameMap.size)} games in ${gamePages} pages (${Date.now() - gameLoadStart}ms)`);
  if (gamesSkipped > 0) {
    logger.debug(`Skipped ${logger.formatNumber(gamesSkipped)} games (no matching tournament)`);
  }
  
  // Load entries for commander lookup (only valid decklists for consistency)
  logger.logSubPhase('Loading entries for commander lookup');
  const entryLoadStart = Date.now();
  const entryCommanderMap = new Map<number, number>();
  
  let entryOffset = 0;
  let entryPages = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('entries')
      .select('id, commander_id')
      .not('commander_id', 'is', null)
      .eq('decklist_valid', true)
      .order('id', { ascending: true })
      .range(entryOffset, entryOffset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    const entries = data as { id: number; commander_id: number }[] | null;
    if (!entries || entries.length === 0) break;
    
    for (const e of entries) {
      entryCommanderMap.set(e.id, e.commander_id);
    }
    
    entryPages++;
    entryOffset += PAGE_SIZE;
    if (entries.length < PAGE_SIZE) break;
  }
  
  logger.log(`Loaded ${logger.formatNumber(entryCommanderMap.size)} entries in ${entryPages} pages (${Date.now() - entryLoadStart}ms)`);
  logger.logMemory();
  
  // Get count for progress
  const { count: totalGamePlayers } = await supabase
    .from('game_players')
    .select('id', { count: 'exact', head: true });
  
  logger.startPhase('Seat Position Weekly Stats', totalGamePlayers ?? 0);
  logger.log(`Processing ${logger.formatNumber(totalGamePlayers ?? 0)} game player records`);
  
  const statsMap = new Map<string, {
    commander_id: number;
    seat_position: number;
    week_start: string;
    games: number;
    wins: number;
  }>();
  
  let gpOffset = 0;
  let totalProcessed = 0;
  let batchNum = 0;
  let recordsMatched = 0;
  let recordsNoGame = 0;
  let recordsNoEntry = 0;
  let recordsNoCommander = 0;
  let totalWins = 0;
  
  while (true) {
    const batchStart = Date.now();
    batchNum++;
    
    const { data, error } = await supabase
      .from('game_players')
      .select('game_id, player_id, entry_id, seat_position')
      .order('id', { ascending: true })
      .range(gpOffset, gpOffset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    const gamePlayers = data as { game_id: number; player_id: number; entry_id: number | null; seat_position: number }[] | null;
    if (!gamePlayers || gamePlayers.length === 0) break;
    
    logger.logBatchStart(batchNum, gamePlayers.length, 'game players');
    
    let batchWins = 0;
    
    for (const gp of gamePlayers) {
      const game = gameMap.get(gp.game_id);
      if (!game) {
        recordsNoGame++;
        continue;
      }
      
      if (!gp.entry_id) {
        recordsNoEntry++;
        continue;
      }
      
      const commanderId = entryCommanderMap.get(gp.entry_id);
      if (!commanderId) {
        recordsNoCommander++;
        continue;
      }
      
      const tournament = tournamentMap.get(game.tournament_id);
      if (!tournament) continue;
      
      recordsMatched++;
      
      const weekStart = getWeekStart(new Date(tournament.tournament_date));
      const key = `${commanderId}-${gp.seat_position}-${weekStart}`;
      
      const existing = statsMap.get(key) || {
        commander_id: commanderId,
        seat_position: gp.seat_position,
        week_start: weekStart,
        games: 0,
        wins: 0,
      };
      
      existing.games += 1;
      if (!game.is_draw && game.winner_player_id === gp.player_id) {
        existing.wins += 1;
        batchWins++;
        totalWins++;
      }
      
      statsMap.set(key, existing);
    }
    
    totalProcessed += gamePlayers.length;
    logger.update(totalProcessed);
    logger.logBatchComplete(batchNum, totalProcessed, totalGamePlayers ?? 0, Date.now() - batchStart);
    
    // Log win rate every 10 batches
    if (batchNum % 10 === 0) {
      const winRate = recordsMatched > 0 ? ((totalWins / recordsMatched) * 100).toFixed(1) : '0';
      logger.debug(`Stats: ${logger.formatNumber(statsMap.size)} unique combinations, win rate: ${winRate}%`);
    }
    
    // Check for cancellation between batches
    await logger.checkCancelled();
    
    gpOffset += PAGE_SIZE;
    if (gamePlayers.length < PAGE_SIZE) break;
  }
  
  logger.log(`Aggregation complete: ${logger.formatNumber(recordsMatched)} records -> ${logger.formatNumber(statsMap.size)} stat rows`);
  logger.debug(`Skipped: ${logger.formatNumber(recordsNoGame)} no game, ${logger.formatNumber(recordsNoEntry)} no entry, ${logger.formatNumber(recordsNoCommander)} no commander`);
  
  // Insert aggregated stats in batches
  logger.logSubPhase('Inserting aggregated stats', `${logger.formatNumber(statsMap.size)} rows`);
  const statsArray = Array.from(statsMap.values());
  const insertStart = Date.now();
  let insertedBatches = 0;
  
  for (let i = 0; i < statsArray.length; i += INSERT_BATCH_SIZE) {
    const batch = statsArray.slice(i, i + INSERT_BATCH_SIZE);
    const { error: insertError } = await supabase
      .from('seat_position_weekly_stats')
      .insert(batch);
    if (insertError) throw insertError;
    insertedBatches++;
    
    if (insertedBatches % 20 === 0) {
      const inserted = i + batch.length;
      const percent = ((inserted / statsArray.length) * 100).toFixed(1);
      logger.debug(`Inserted ${logger.formatNumber(inserted)}/${logger.formatNumber(statsArray.length)} rows (${percent}%)...`);
    }
  }
  
  logger.log(`Inserted ${logger.formatNumber(statsArray.length)} rows in ${insertedBatches} batches (${Date.now() - insertStart}ms)`);
  logger.endPhase();
  return statsArray.length;
}

// ============================================
// Main Aggregation Function
// ============================================

export interface AggregateOptions {
  logger?: ProgressLogger;
}

export async function aggregateStats(
  supabase: SupabaseAdmin,
  options: AggregateOptions = {}
): Promise<AggregationStats> {
  const { logger = createProgressLogger() } = options;
  
  const startTime = Date.now();
  
  logger.log(`════════════════════════════════════════════════════════════════════════`);
  logger.log(`AGGREGATION JOB STARTED`);
  logger.log(`Minimum date: ${MIN_STATS_DATE}`);
  logger.log(`════════════════════════════════════════════════════════════════════════`);
  logger.logMemory();
  
  // Load tournament data once and share across all aggregations
  const tournamentMap = await loadTournaments(supabase, logger);
  
  const commanderWeeklyStats = await aggregateCommanderWeeklyStats(supabase, tournamentMap, logger);
  const cardCommanderWeeklyStats = await aggregateCardCommanderWeeklyStats(supabase, tournamentMap, logger);
  const seatPositionWeeklyStats = await aggregateSeatPositionWeeklyStats(supabase, tournamentMap, logger);
  
  // Final summary
  const totalDuration = Date.now() - startTime;
  logger.log(`════════════════════════════════════════════════════════════════════════`);
  logger.log(`🎉 AGGREGATION JOB COMPLETE`);
  logger.log(`════════════════════════════════════════════════════════════════════════`);
  logger.log(`Duration: ${Math.round(totalDuration / 1000)}s`);
  logger.log(`Commander weekly stats: ${commanderWeeklyStats.toLocaleString()}`);
  logger.log(`Card-commander weekly stats: ${cardCommanderWeeklyStats.toLocaleString()}`);
  logger.log(`Seat position weekly stats: ${seatPositionWeeklyStats.toLocaleString()}`);
  logger.logMemory();
  logger.log(`════════════════════════════════════════════════════════════════════════`);
  
  return {
    commanderWeeklyStats,
    cardCommanderWeeklyStats,
    seatPositionWeeklyStats,
  };
}
