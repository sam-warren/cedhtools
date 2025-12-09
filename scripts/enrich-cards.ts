#!/usr/bin/env npx tsx
/**
 * Data Enrichment Script
 * 
 * Enriches seeded data with additional metadata and validation.
 * Run with: npx tsx scripts/enrich-cards.ts
 * 
 * This script:
 * 1. Downloads Scryfall oracle_cards bulk data
 * 2. Updates cards table with type_line, mana_cost, cmc, scryfall_data
 * 3. Updates commanders table with color_id
 * 4. Updates tournaments table with bracket_url
 * 5. Validates decklists via Scrollrack API
 * 
 * Pipeline: seed -> enrich (this) -> aggregate
 * 
 * Options:
 * --full : Clear all enrichment data and re-enrich from scratch
 * --skip-validation : Skip decklist validation (faster)
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import {
  createSupabaseAdmin,
  type EnrichmentStats,
} from '../lib/jobs';
import { enrichData, enrichDataFull } from '../lib/jobs/enrich';

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
      // Show progress
      if (totalItems > 0) {
        const pct = ((processedItems / totalItems) * 100).toFixed(1);
        process.stdout.write(`\r  📊 [${pct}%] ${processedItems}/${totalItems}    `);
      }
    },

    increment(count: number = 1): void {
      processedItems += count;
    },

    endPhase(): void {
      const elapsed = formatDuration(Date.now() - phaseStartTime);
      console.log(`\n  ✅ ${phaseName} complete in ${elapsed}`);
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

async function main(): Promise<void> {
  console.log('═'.repeat(60));
  console.log('cedhtools - Data Enrichment');
  console.log('═'.repeat(60));
  console.log('Pipeline: seed -> enrich -> aggregate');
  console.log('');

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
  const logger = createCliLogger();

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

    logger.summary();

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

// ============================================
// Entry Point
// ============================================

main();
