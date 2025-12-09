#!/usr/bin/env npx tsx
/**
 * Data Enrichment Script
 * 
 * Enriches seeded data with additional metadata and validation.
 * Run with: npx tsx scripts/enrich-cards.ts
 * 
 * This script:
 * 1. Clears all previously enriched data (for idempotent re-runs)
 * 2. Downloads Scryfall oracle_cards bulk data
 * 3. Updates cards table with type_line, mana_cost, cmc, scryfall_data
 * 4. Updates commanders table with color_id
 * 5. Updates tournaments table with bracket_url
 * 6. Validates decklists via Scrollrack API
 * 
 * Pipeline: seed -> enrich -> aggregate
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import type { Database } from '../lib/db/types';
import { validateDecklistWithRetry } from '../lib/scrollrack';

// ============================================
// Configuration
// ============================================

const SCRYFALL_BULK_DATA_URL = 'https://api.scryfall.com/bulk-data';
const ORACLE_CARDS_FILE = './oracle_cards.scryfall.json';
const BATCH_SIZE = 500;
const PAGE_SIZE = 1000;
const VALIDATION_CONCURRENCY = 10; // Number of parallel Scrollrack calls
const VALIDATION_DELAY_MS = 20; // Small delay between batches

// ============================================
// Telemetry / Progress Tracking
// ============================================

class ProgressTracker {
  private startTime: number;
  private phaseStartTime: number;
  private totalItems: number;
  private processedItems: number;
  private phaseName: string;

  constructor() {
    this.startTime = Date.now();
    this.phaseStartTime = Date.now();
    this.totalItems = 0;
    this.processedItems = 0;
    this.phaseName = '';
  }

  startPhase(name: string, totalItems: number): void {
    this.phaseName = name;
    this.totalItems = totalItems;
    this.processedItems = 0;
    this.phaseStartTime = Date.now();
    console.log(`\n⏱️  Starting: ${name} (${totalItems} items)`);
  }

  update(processed: number): void {
    this.processedItems = processed;
  }

  increment(count: number = 1): void {
    this.processedItems += count;
  }

  getElapsed(): string {
    const elapsed = Date.now() - this.startTime;
    return this.formatDuration(elapsed);
  }

  getPhaseElapsed(): string {
    const elapsed = Date.now() - this.phaseStartTime;
    return this.formatDuration(elapsed);
  }

  getETA(): string {
    if (this.processedItems === 0 || this.totalItems === 0) return 'calculating...';
    
    const elapsed = Date.now() - this.phaseStartTime;
    const rate = this.processedItems / elapsed; // items per ms
    const remaining = this.totalItems - this.processedItems;
    const etaMs = remaining / rate;
    
    return this.formatDuration(etaMs);
  }

  getProgress(): string {
    if (this.totalItems === 0) return '0%';
    const pct = (this.processedItems / this.totalItems * 100).toFixed(1);
    return `${pct}%`;
  }

  getRate(): string {
    const elapsed = (Date.now() - this.phaseStartTime) / 1000; // seconds
    if (elapsed === 0) return '0/s';
    const rate = this.processedItems / elapsed;
    return `${rate.toFixed(1)}/s`;
  }

  logProgress(extra?: string): void {
    const progress = this.getProgress();
    const elapsed = this.getPhaseElapsed();
    const eta = this.getETA();
    const rate = this.getRate();
    
    let status = `[${progress}] ${this.processedItems}/${this.totalItems} | ⏱️ ${elapsed} | ETA: ${eta} | ${rate}`;
    if (extra) status += ` | ${extra}`;
    
    process.stdout.write(`\r  📊 ${status}    `);
  }

  endPhase(): void {
    const elapsed = this.getPhaseElapsed();
    const rate = this.getRate();
    console.log(`\n  ✅ ${this.phaseName} complete in ${elapsed} (${rate})`);
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
// Types
// ============================================

interface ScryfallBulkDataResponse {
  object: 'list';
  data: Array<{
    object: 'bulk_data';
    type: string;
    download_uri: string;
  }>;
}

interface ScryfallCardFace {
  name: string;
  mana_cost?: string;
  type_line?: string;
  colors?: string[];
}

interface ScryfallCard {
  id: string;
  oracle_id: string;
  name: string;
  type_line?: string;
  mana_cost?: string;
  cmc?: number;
  color_identity?: string[];
  colors?: string[];
  card_faces?: ScryfallCardFace[];
}

interface DbCard {
  id: number;
  name: string;
  oracle_id: string | null;
}

interface DbCommander {
  id: number;
  name: string;
}

interface DbTournament {
  id: number;
  tid: string;
}

interface DbEntry {
  id: number;
  decklist: string | null;
}

interface EnrichmentStats {
  cardsEnriched: number;
  cardsNotFound: number;
  commandersEnriched: number;
  tournamentsEnriched: number;
  decklistsValidated: number;
  decklistsValid: number;
  decklistsInvalid: number;
  decklistsSkipped: number;
}

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
 * Extract mana_cost from a Scryfall card, handling multi-faced cards.
 * For multi-faced cards, mana_cost is in card_faces[0].mana_cost.
 */
