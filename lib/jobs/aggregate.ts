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

// Minimum date for temporal stats - data before this date is excluded
const MIN_STATS_DATE = '2024-06-01';

// ============================================
// Commander Weekly Stats
// ============================================

async function aggregateCommanderWeeklyStats(
  supabase: SupabaseAdmin,
  logger: ProgressLogger
): Promise<number> {
  logger.log('Aggregating commander weekly stats...');
  
  // Clear existing stats
  await supabase.from('commander_weekly_stats').delete().neq('id', 0);
  
  // Load tournaments
  logger.log(`Loading tournament data (from ${MIN_STATS_DATE})...`);
  const tournamentMap = new Map<number, { tournament_date: string; top_cut: number; size: number }>();
  
  let tournamentOffset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, tournament_date, top_cut, size')
      .gte('tournament_date', MIN_STATS_DATE)
      .order('id', { ascending: true })
      .range(tournamentOffset, tournamentOffset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    const tournaments = data as { id: number; tournament_date: string; top_cut: number; size: number }[] | null;
    if (!tournaments || tournaments.length === 0) break;
    
    for (const t of tournaments) {
      tournamentMap.set(t.id, { tournament_date: t.tournament_date, top_cut: t.top_cut, size: t.size });
    }
    
    tournamentOffset += PAGE_SIZE;
    if (tournaments.length < PAGE_SIZE) break;
  }
  
  logger.log(`Loaded ${tournamentMap.size} tournaments`);
  
  // Group by commander and week
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
  
  // Process entries
  logger.log('Loading entries...');
  let offset = 0;
  let totalProcessed = 0;
  
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
        draws,
        decklist_items (
          id
        )
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
      decklist_items: { id: number }[] | null;
    }
    
    const entries = data as EntryData[] | null;
    if (!entries || entries.length === 0) break;
    
    for (const entry of entries) {
      const tournament = tournamentMap.get(entry.tournament_id);
      if (!tournament) continue;
      
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
      
      existing.entries += 1;
      
      if (entry.decklist_items && entry.decklist_items.length > 0) {
        existing.entries_with_decklists += 1;
      }
      
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
    offset += PAGE_SIZE;
    if (entries.length < PAGE_SIZE) break;
  }
  
  logger.log(`Processed ${totalProcessed} entries`);
  
  // Insert aggregated stats
  const statsArray = Array.from(statsMap.values());
  
  if (statsArray.length > 0) {
    for (let i = 0; i < statsArray.length; i += 1000) {
      const batch = statsArray.slice(i, i + 1000);
      const { error: insertError } = await supabase
        .from('commander_weekly_stats')
        .insert(batch);
      
      if (insertError) throw insertError;
    }
  }
  
  logger.log(`Created ${statsArray.length} commander weekly stat records`);
  return statsArray.length;
}

// ============================================
// Card-Commander Weekly Stats
// ============================================

