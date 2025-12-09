#!/usr/bin/env npx tsx
/**
 * Stats Aggregation Script
 * 
 * Aggregates tournament data into weekly statistics tables.
 * Run with: npx tsx scripts/aggregate-stats.ts
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/db/types';

// ============================================
// Configuration
// ============================================

const PAGE_SIZE = 1000;

// Minimum date for temporal stats - data before this date is excluded
// This helps avoid showing incomplete/sparse early data
const MIN_STATS_DATE = '2024-06-01';

// ============================================
// Telemetry / Progress Tracking
// ============================================

class ProgressTracker {
  private startTime: number;
  private phaseStartTime: number;
  private phaseName: string;

  constructor() {
    this.startTime = Date.now();
    this.phaseStartTime = Date.now();
    this.phaseName = '';
  }

  startPhase(name: string): void {
    this.phaseName = name;
    this.phaseStartTime = Date.now();
    console.log(`\n⏱️  Starting: ${name}`);
  }

  getElapsed(): string {
    const elapsed = Date.now() - this.startTime;
    return this.formatDuration(elapsed);
  }

  getPhaseElapsed(): string {
    const elapsed = Date.now() - this.phaseStartTime;
    return this.formatDuration(elapsed);
  }

  endPhase(): void {
    const elapsed = this.getPhaseElapsed();
    console.log(`  ✅ ${this.phaseName} complete in ${elapsed}`);
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
// Helper Functions
// ============================================

/**
 * Get the Monday of the week for a given date (UTC-based).
 * 
 * This is used to bucket tournament data into weekly aggregates for efficient querying.
 * Using Monday as the week start aligns with ISO 8601 week numbering standard.
 * 
 * The logic works as follows:
 * - getUTCDay() returns 0 (Sunday) through 6 (Saturday)
 * - For Monday (1) through Saturday (6): subtract (day - 1) to get to Monday
 * - For Sunday (0): subtract 6 to get to the previous Monday
 * - The formula `day === 0 ? -6 : 1` handles this by adjusting the offset
 * 
 * UTC methods are used to ensure consistent week boundaries regardless of
 * server timezone, preventing the same tournament from being bucketed into
 * different weeks depending on when/where the aggregation runs.
 */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d.toISOString().split('T')[0];
}

// ============================================
// Stats Aggregation
// ============================================
async function aggregateCommanderWeeklyStats(
  supabase: ReturnType<typeof createSupabaseAdmin>
): Promise<number> {
  console.log('📊 Aggregating commander weekly stats...');
  
  // Clear existing stats
  await supabase.from('commander_weekly_stats').delete().neq('id', 0);
  
  // First, load all tournaments into a map (avoid nested query issues)
  // Only include tournaments on or after MIN_STATS_DATE
  console.log(`  📥 Loading tournament data (from ${MIN_STATS_DATE})...`);
  const tournamentMap = new Map<number, { tournament_date: string; top_cut: number; size: number }>();
  
  // Pagination offset for fetching tournaments in batches of PAGE_SIZE.
  // Supabase has a default limit of 1000 rows per query, so we paginate
  // to ensure we fetch all tournaments regardless of total count.
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
  
  console.log(`  ✅ Loaded ${tournamentMap.size} tournaments (from ${MIN_STATS_DATE})`);
  
  // Group by commander and week
  const statsMap = new Map<string, {
    commander_id: number;
    week_start: string;
    entries: number;
    entries_with_decklists: number;
    top_cuts: number;
    expected_top_cuts: number; // Sum of (topCut/tournamentSize) for conversion score
    wins: number;
    draws: number;
    losses: number;
  }>();
  
  // Paginate through all entries
  console.log('  📥 Loading entries...');
  let offset = 0;
  let totalProcessed = 0;
  let totalSkipped = 0;
  
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
      if (!tournament) {
        totalSkipped++;
        continue;
      }
      
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
      
      // Track if this entry has a decklist
      if (entry.decklist_items && entry.decklist_items.length > 0) {
        existing.entries_with_decklists += 1;
      }
      
      existing.wins += entry.wins_swiss + entry.wins_bracket;
      existing.draws += entry.draws;
      existing.losses += entry.losses_swiss + entry.losses_bracket;
      
      // Calculate expected top cuts (probability of making top cut in this tournament)
      // This is used for conversion score: (actual top cuts / expected top cuts) * 100
      // A score > 100 means the commander performs better than expected given tournament sizes
      if (tournament.size > 0) {
        existing.expected_top_cuts += tournament.top_cut / tournament.size;
      }
      
      // Check if made top cut.
      // tournament.top_cut is an integer from the tournaments table, populated by sync-tournaments.ts
      // from the TopDeck.gg API's topCut field (e.g., 4, 8, 16). A value of 0 means no top cut.
      // standing is the player's final position (1 = winner, 2 = second place, etc.)
      if (entry.standing && entry.standing <= tournament.top_cut) {
        existing.top_cuts += 1;
      }
      
      statsMap.set(key, existing);
    }
    
    totalProcessed += entries.length;
    console.log(`  📦 Processed ${totalProcessed} entries...`);
    
    offset += PAGE_SIZE;
    if (entries.length < PAGE_SIZE) break;
  }
  
  if (totalSkipped > 0) {
    console.log(`  ⚠️ Skipped ${totalSkipped} entries with missing tournaments`);
  }
  
  // Insert aggregated stats
  const statsArray = Array.from(statsMap.values());
  
  if (statsArray.length > 0) {
    // Insert in batches of 1000
    for (let i = 0; i < statsArray.length; i += 1000) {
      const batch = statsArray.slice(i, i + 1000);
      const { error: insertError } = await supabase
        .from('commander_weekly_stats')
        .insert(batch);
      
      if (insertError) throw insertError;
    }
  }
  
  console.log(`  ✅ Created ${statsArray.length} commander weekly stat records from ${totalProcessed} entries`);
  return statsArray.length;
}