function extractManaCost(card: ScryfallCard): string | null {
  if (card.mana_cost) {
    return card.mana_cost;
  }
  if (card.card_faces && card.card_faces.length > 0 && card.card_faces[0].mana_cost) {
    return card.card_faces[0].mana_cost;
  }
  return null;
}

/**
 * Convert color identity array to WUBRG string.
 * Returns 'C' for colorless.
 */
function wubrgify(colorIdentity: string[]): string {
  let result = '';
  if (colorIdentity.includes('W')) result += 'W';
  if (colorIdentity.includes('U')) result += 'U';
  if (colorIdentity.includes('B')) result += 'B';
  if (colorIdentity.includes('R')) result += 'R';
  if (colorIdentity.includes('G')) result += 'G';
  return result || 'C';
}

// ============================================
// Scryfall Data Loading
// ============================================

async function downloadScryfallData(): Promise<void> {
  try {
    const stats = await fs.stat(ORACLE_CARDS_FILE);
    const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
    
    if (ageHours < 24) {
      console.log(`✅ Using cached Scryfall data (${ageHours.toFixed(1)} hours old)`);
      return;
    }
    console.log(`🔄 Scryfall data is ${ageHours.toFixed(1)} hours old, refreshing...`);
  } catch {
    console.log('📥 No cached Scryfall data found, downloading...');
  }
  
  console.log('🔍 Fetching Scryfall bulk data URL...');
  const bulkResponse = await fetch(SCRYFALL_BULK_DATA_URL, {
    headers: { 'Accept': '*/*', 'User-Agent': 'cedhtools/1.0' },
  });
  
  if (!bulkResponse.ok) {
    throw new Error(`Failed to fetch Scryfall bulk data: ${bulkResponse.status}`);
  }
  
  const bulkData: ScryfallBulkDataResponse = await bulkResponse.json();
  const oracleCardsEntry = bulkData.data.find(d => d.type === 'oracle_cards');
  
  if (!oracleCardsEntry) {
    throw new Error('Could not find oracle_cards in Scryfall bulk data');
  }
  
  console.log(`📥 Downloading oracle_cards...`);
  const downloadResponse = await fetch(oracleCardsEntry.download_uri, {
    headers: { 'Accept': '*/*', 'User-Agent': 'cedhtools/1.0' },
  });
  
  if (!downloadResponse.ok || !downloadResponse.body) {
    throw new Error(`Failed to download Scryfall data: ${downloadResponse.status}`);
  }
  
  const fileStream = createWriteStream(ORACLE_CARDS_FILE);
  // @ts-expect-error - Node.js stream compatibility
  await pipeline(downloadResponse.body, fileStream);
  
  console.log('✅ Scryfall data downloaded successfully');
}