async function aggregateCardCommanderWeeklyStats(
  supabase: SupabaseAdmin,
  logger: ProgressLogger
): Promise<number> {
  logger.log('Aggregating card-commander weekly stats...');
  
  // Clear existing stats
  await supabase.from('card_commander_weekly_stats').delete().neq('id', 0);
  
  // Load tournaments
  logger.log(`Loading tournament data (from ${MIN_STATS_DATE})...`);
  const tournamentMap = new Map<number, { tournament_date: string; top_cut: number; size: number }>();
  
  let tournamentOffset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, tournament_date, top_cut, size')
      .gte('tournament_date', MIN_STATS_DATE)
      .order('id', { ascending: true })
      .range(tournamentOffset, tournamentOffset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    const tournaments = data as { id: number; tournament_date: string; top_cut: number; size: number }[] | null;
    if (!tournaments || tournaments.length === 0) break;
    
    for (const t of tournaments) {
      tournamentMap.set(t.id, { tournament_date: t.tournament_date, top_cut: t.top_cut, size: t.size });
    }
    
    tournamentOffset += PAGE_SIZE;
    if (tournaments.length < PAGE_SIZE) break;
  }
  
  logger.log(`Loaded ${tournamentMap.size} tournaments`);
  
  // Load entries with valid decklists
  logger.log('Loading entry data (valid decklists only)...');
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
        draws,
        decklist_valid
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
      decklist_valid: boolean | null;
    }
    
    const entries = data as EntryData[] | null;
    if (!entries || entries.length === 0) break;
    
    for (const entry of entries) {
      const tournament = tournamentMap.get(entry.tournament_id);
      if (!tournament) continue;
      
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
    
    entryOffset += PAGE_SIZE;
    if (entries.length < PAGE_SIZE) break;
  }
  
  logger.log(`Loaded ${entryMap.size} entries with valid decklists`);
  
  // Process decklist items
  logger.log('Processing decklist items...');
  
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
  let totalItems = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('decklist_items')
      .select('entry_id, card_id')
      .order('id', { ascending: true })
      .range(itemOffset, itemOffset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    const items = data as { entry_id: number; card_id: number }[] | null;
    if (!items || items.length === 0) break;
    
    for (const item of items) {
      const entryId = typeof item.entry_id === 'string' ? parseInt(item.entry_id, 10) : item.entry_id;
      const entry = entryMap.get(entryId);
      if (!entry) continue;
      
      const weekStart = getWeekStart(new Date(entry.tournament_date));
      const isTopCut = entry.standing !== null && entry.standing <= entry.top_cut;
      
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
      
      if (isTopCut) {
        existing.top_cuts += 1;
      }
      
      statsMap.set(key, existing);
    }
    
    totalItems += items.length;
    itemOffset += PAGE_SIZE;
    if (items.length < PAGE_SIZE) break;
  }
  
  logger.log(`Processed ${totalItems} decklist items`);
  
  // Insert aggregated stats
  const statsArray = Array.from(statsMap.values());
  
  if (statsArray.length > 0) {
    for (let i = 0; i < statsArray.length; i += 1000) {
      const batch = statsArray.slice(i, i + 1000);
      const { error: insertError } = await supabase
        .from('card_commander_weekly_stats')
        .insert(batch);
      
      if (insertError) throw insertError;
    }
  }
  
  logger.log(`Created ${statsArray.length} card-commander weekly stat records`);
  return statsArray.length;
}

// ============================================
// Seat Position Weekly Stats
// ============================================

