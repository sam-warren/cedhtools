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
 * 
 * Note: Seat position stats are NOT aggregated here - they are queried
 * directly from game_players table in the API for simplicity.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/db/types';

// ============================================
// Configuration
// ============================================

const PAGE_SIZE = 1000;

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
 * Get the Monday of the week for a given date (UTC-based)
 * TODO: Verify this logic is correct and necessary. Is this the correct way to get the week start date?
 */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  // Use UTC methods to avoid timezone issues
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  // Return as YYYY-MM-DD
  return d.toISOString().split('T')[0];
}

// ============================================
// Stats Aggregation
// ============================================

interface TournamentData {
  id: number;
  tournament_date: string;
  top_cut: number;
}

// TODO: This is currently only referenced by unused interface EntryWithDecklistItems. Should we remove it? Or use it?
interface EntryWithTournament {
  id: number;
  commander_id: number | null;
  standing: number | null;
  wins_swiss: number;
  wins_bracket: number;
  losses_swiss: number;
  losses_bracket: number;
  draws: number;
  tournament: TournamentData | TournamentData[] | null;
}

// TODO: This is currently unused. Should we remove it? Or use it?
interface EntryWithDecklistItems extends EntryWithTournament {
  decklist_items: Array<{
    card_id: number;
    quantity: number;
  }> | null;
}

async function aggregateCommanderWeeklyStats(
  supabase: ReturnType<typeof createSupabaseAdmin>
): Promise<number> {
  console.log('📊 Aggregating commander weekly stats...');
  
  // Clear existing stats
  await supabase.from('commander_weekly_stats').delete().neq('id', 0);
  
  // First, load all tournaments into a map (avoid nested query issues)
  console.log('  📥 Loading tournament data...');
  const tournamentMap = new Map<number, { tournament_date: string; top_cut: number }>();
  
  // TODO: What is tournamentOffset? What does it represent?
  let tournamentOffset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, tournament_date, top_cut')
      .order('id', { ascending: true })
      .range(tournamentOffset, tournamentOffset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    const tournaments = data as { id: number; tournament_date: string; top_cut: number }[] | null;
    if (!tournaments || tournaments.length === 0) break;
    
    for (const t of tournaments) {
      tournamentMap.set(t.id, { tournament_date: t.tournament_date, top_cut: t.top_cut });
    }
    
    tournamentOffset += PAGE_SIZE;
    if (tournaments.length < PAGE_SIZE) break;
  }
  
  console.log(`  ✅ Loaded ${tournamentMap.size} tournaments`);
  
  // Group by commander and week
  const statsMap = new Map<string, {
    commander_id: number;
    week_start: string;
    entries: number;
    entries_with_decklists: number;
    top_cuts: number;
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
      
      // Check if made top cut
      // TODO: Verify that tournament.top_cut is correctly set, i.e. it is an integer we can compare to and not a string like "Top 4" or "Top 16"
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

// TODO: Should we include a p value here for statistical significance? How would we go about doing this in an efficient manner?
async function aggregateCardCommanderWeeklyStats(
  supabase: ReturnType<typeof createSupabaseAdmin>
): Promise<number> {
  console.log('📊 Aggregating card-commander weekly stats...');
  
  // Clear existing stats
  await supabase.from('card_commander_weekly_stats').delete().neq('id', 0);
  
  // First, load all tournaments into a map
  console.log('  📥 Loading tournament data...');
  const tournamentMap = new Map<number, { tournament_date: string; top_cut: number }>();
  
  let tournamentOffset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, tournament_date, top_cut')
      .order('id', { ascending: true })
      .range(tournamentOffset, tournamentOffset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    const tournaments = data as { id: number; tournament_date: string; top_cut: number }[] | null;
    if (!tournaments || tournaments.length === 0) break;
    
    for (const t of tournaments) {
      tournamentMap.set(t.id, { tournament_date: t.tournament_date, top_cut: t.top_cut });
    }
    
    tournamentOffset += PAGE_SIZE;
    if (tournaments.length < PAGE_SIZE) break;
  }
  
  console.log(`  ✅ Loaded ${tournamentMap.size} tournaments`);
  
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
      .eq('decklist_valid', true)  // Only include validated decklists - TODO: This is currently causing issues as decklists are not being correctly validated in the db seed script.
      .order('id', { ascending: true }) // TODO: When using pagination, we need to ensure we maintain order by id to avoid duplicate entries. This needs to be true EVERYWHERE we use pagination.
      .range(entryOffset, entryOffset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    // TODO: Is there a better place to put this interface?
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
      const isTopCut = entry.standing !== null && entry.standing <= entry.top_cut; // TODO: Verify that entry.top_cut is correctly set, i.e. it is an integer we can compare to and not a string like "Top 4" or "Top 16"
      
      const key = `${item.card_id}-${entry.commander_id}-${weekStart}`;
      
      const existing = statsMap.get(key) || {
        card_id: item.card_id,
        commander_id: entry.commander_id,
        week_start: weekStart,
        entries: 0,
        top_cuts: 0,
        wins: 0,
        draws: 0,
        losses: 0,
      };
      
      existing.entries += 1;
      existing.wins += entry.wins_swiss + entry.wins_bracket;
      existing.draws += entry.draws;
      existing.losses += entry.losses_swiss + entry.losses_bracket;
      
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

// ============================================
// Main Function
// ============================================

async function aggregateStats(): Promise<void> {
  const supabase = createSupabaseAdmin();
  
  console.log('═'.repeat(60));
  console.log('cEDH Tools - Stats Aggregation');
  console.log('═'.repeat(60));
  console.log('Note: Seat position stats are queried directly from game_players');
  console.log('');
  
  const commanderStats = await aggregateCommanderWeeklyStats(supabase);
  const cardCommanderStats = await aggregateCardCommanderWeeklyStats(supabase);
  
  console.log('\n' + '═'.repeat(60));
  console.log('Aggregation Complete!');
  console.log('═'.repeat(60));
  console.log(`Commander weekly stats:      ${commanderStats}`);
  console.log(`Card-commander weekly stats: ${cardCommanderStats}`);
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