async function loadScryfallData(): Promise<Map<string, ScryfallCard>> {
  console.log('📂 Loading Scryfall data into memory...');
  
  const fileContent = await fs.readFile(ORACLE_CARDS_FILE, 'utf-8');
  const cards: ScryfallCard[] = JSON.parse(fileContent);
  
  const cardByOracleId = new Map<string, ScryfallCard>();
  const cardByName = new Map<string, ScryfallCard>();
  
  for (const card of cards) {
    cardByOracleId.set(card.oracle_id, card);
    cardByName.set(card.name.toLowerCase(), card);
    
    // For double-faced cards (name contains " // "), also index by front face name
    // This handles TopDeck data inconsistency where some entries use full DFC name
    // and others use just the front face name
    if (card.name.includes(' // ')) {
      const frontFace = card.name.split(' // ')[0].toLowerCase();
      // Only set if not already mapped (prefer exact matches)
      if (!cardByName.has(frontFace)) {
        cardByName.set(frontFace, card);
      }
    }
  }
  
  console.log(`✅ Loaded ${cardByOracleId.size} unique cards`);
  
  (cardByOracleId as Map<string, ScryfallCard> & { byName: Map<string, ScryfallCard> }).byName = cardByName;
  
  return cardByOracleId;
}

// ============================================
// Clear Functions (for idempotent re-runs)
// ============================================

async function clearEnrichedData(
  supabase: ReturnType<typeof createSupabaseAdmin>
): Promise<void> {
  console.log('\n🧹 Clearing previously enriched data...');
  
  // Clear cards enrichment data
  console.log('  📦 Clearing cards enrichment...');
  const { error: cardsError } = await supabase
    .from('cards')
    .update({
      type_line: null,
      mana_cost: null,
      cmc: null,
      scryfall_data: null,
    })
    .neq('id', 0);
  
  if (cardsError) throw cardsError;
  
  // Clear commanders color_id
  console.log('  📦 Clearing commanders color_id...');
  const { error: commandersError } = await supabase
    .from('commanders')
    .update({ color_id: '' })
    .neq('id', 0);
  
  if (commandersError) throw commandersError;
  
  // Clear tournaments bracket_url
  console.log('  📦 Clearing tournaments bracket_url...');
  const { error: tournamentsError } = await supabase
    .from('tournaments')
    .update({ bracket_url: null })
    .neq('id', 0);
  
  if (tournamentsError) throw tournamentsError;
  
  // Clear entries decklist_valid
  console.log('  📦 Clearing entries decklist_valid...');
  const { error: entriesError } = await supabase
    .from('entries')
    .update({ decklist_valid: null })
    .neq('id', 0);
  
  if (entriesError) throw entriesError;
  
  console.log('  ✅ All enriched data cleared');
}

// ============================================
// Enrichment Functions
// ============================================

async function enrichCards(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  scryfallCards: Map<string, ScryfallCard>,
  stats: EnrichmentStats
): Promise<void> {
  console.log('\n📊 Enriching cards table...');
  
  // Get count first for progress tracking
  const { count: totalCount } = await supabase
    .from('cards')
    .select('id', { count: 'exact', head: true });
  
  progress.startPhase('Enriching cards', totalCount ?? 0);
  
  const cards: DbCard[] = [];
  let offset = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('cards')
      .select('id, name, oracle_id')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    const page = data as DbCard[] | null;
    if (!page || page.length === 0) break;
    
    cards.push(...page);
    offset += PAGE_SIZE;
    
    if (page.length < PAGE_SIZE) break;
  }
  
  const byName = (scryfallCards as Map<string, ScryfallCard> & { byName: Map<string, ScryfallCard> }).byName;
  
  for (let i = 0; i < cards.length; i += BATCH_SIZE) {
    const batch = cards.slice(i, i + BATCH_SIZE);
    
    for (const card of batch) {
      let scryfallCard = card.oracle_id 
        ? scryfallCards.get(card.oracle_id)
        : undefined;
      
      if (!scryfallCard && byName) {
        scryfallCard = byName.get(card.name.toLowerCase());
      }
      
      if (!scryfallCard) {
        stats.cardsNotFound++;
        continue;
      }
      
      const { error: updateError } = await supabase
        .from('cards')
        .update({
          oracle_id: scryfallCard.oracle_id,
          type_line: scryfallCard.type_line || null,
          mana_cost: extractManaCost(scryfallCard),
          cmc: scryfallCard.cmc ?? null,
          scryfall_data: scryfallCard as unknown as Record<string, unknown>,
        })
        .eq('id', card.id);
      
      if (!updateError) {
        stats.cardsEnriched++;
      }
    }
    
    progress.update(Math.min(i + BATCH_SIZE, cards.length));
    progress.logProgress(`${stats.cardsEnriched} enriched, ${stats.cardsNotFound} not found`);
  }
  
  progress.endPhase();
}

