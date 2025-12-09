#!/usr/bin/env npx tsx
/**
 * Tournament Sync Script
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
 * Environment variables required:
 * - TOPDECK_API_KEY: TopDeck.gg API key
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import {
  createSupabaseAdmin,
  createProgressLogger,
  type SyncStats,
} from '../lib/jobs';
import { syncTournamentsFromDate } from '../lib/jobs/sync';

// ============================================
// Configuration
// ============================================

// Start date for initial seed - change this for different time ranges
const START_DATE = new Date('2025-05-19T00:00:00Z');

// ============================================
// CLI Progress Logger
// ============================================

function createCliLogger() {
  const startTime = Date.now();
  let phaseStartTime = Date.now();
  let totalItems = 0;
  let processedItems = 0;
  let phaseName = '';

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return {
    log: (message: string) => console.log(`  ${message}`),

    startPhase(name: string, total?: number): void {
      phaseName = name;
      totalItems = total ?? 0;
      processedItems = 0;
      phaseStartTime = Date.now();
      console.log(`\n⏱️  Starting: ${name}${total ? ` (${total} items)` : ''}`);
    },

    update(processed: number): void {
      processedItems = processed;
    },

    increment(count: number = 1): void {
      processedItems += count;
    },

    endPhase(): void {
      const elapsed = formatDuration(Date.now() - phaseStartTime);
      console.log(`  ✅ ${phaseName} complete in ${elapsed}`);
    },

    getStats(): { elapsed: number; processed: number; total: number } {
      return {
        elapsed: Date.now() - startTime,
        processed: processedItems,
        total: totalItems,
      };
    },

    summary(): void {
      console.log(`\n⏱️  Total execution time: ${formatDuration(Date.now() - startTime)}`);
    },
  };
}

// ============================================
// Main Function
// ============================================

async function main() {
  console.log('═'.repeat(60));
  console.log('cedhtools - Tournament Sync');
  console.log('═'.repeat(60));
  console.log(`📅 Processing tournaments from ${START_DATE.toISOString()} to now`);
  console.log('');

  const supabase = createSupabaseAdmin();
  const logger = createCliLogger();

  try {
    const stats = await syncTournamentsFromDate(supabase, START_DATE, logger);

    logger.summary();

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