/**
 * Aggregates card statistics per commander per week.
 * 
 * Statistical Significance Consideration:
 * A p-value for card win rate differences could help identify statistically significant
 * over/under performers. However, implementing this efficiently is challenging:
 * 
 * 1. Sample sizes vary greatly per card (Sol Ring vs niche cards)
 * 2. Would need to store additional data (variance, sample count) for incremental updates
 * 3. Chi-squared or Fisher's exact test would require commander baseline stats
 * 4. Computation would need to happen at query time or as a separate post-processing step
 * 
 * Current approach: Let the frontend/consumer calculate significance if needed,
 * using the entries count as the sample size and win_rate for comparison against
 * commander baseline. Cards with low entries should be flagged as low-confidence.
 */
async function aggregateCardCommanderWeeklyStats(
  supabase: ReturnType<typeof createSupabaseAdmin>
): Promise<number> {
  console.log('📊 Aggregating card-commander weekly stats...');
  
  // Clear existing stats
  await supabase.from('card_commander_weekly_stats').delete().neq('id', 0);
  
  // First, load all tournaments into a map
  // Only include tournaments on or after MIN_STATS_DATE
  console.log(`  📥 Loading tournament data (from ${MIN_STATS_DATE})...`);
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
  
  console.log(`  ✅ Loaded ${tournamentMap.size} tournaments (from ${MIN_STATS_DATE})`);
  
  // Now load all entries with commanders AND valid decklists only
  // This ensures card stats only reflect legal commander decklists
  console.log('  📥 Loading entry data (valid decklists only)...');
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
      // Only include validated decklists to ensure card stats reflect legal commander decks.
      // Note: If decklist_valid is not being set correctly in sync-tournaments.ts,
      // this filter may exclude valid decklists. Check the Scrollrack validation
      // integration in sync-tournaments.ts if card stats seem incomplete.
      .eq('decklist_valid', true)
      // IMPORTANT: Consistent ordering by 'id' is required for pagination to work correctly.
      // Without deterministic ordering, the same row could appear in multiple pages or be
      // skipped entirely if the underlying data order changes between queries.
      // This pattern must be used everywhere pagination is implemented.
      .order('id', { ascending: true })
      .range(entryOffset, entryOffset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    // Interface defined inline near its usage for co-location with the query.
    // This pattern keeps the type close to where Supabase data is cast,
    // making it easier to update if the query's select clause changes.
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
    
    let skippedInPage = 0;
    const missingTournamentIds = new Set<number>();
    
    for (const entry of entries) {
      const tournament = tournamentMap.get(entry.tournament_id);
      if (!tournament) {
        skippedInPage++;
        missingTournamentIds.add(entry.tournament_id);
        continue; // Skip if tournament not found
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
    
    if (skippedInPage > 0) {
      console.log(`  📦 Page ${Math.floor(entryOffset / PAGE_SIZE) + 1}: got ${entries.length} entries, added ${entries.length - skippedInPage}, skipped ${skippedInPage} (missing tournament_ids: ${[...missingTournamentIds].slice(0, 5).join(', ')}...)`);
    } else {
      console.log(`  📦 Page ${Math.floor(entryOffset / PAGE_SIZE) + 1}: got ${entries.length} entries, map now has ${entryMap.size}`);
    }
    entryOffset += PAGE_SIZE;
    if (entries.length < PAGE_SIZE) {
      console.log(`  ⏹️ Breaking: got ${entries.length} entries (less than PAGE_SIZE ${PAGE_SIZE})`);
      break;
    }
  }
  
  console.log(`  ✅ Loaded ${entryMap.size} entries with valid decklists`);
  
  // Now paginate through decklist_items directly (no nested query limits!)
  console.log('  📥 Processing decklist items...');
  
  const statsMap = new Map<string, {
    card_id: number;
    commander_id: number;
    week_start: string;
    entries: number;
    top_cuts: number;
    expected_top_cuts: number; // Sum of (topCut/tournamentSize) for conversion score
    wins: number;
    draws: number;
    losses: number;
  }>();
  
  let itemOffset = 0;
  let totalItems = 0;
  let skippedItems = 0;
  
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
      // Ensure entry_id is a number (Map keys are type-sensitive)
      const entryId = typeof item.entry_id === 'string' ? parseInt(item.entry_id, 10) : item.entry_id;
      const entry = entryMap.get(entryId);
      if (!entry) {
        skippedItems++;
        // Debug: Log first few skipped items to understand why
        if (skippedItems <= 5) {
          console.log(`    ⚠️ Skipped item: entry_id=${item.entry_id} (type: ${typeof item.entry_id}), entryMap has ${entryMap.size} entries`);
          console.log(`    First 5 map keys: ${[...entryMap.keys()].slice(0, 5).join(', ')}`);
        }
        continue; // Entry might not have commander or tournament
      }
      
      const weekStart = getWeekStart(new Date(entry.tournament_date));
      // entry.top_cut is an integer from the tournaments table (e.g., 4, 8, 16).
      // A value of 0 means the tournament had no top cut (Swiss-only).
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
      
      // Calculate expected top cuts (probability of making top cut in this tournament)
      // This is used for conversion score: (actual top cuts / expected top cuts) * 100
      if (entry.tournament_size > 0) {
        existing.expected_top_cuts += entry.top_cut / entry.tournament_size;
      }
      
      if (isTopCut) {
        existing.top_cuts += 1;
      }
      
      statsMap.set(key, existing);
    }
    
    totalItems += items.length;
    if (totalItems % 10000 === 0) {
      console.log(`  📦 Processed ${totalItems} decklist items...`);
    }
    
    itemOffset += PAGE_SIZE;
    if (items.length < PAGE_SIZE) break;
  }
  
  console.log(`  ✅ Processed ${totalItems} total decklist items (${skippedItems} skipped - no matching entry)`);
  
  // Insert aggregated stats
  const statsArray = Array.from(statsMap.values());
  
  if (statsArray.length > 0) {
    // Insert in batches of 1000
    for (let i = 0; i < statsArray.length; i += 1000) {
      const batch = statsArray.slice(i, i + 1000);
      const { error: insertError } = await supabase
        .from('card_commander_weekly_stats')
        .insert(batch);
      
      if (insertError) throw insertError;
      
      console.log(`  📦 Inserted batch ${Math.floor(i / 1000) + 1}/${Math.ceil(statsArray.length / 1000)}`);
    }
  }
  
  console.log(`  ✅ Created ${statsArray.length} card-commander weekly stat records from ${totalItems} decklist items`);
  return statsArray.length;
}

