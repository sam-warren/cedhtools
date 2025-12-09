#!/usr/bin/env npx tsx
/**
 * Stats Aggregation Script
 * 
 * Aggregates tournament data into weekly statistics tables.
 * Run with: npx tsx scripts/aggregate-stats.ts
 * 
 * Pipeline: seed -> enrich -> aggregate (this)
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import {
  createSupabaseAdmin,
  type AggregationStats,
} from '../lib/jobs';
import { aggregateStats } from '../lib/jobs/aggregate';

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

async function main(): Promise<void> {
  console.log('═'.repeat(60));
  console.log('cedhtools - Stats Aggregation');
  console.log('═'.repeat(60));
  console.log('Pipeline: seed -> enrich -> aggregate');
  console.log('');

  const supabase = createSupabaseAdmin();
  const logger = createCliLogger();

  try {
    const stats = await aggregateStats(supabase, { logger });

    logger.summary();

    console.log('\n' + '═'.repeat(60));
    console.log('Aggregation Complete!');
    console.log('═'.repeat(60));
    console.log(`Commander weekly stats:      ${stats.commanderWeeklyStats}`);
    console.log(`Card-commander weekly stats: ${stats.cardCommanderWeeklyStats}`);
    console.log(`Seat position weekly stats:  ${stats.seatPositionWeeklyStats}`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// ============================================
// Entry Point
// ============================================

main();
