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
 * Get the Monday of the week for a given date
 */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

// ============================================
// Stats Aggregation
// ============================================

interface EntryWithTournament {
  id: number;
  commander_id: number | null;
  standing: number | null;
  wins_swiss: number;
  wins_bracket: number;
  losses_swiss: number;
  losses_bracket: number;
  draws: number;
  tournament: {
    id: number;
    tournament_date: string;
    top_cut: number;
  } | null;
}

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
  
  // Group by commander and week
  const statsMap = new Map<string, {
    commander_id: number;
    week_start: string;
    entries: number;
    top_cuts: number;
    wins: number;
    draws: number;
    losses: number;
  }>();
  
  // Paginate through all entries
  let offset = 0;
  let totalProcessed = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('entries')
      .select(`
        id,
        commander_id,
        standing,
        wins_swiss,
        wins_bracket,
        losses_swiss,
        losses_bracket,
        draws,
        tournament:tournaments!inner (
          id,
          tournament_date,
          top_cut
        )
      `)
      .not('commander_id', 'is', null)
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    const entries = data as EntryWithTournament[] | null;
    if (!entries || entries.length === 0) break;
    
    for (const entry of entries) {
      if (!entry.commander_id || !entry.tournament) continue;
      
      const tournament = entry.tournament;
      const weekStart = getWeekStart(new Date(tournament.tournament_date));
      const key = `${entry.commander_id}-${weekStart}`;
      
      const existing = statsMap.get(key) || {
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
      
      // Check if made top cut
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
  
  // Insert aggregated stats
  const statsArray = Array.from(statsMap.values());
  
  if (statsArray.length > 0) {
    // Insert in batches of 1000
    for (let i = 0; i < statsArray.length; i += 1000) {
      const batch = statsArray.slice(i, i + 1000);
      const { error: insertError } = await supabase
        .from('commander_weekly_stats')
        .insert(batch as never[]);
      
      if (insertError) throw insertError;
    }
  }
  
  console.log(`  ✅ Created ${statsArray.length} commander weekly stat records from ${totalProcessed} entries`);
  return statsArray.length;
}

async function aggregateCardCommanderWeeklyStats(
  supabase: ReturnType<typeof createSupabaseAdmin>
): Promise<number> {
  console.log('📊 Aggregating card-commander weekly stats...');
  
  // Clear existing stats
  await supabase.from('card_commander_weekly_stats').delete().neq('id', 0);
  
  // Group by card, commander, and week
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
  
  // Paginate through all entries
  let offset = 0;
  let totalProcessed = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('entries')
      .select(`
        id,
        commander_id,
        standing,
        wins_swiss,
        wins_bracket,
        losses_swiss,
        losses_bracket,
        draws,
        tournament:tournaments!inner (
          id,
          tournament_date,
          top_cut
        ),
        decklist_items (
          card_id,
          quantity
        )
      `)
      .not('commander_id', 'is', null)
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    const entries = data as EntryWithDecklistItems[] | null;
    if (!entries || entries.length === 0) break;
    
    for (const entry of entries) {
      if (!entry.commander_id || !entry.tournament || !entry.decklist_items) continue;
      
      const tournament = entry.tournament;
      const weekStart = getWeekStart(new Date(tournament.tournament_date));
      const isTopCut = entry.standing && entry.standing <= tournament.top_cut;
      
      for (const item of entry.decklist_items) {
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
    }
    
    totalProcessed += entries.length;
    console.log(`  📦 Processed ${totalProcessed} entries...`);
    
    offset += PAGE_SIZE;
    if (entries.length < PAGE_SIZE) break;
  }
  
  // Insert aggregated stats
  const statsArray = Array.from(statsMap.values());
  
  if (statsArray.length > 0) {
    // Insert in batches of 1000
    for (let i = 0; i < statsArray.length; i += 1000) {
      const batch = statsArray.slice(i, i + 1000);
      const { error: insertError } = await supabase
        .from('card_commander_weekly_stats')
        .insert(batch as never[]);
      
      if (insertError) throw insertError;
      
      console.log(`  📦 Inserted batch ${Math.floor(i / 1000) + 1}/${Math.ceil(statsArray.length / 1000)}`);
    }
  }
  
  console.log(`  ✅ Created ${statsArray.length} card-commander weekly stat records from ${totalProcessed} entries`);
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