/**
 * Aggregates seat position win rates per commander per week.
 * 
 * This enables temporal filtering for the "Win Rate by Seat" chart.
 * Data is aggregated from game_players + games + entries tables.
 */
async function aggregateSeatPositionWeeklyStats(
  supabase: ReturnType<typeof createSupabaseAdmin>
): Promise<number> {
  console.log('📊 Aggregating seat position weekly stats...');
  
  // Clear existing stats
  await supabase.from('seat_position_weekly_stats').delete().neq('id', 0);
  
  // Load tournaments into a map for date lookup
  console.log(`  📥 Loading tournament data (from ${MIN_STATS_DATE})...`);
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
  
  console.log(`  ✅ Loaded ${tournamentMap.size} tournaments`);
  
  // Load games into a map for winner lookup
  console.log('  📥 Loading games...');
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
      // Only include games from tournaments in our date range
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
  
  console.log(`  ✅ Loaded ${gameMap.size} games`);
  
  // Load entries to get commander_id for each entry
  console.log('  📥 Loading entries for commander lookup...');
  const entryCommanderMap = new Map<number, number>(); // entry_id -> commander_id
  
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
  
  console.log(`  ✅ Loaded ${entryCommanderMap.size} entries`);
  
  // Now process game_players to aggregate stats
  console.log('  📥 Processing game players...');
  
  const statsMap = new Map<string, {
    commander_id: number;
    seat_position: number;
    week_start: string;
    games: number;
    wins: number;
  }>();
  
  let gpOffset = 0;
  let totalProcessed = 0;
  let skippedNoGame = 0;
  let skippedNoEntry = 0;
  let skippedNoCommander = 0;
  
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
      // Get game info
      const game = gameMap.get(gp.game_id);
      if (!game) {
        skippedNoGame++;
        continue;
      }
      
      // Get commander from entry
      if (!gp.entry_id) {
        skippedNoEntry++;
        continue;
      }
      
      const commanderId = entryCommanderMap.get(gp.entry_id);
      if (!commanderId) {
        skippedNoCommander++;
        continue;
      }
      
      // Get tournament date for week bucketing
      const tournament = tournamentMap.get(game.tournament_id);
      if (!tournament) continue; // Should not happen since we filtered games
      
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
      
      // Count win if this player won (not a draw and player_id matches winner)
      if (!game.is_draw && game.winner_player_id === gp.player_id) {
        existing.wins += 1;
      }
      
      statsMap.set(key, existing);
    }
    
    totalProcessed += gamePlayers.length;
    if (totalProcessed % 10000 === 0) {
      console.log(`  📦 Processed ${totalProcessed} game players...`);
    }
    
    gpOffset += PAGE_SIZE;
    if (gamePlayers.length < PAGE_SIZE) break;
  }
  
  console.log(`  ✅ Processed ${totalProcessed} game players`);
  if (skippedNoGame > 0) console.log(`  ⚠️ Skipped ${skippedNoGame} (game not in date range)`);
  if (skippedNoEntry > 0) console.log(`  ⚠️ Skipped ${skippedNoEntry} (no entry_id)`);
  if (skippedNoCommander > 0) console.log(`  ⚠️ Skipped ${skippedNoCommander} (no commander for entry)`);
  
  // Insert aggregated stats
  const statsArray = Array.from(statsMap.values());
  
  if (statsArray.length > 0) {
    // Insert in batches of 1000
    for (let i = 0; i < statsArray.length; i += 1000) {
      const batch = statsArray.slice(i, i + 1000);
      const { error: insertError } = await supabase
        .from('seat_position_weekly_stats')
        .insert(batch);
      
      if (insertError) throw insertError;
    }
  }
  
  console.log(`  ✅ Created ${statsArray.length} seat position weekly stat records`);
  return statsArray.length;
}

