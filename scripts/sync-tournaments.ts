#!/usr/bin/env npx tsx
/**
 * Tournament Sync Script
 * 
 * Fetches tournament data from TopDeck.gg and syncs to Supabase.
 * Run with: npx tsx scripts/sync-tournaments.ts
 * 
 * Pipeline: seed (this) -> enrich -> aggregate
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import {
  createSupabaseAdmin,
  createProgressLogger,
} from '../lib/jobs';
import { syncTournamentsFromDate } from '../lib/jobs/sync';

// ============================================
// Configuration
// ============================================

const START_DATE = new Date('2025-05-19T00:00:00Z');

// ============================================
// Main Function
// ============================================

async function main() {
  console.log('═'.repeat(60));
  console.log('cedhtools - Tournament Sync');
  console.log('═'.repeat(60));
  console.log(`📅 Processing tournaments from ${START_DATE.toISOString()} to now\n`);

  const supabase = createSupabaseAdmin();
  const logger = createProgressLogger();

  try {
    const stats = await syncTournamentsFromDate(supabase, START_DATE, logger);

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