async function aggregateSeatPositionWeeklyStats(
  supabase: SupabaseAdmin,
  logger: ProgressLogger
): Promise<number> {
  logger.log('Aggregating seat position weekly stats...');
  
  // Clear existing stats
  await supabase.from('seat_position_weekly_stats').delete().neq('id', 0);
  
  // Load tournaments
  logger.log(`Loading tournament data (from ${MIN_STATS_DATE})...`);
  const tournamentMap = new Map<number, { tournament_date: string }>();
  
  let tournamentOffset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, tournament_date')
      .gte('tournament_date', MIN_STATS_DATE)
      .order('id', { ascending: true })
      .range(tournamentOffset, tournamentOffset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    const tournaments = data as { id: number; tournament_date: string }[] | null;
    if (!tournaments || tournaments.length === 0) break;
    
    for (const t of tournaments) {
      tournamentMap.set(t.id, { tournament_date: t.tournament_date });
    }
    
    tournamentOffset += PAGE_SIZE;
    if (tournaments.length < PAGE_SIZE) break;
  }
  
  logger.log(`Loaded ${tournamentMap.size} tournaments`);
  
  // Load games
  logger.log('Loading games...');
  const gameMap = new Map<number, { 
    tournament_id: number; 
    winner_player_id: number | null;
    is_draw: boolean;
  }>();
  
  let gameOffset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('games')
      .select('id, tournament_id, winner_player_id, is_draw')
      .order('id', { ascending: true })
      .range(gameOffset, gameOffset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    interface GameData {
      id: number;
      tournament_id: number;
      winner_player_id: number | null;
      is_draw: boolean;
    }
    
    const games = data as GameData[] | null;
    if (!games || games.length === 0) break;
    
    for (const g of games) {
      if (tournamentMap.has(g.tournament_id)) {
        gameMap.set(g.id, {
          tournament_id: g.tournament_id,
          winner_player_id: g.winner_player_id,
          is_draw: g.is_draw,
        });
      }
    }
    
    gameOffset += PAGE_SIZE;
    if (games.length < PAGE_SIZE) break;
  }
  
  logger.log(`Loaded ${gameMap.size} games`);
  
  // Load entries for commander lookup
  logger.log('Loading entries for commander lookup...');
  const entryCommanderMap = new Map<number, number>();
  
  let entryOffset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('entries')
      .select('id, commander_id')
      .not('commander_id', 'is', null)
      .order('id', { ascending: true })
      .range(entryOffset, entryOffset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    const entries = data as { id: number; commander_id: number }[] | null;
    if (!entries || entries.length === 0) break;
    
    for (const e of entries) {
      entryCommanderMap.set(e.id, e.commander_id);
    }
    
    entryOffset += PAGE_SIZE;
    if (entries.length < PAGE_SIZE) break;
  }
  
  logger.log(`Loaded ${entryCommanderMap.size} entries`);
  
  // Process game players
  logger.log('Processing game players...');
  
  const statsMap = new Map<string, {
    commander_id: number;
    seat_position: number;
    week_start: string;
    games: number;
    wins: number;
  }>();
  
  let gpOffset = 0;
  let totalProcessed = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('game_players')
      .select('game_id, player_id, entry_id, seat_position')
      .order('id', { ascending: true })
      .range(gpOffset, gpOffset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    interface GamePlayerData {
      game_id: number;
      player_id: number;
      entry_id: number | null;
      seat_position: number;
    }
    
    const gamePlayers = data as GamePlayerData[] | null;
    if (!gamePlayers || gamePlayers.length === 0) break;
    
    for (const gp of gamePlayers) {
      const game = gameMap.get(gp.game_id);
      if (!game) continue;
      
      if (!gp.entry_id) continue;
      
      const commanderId = entryCommanderMap.get(gp.entry_id);
      if (!commanderId) continue;
      
      const tournament = tournamentMap.get(game.tournament_id);
      if (!tournament) continue;
      
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
      }
      
      statsMap.set(key, existing);
    }
    
    totalProcessed += gamePlayers.length;
    gpOffset += PAGE_SIZE;
    if (gamePlayers.length < PAGE_SIZE) break;
  }
  
  logger.log(`Processed ${totalProcessed} game players`);
  
  // Insert aggregated stats
  const statsArray = Array.from(statsMap.values());
  
  if (statsArray.length > 0) {
    for (let i = 0; i < statsArray.length; i += 1000) {
      const batch = statsArray.slice(i, i + 1000);
      const { error: insertError } = await supabase
        .from('seat_position_weekly_stats')
        .insert(batch);
      
      if (insertError) throw insertError;
    }
  }
  
  logger.log(`Created ${statsArray.length} seat position weekly stat records`);
  return statsArray.length;
}

// ============================================
// Main Aggregation Function
// ============================================

export interface AggregateOptions {
  /** Custom progress logger */
  logger?: ProgressLogger;
}

/**
 * Aggregate all statistics tables.
 * Always performs a full rebuild for data consistency.
 */
export async function aggregateStats(
  supabase: SupabaseAdmin,
  options: AggregateOptions = {}
): Promise<AggregationStats> {
  const { logger = createProgressLogger() } = options;
  
  logger.log('Starting stats aggregation...');
  logger.log(`Minimum date for stats: ${MIN_STATS_DATE}`);
  
  const commanderWeeklyStats = await aggregateCommanderWeeklyStats(supabase, logger);
  const cardCommanderWeeklyStats = await aggregateCardCommanderWeeklyStats(supabase, logger);
  const seatPositionWeeklyStats = await aggregateSeatPositionWeeklyStats(supabase, logger);
  
  return {
    commanderWeeklyStats,
    cardCommanderWeeklyStats,
    seatPositionWeeklyStats,
  };
}