async function enrichCommanders(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  scryfallCards: Map<string, ScryfallCard>,
  stats: EnrichmentStats
): Promise<void> {
  console.log('\n📊 Enriching commanders table...');
  
  const commanders: DbCommander[] = [];
  let offset = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('commanders')
      .select('id, name')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    const page = data as DbCommander[] | null;
    if (!page || page.length === 0) break;
    
    commanders.push(...page);
    offset += PAGE_SIZE;
    
    if (page.length < PAGE_SIZE) break;
  }
  
  console.log(`  📦 Found ${commanders.length} commanders to enrich`);
  
  const byName = (scryfallCards as Map<string, ScryfallCard> & { byName: Map<string, ScryfallCard> }).byName;
  
  for (const commander of commanders) {
    const commanderNames = commander.name.split(' / ');
    const combinedColorIdentity: string[] = [];
    
    for (const name of commanderNames) {
      const scryfallCard = byName?.get(name.toLowerCase().trim());
      if (scryfallCard?.color_identity) {
        combinedColorIdentity.push(...scryfallCard.color_identity);
      }
    }
    
    const colorId = wubrgify([...new Set(combinedColorIdentity)]);
    
    const { error: updateError } = await supabase
      .from('commanders')
      .update({ color_id: colorId })
      .eq('id', commander.id);
    
    if (!updateError) {
      stats.commandersEnriched++;
    }
  }
  
  console.log(`  ✅ Enriched ${stats.commandersEnriched} commanders with color identity`);
}

async function enrichTournaments(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  stats: EnrichmentStats
): Promise<void> {
  console.log('\n📊 Enriching tournaments table...');
  
  const tournaments: DbTournament[] = [];
  let offset = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, tid')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    const page = data as DbTournament[] | null;
    if (!page || page.length === 0) break;
    
    tournaments.push(...page);
    offset += PAGE_SIZE;
    
    if (page.length < PAGE_SIZE) break;
  }
  
  console.log(`  📦 Found ${tournaments.length} tournaments to update`);
  
  for (const tournament of tournaments) {
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({ bracket_url: `https://topdeck.gg/bracket/${tournament.tid}` })
      .eq('id', tournament.id);
    
    if (!updateError) {
      stats.tournamentsEnriched++;
    }
  }
  
  console.log(`  ✅ Updated ${stats.tournamentsEnriched} tournaments with bracket_url`);
}

