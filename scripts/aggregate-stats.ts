#!/usr/bin/env npx tsx
/**
 * Stats Aggregation Script
 * 
 * Aggregates tournament data into weekly statistics tables.
 * Run with: npx tsx scripts/aggregate-stats.ts
 * 
 * Pipeline: seed -> enrich -> aggregate (this)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import {
  createSupabaseAdmin,
  createProgressLogger,
} from '../lib/jobs';
import { aggregateStats } from '../lib/jobs/aggregate';

// ============================================
// Main Function
// ============================================

async function main(): Promise<void> {
  console.log('═'.repeat(60));
  console.log('cedhtools - Stats Aggregation');
  console.log('═'.repeat(60));
  console.log('Pipeline: seed -> enrich -> aggregate\n');

  const supabase = createSupabaseAdmin();
  const logger = createProgressLogger();

  try {
    const stats = await aggregateStats(supabase, { logger });

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

main();