// ============================================
// Main Function
// ============================================

async function aggregateStats(): Promise<void> {
  const supabase = createSupabaseAdmin();
  
  console.log('═'.repeat(60));
  console.log('cEDH Tools - Stats Aggregation');
  console.log('═'.repeat(60));
  console.log(`Minimum date for stats: ${MIN_STATS_DATE}`);
  console.log('');
  
  progress.startPhase('Aggregating commander weekly stats');
  const commanderStats = await aggregateCommanderWeeklyStats(supabase);
  progress.endPhase();
  
  progress.startPhase('Aggregating card-commander weekly stats');
  const cardCommanderStats = await aggregateCardCommanderWeeklyStats(supabase);
  progress.endPhase();
  
  progress.startPhase('Aggregating seat position weekly stats');
  const seatStats = await aggregateSeatPositionWeeklyStats(supabase);
  progress.endPhase();
  
  console.log('\n' + '═'.repeat(60));
  console.log('Aggregation Complete!');
  console.log('═'.repeat(60));
  progress.summary();
  console.log('');
  console.log(`Commander weekly stats:      ${commanderStats}`);
  console.log(`Card-commander weekly stats: ${cardCommanderStats}`);
  console.log(`Seat position weekly stats:  ${seatStats}`);
}

// ============================================
// Entry Point
// ============================================

async function main() {
  try {
    await aggregateStats();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
