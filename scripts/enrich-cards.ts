#!/usr/bin/env npx tsx
/**
 * Data Enrichment Script
 * 
 * Enriches seeded data with additional metadata and validation.
 * Run with: npx tsx scripts/enrich-cards.ts
 * 
 * Pipeline: seed -> enrich (this) -> aggregate
 * 
 * Options:
 * --full : Clear all enrichment data and re-enrich from scratch
 * --skip-validation : Skip decklist validation (faster)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import {
  createSupabaseAdmin,
  createProgressLogger,
  type EnrichmentStats,
} from '../lib/jobs';
import { enrichData, enrichDataFull } from '../lib/jobs/enrich';

// ============================================
// Main Function
// ============================================

async function main(): Promise<void> {
  console.log('═'.repeat(60));
  console.log('cedhtools - Data Enrichment');
  console.log('═'.repeat(60));
  console.log('Pipeline: seed -> enrich -> aggregate\n');

  // Parse CLI args
  const args = process.argv.slice(2);
  const fullMode = args.includes('--full');
  const skipValidation = args.includes('--skip-validation');

  if (fullMode) {
    console.log('🔄 Running in FULL mode (clearing existing data)');
  } else {
    console.log('📊 Running in INCREMENTAL mode (only enriching new data)');
  }

  if (skipValidation) {
    console.log('⏭️  Skipping decklist validation');
  }

  const supabase = createSupabaseAdmin();
  const logger = createProgressLogger();

  try {
    let stats: EnrichmentStats;

    if (fullMode) {
      stats = await enrichDataFull(supabase, logger);
    } else {
      stats = await enrichData(supabase, {
        incremental: true,
        skipValidation,
        logger,
      });
    }

    console.log('\n' + '═'.repeat(60));
    console.log('Enrichment Complete!');
    console.log('═'.repeat(60));
    console.log(`Cards enriched:        ${stats.cardsEnriched}`);
    console.log(`Cards not found:       ${stats.cardsNotFound}`);
    console.log(`Commanders enriched:   ${stats.commandersEnriched}`);
    console.log(`Tournaments enriched:  ${stats.tournamentsEnriched}`);
    console.log(`Decklists validated:   ${stats.decklistsValidated}`);
    console.log(`  - Valid:             ${stats.decklistsValid}`);
    console.log(`  - Invalid:           ${stats.decklistsInvalid}`);
    console.log(`  - Skipped:           ${stats.decklistsSkipped}`);
    console.log('');
    console.log('Next step: Run aggregate-stats.ts to build statistics tables');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