async function validateDecklists(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  stats: EnrichmentStats
): Promise<void> {
  console.log('\n📊 Validating decklists via Scrollrack API...');
  console.log(`  ⚡ Using ${VALIDATION_CONCURRENCY} parallel requests`);
  
  // First, get total count for progress tracking
  const { count: totalCount, error: countError } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .not('decklist', 'is', null);
  
  if (countError) throw countError;
  
  const totalEntries = totalCount ?? 0;
  progress.startPhase('Validating decklists', totalEntries);
  
  // Process entries in streaming fashion - don't load all into memory
  let offset = 0;
  
  while (true) {
    // Fetch a page of entries
    const { data, error } = await supabase
      .from('entries')
      .select('id, decklist')
      .not('decklist', 'is', null)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (error) throw error;
    
    const entries = data as DbEntry[] | null;
    if (!entries || entries.length === 0) break;
    
    // Process this page in parallel chunks
    for (let i = 0; i < entries.length; i += VALIDATION_CONCURRENCY) {
      const chunk = entries.slice(i, i + VALIDATION_CONCURRENCY);
      
      // Process chunk in parallel
      const results = await Promise.allSettled(
        chunk.map(async (entry) => {
          if (!entry.decklist) {
            return { id: entry.id, skipped: true };
          }
          
          try {
            const validationResult = await validateDecklistWithRetry(entry.decklist);
            
            if (validationResult) {
              return { 
                id: entry.id, 
                valid: validationResult.valid,
                skipped: false 
              };
            }
            return { id: entry.id, valid: null, skipped: false };
          } catch {
            return { id: entry.id, valid: null, skipped: false };
          }
        })
      );
      
      // Update database with results
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { id, valid, skipped } = result.value;
          
          if (skipped) {
            stats.decklistsSkipped++;
          } else {
            stats.decklistsValidated++;
            
            if (valid === true) {
              stats.decklistsValid++;
              await supabase.from('entries').update({ decklist_valid: true }).eq('id', id);
            } else if (valid === false) {
              stats.decklistsInvalid++;
              await supabase.from('entries').update({ decklist_valid: false }).eq('id', id);
            }
            // valid === null means API failed, leave decklist_valid as NULL
          }
        }
      }
      
      progress.increment(chunk.length);
      progress.logProgress(`${stats.decklistsValid} valid, ${stats.decklistsInvalid} invalid`);
      
      // Small delay between parallel batches
      await new Promise(resolve => setTimeout(resolve, VALIDATION_DELAY_MS));
    }
    
    offset += PAGE_SIZE;
    if (entries.length < PAGE_SIZE) break;
  }
  
  progress.endPhase();
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
  
  const supabase = createSupabaseAdmin();
  
  const stats: EnrichmentStats = {
    cardsEnriched: 0,
    cardsNotFound: 0,
    commandersEnriched: 0,
    tournamentsEnriched: 0,
    decklistsValidated: 0,
    decklistsValid: 0,
    decklistsInvalid: 0,
    decklistsSkipped: 0,
  };
  
  // Step 1: Clear all previously enriched data
  await clearEnrichedData(supabase);
  
  // Step 2: Download/load Scryfall data
  await downloadScryfallData();
  const scryfallCards = await loadScryfallData();
  
  // Step 3: Enrich cards with Scryfall data
  await enrichCards(supabase, scryfallCards, stats);
  
  // Step 4: Enrich commanders with color identity
  await enrichCommanders(supabase, scryfallCards, stats);
  
  // Step 5: Enrich tournaments with bracket URLs
  await enrichTournaments(supabase, stats);
  
  // Step 6: Validate decklists via Scrollrack API
  await validateDecklists(supabase, stats);
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('Enrichment Complete!');
  console.log('═'.repeat(60));
  progress.summary();
  console.log('');
  console.log(`Cards enriched:        ${stats.cardsEnriched}`);
  console.log(`Cards not found:       ${stats.cardsNotFound}`);
  console.log(`Commanders enriched:   ${stats.commandersEnriched}`);
  console.log(`Tournaments enriched:  ${stats.tournamentsEnriched}`);
  console.log(`Decklists validated:   ${stats.decklistsValidated}`);
  console.log(`  - Valid:             ${stats.decklistsValid}`);
  console.log(`  - Invalid:           ${stats.decklistsInvalid}`);
  console.log(`  - Skipped:           ${stats.decklistsSkipped}`);
}

// ============================================
// Entry Point
// ============================================

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
