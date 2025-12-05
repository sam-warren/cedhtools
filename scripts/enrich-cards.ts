#!/usr/bin/env npx tsx
/**
 * Card Enrichment Script
 * 
 * Enriches cards and commanders with Scryfall data.
 * Run with: npx tsx scripts/enrich-cards.ts
 * 
 * This script:
 * 1. Downloads Scryfall oracle_cards bulk data
 * 2. Updates cards table with type_line, mana_cost, cmc, scryfall_data
 * 3. Updates commanders table with color_id
 * 4. Updates tournaments table with bracket_url
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

// ============================================
// Configuration
// ============================================

const SCRYFALL_BULK_DATA_URL = 'https://api.scryfall.com/bulk-data';
const ORACLE_CARDS_FILE = './oracle_cards.scryfall.json';
const BATCH_SIZE = 500;

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

interface ScryfallCard {
  id: string;           // Scryfall printing ID
  oracle_id: string;    // Oracle ID (what TopDeck uses)
  name: string;
  type_line?: string;
  mana_cost?: string;
  cmc?: number;
  color_identity?: string[];
  colors?: string[];
  // ... many more fields we store in scryfall_data
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
// Scryfall Data Loading
// ============================================

async function downloadScryfallData(): Promise<void> {
  // Check if we already have the file (less than 24 hours old)
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
  
  // Get bulk data URL
  console.log('🔍 Fetching Scryfall bulk data URL...');
  const bulkResponse = await fetch(SCRYFALL_BULK_DATA_URL, {
    headers: {
      'Accept': '*/*',
      'User-Agent': 'cedhtools/1.0',
    },
  });
  
  if (!bulkResponse.ok) {
    throw new Error(`Failed to fetch Scryfall bulk data: ${bulkResponse.status}`);
  }
  
  const bulkData: ScryfallBulkDataResponse = await bulkResponse.json();
  const oracleCardsEntry = bulkData.data.find(d => d.type === 'oracle_cards');
  
  if (!oracleCardsEntry) {
    throw new Error('Could not find oracle_cards in Scryfall bulk data');
  }
  
  // Download the file
  console.log(`📥 Downloading oracle_cards from ${oracleCardsEntry.download_uri}...`);
  const downloadResponse = await fetch(oracleCardsEntry.download_uri, {
    headers: {
      'Accept': '*/*',
      'User-Agent': 'cedhtools/1.0',
    },
  });
  
  if (!downloadResponse.ok || !downloadResponse.body) {
    throw new Error(`Failed to download Scryfall data: ${downloadResponse.status}`);
  }
  
  // Stream to file
  const fileStream = createWriteStream(ORACLE_CARDS_FILE);
  // @ts-expect-error - Node.js stream compatibility
  await pipeline(downloadResponse.body, fileStream);
  
  console.log('✅ Scryfall data downloaded successfully');
}

async function loadScryfallData(): Promise<Map<string, ScryfallCard>> {
  console.log('📂 Loading Scryfall data into memory...');
  
  const fileContent = await fs.readFile(ORACLE_CARDS_FILE, 'utf-8');
  const cards: ScryfallCard[] = JSON.parse(fileContent);
  
  // Build lookup map by Oracle ID
  const cardByOracleId = new Map<string, ScryfallCard>();
  const cardByName = new Map<string, ScryfallCard>();
  
  for (const card of cards) {
    cardByOracleId.set(card.oracle_id, card);
    cardByName.set(card.name.toLowerCase(), card);
  }
  
  console.log(`✅ Loaded ${cardByOracleId.size} unique cards`);
  
  // Also attach by-name lookup for fallback
  (cardByOracleId as Map<string, ScryfallCard> & { byName: Map<string, ScryfallCard> }).byName = cardByName;
  
  return cardByOracleId;
}

// ============================================
// Color Identity Helpers
// ============================================

/**
 * Convert color identity array to WUBRG string
 * Returns 'C' for colorless
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
// Enrichment Functions
// ============================================

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

async function enrichCards(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  scryfallCards: Map<string, ScryfallCard>
): Promise<number> {
  console.log('\n📊 Enriching cards table...');
  
  // Get all cards that need enrichment (missing type_line or scryfall_data)
  // Paginate to get all records (Supabase default limit is 1000)
  const cards: DbCard[] = [];
  let offset = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('cards')
      .select('id, name, oracle_id')
      .or('type_line.is.null,scryfall_data.is.null')
      .range(offset, offset + pageSize - 1);
    
    if (error) throw error;
    
    const page = data as DbCard[] | null;
    if (!page || page.length === 0) break;
    
    cards.push(...page);
    offset += pageSize;
    
    if (page.length < pageSize) break; // Last page
  }
  
  if (cards.length === 0) {
    console.log('  ✅ All cards already enriched');
    return 0;
  }
  
  console.log(`  📦 Found ${cards.length} cards to enrich`);
  
  const byName = (scryfallCards as Map<string, ScryfallCard> & { byName: Map<string, ScryfallCard> }).byName;
  let enriched = 0;
  let notFound = 0;
  
  // Process in batches
  for (let i = 0; i < cards.length; i += BATCH_SIZE) {
    const batch = cards.slice(i, i + BATCH_SIZE);
    
    for (const card of batch) {
      // Try to find by oracle_id first, then by name
      let scryfallCard = card.oracle_id 
        ? scryfallCards.get(card.oracle_id)
        : undefined;
      
      if (!scryfallCard && byName) {
        scryfallCard = byName.get(card.name.toLowerCase());
      }
      
      if (!scryfallCard) {
        notFound++;
        continue;
      }
      
      const { error: updateError } = await supabase
        .from('cards')
        .update({
          oracle_id: scryfallCard.oracle_id,
          type_line: scryfallCard.type_line || null,
          mana_cost: scryfallCard.mana_cost || null,
          cmc: scryfallCard.cmc ?? null,
          scryfall_data: scryfallCard as unknown as Record<string, unknown>,
        } as never)
        .eq('id', card.id);
      
      if (updateError) {
        console.error(`  ❌ Error updating card ${card.name}:`, updateError.message);
      } else {
        enriched++;
      }
    }
    
    console.log(`  📦 Processed ${Math.min(i + BATCH_SIZE, cards.length)}/${cards.length} cards`);
  }
  
  console.log(`  ✅ Enriched ${enriched} cards (${notFound} not found in Scryfall)`);
  return enriched;
}

async function enrichCommanders(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  scryfallCards: Map<string, ScryfallCard>
): Promise<number> {
  console.log('\n📊 Enriching commanders table...');
  
  // Get all commanders that need color_id (paginate to get all)
  const commanders: DbCommander[] = [];
  let offset = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('commanders')
      .select('id, name')
      .or('color_id.is.null,color_id.eq.')
      .range(offset, offset + pageSize - 1);
    
    if (error) throw error;
    
    const page = data as DbCommander[] | null;
    if (!page || page.length === 0) break;
    
    commanders.push(...page);
    offset += pageSize;
    
    if (page.length < pageSize) break;
  }
  
  if (commanders.length === 0) {
    console.log('  ✅ All commanders already have color_id');
    return 0;
  }
  
  console.log(`  📦 Found ${commanders.length} commanders to enrich`);
  
  const byName = (scryfallCards as Map<string, ScryfallCard> & { byName: Map<string, ScryfallCard> }).byName;
  let enriched = 0;
  
  for (const commander of commanders) {
    // Split by " / " for partner commanders (NOT "//" which is in DFC names)
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
      .update({ color_id: colorId } as never)
      .eq('id', commander.id);
    
    if (updateError) {
      console.error(`  ❌ Error updating commander ${commander.name}:`, updateError.message);
    } else {
      enriched++;
    }
  }
  
  console.log(`  ✅ Enriched ${enriched} commanders with color identity`);
  return enriched;
}

async function enrichTournaments(
  supabase: ReturnType<typeof createSupabaseAdmin>
): Promise<number> {
  console.log('\n📊 Enriching tournaments table...');
  
  // Get tournaments that need bracket_url (paginate to get all)
  const tournaments: DbTournament[] = [];
  let offset = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, tid')
      .is('bracket_url', null)
      .range(offset, offset + pageSize - 1);
    
    if (error) throw error;
    
    const page = data as DbTournament[] | null;
    if (!page || page.length === 0) break;
    
    tournaments.push(...page);
    offset += pageSize;
    
    if (page.length < pageSize) break;
  }
  
  if (tournaments.length === 0) {
    console.log('  ✅ All tournaments already have bracket_url');
    return 0;
  }
  
  console.log(`  📦 Found ${tournaments.length} tournaments to update`);
  
  let updated = 0;
  for (const tournament of tournaments) {
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({ bracket_url: `https://topdeck.gg/bracket/${tournament.tid}` } as never)
      .eq('id', tournament.id);
    
    if (!updateError) updated++;
  }
  
  console.log(`  ✅ Updated ${updated} tournaments with bracket_url`);
  return updated;
}

// ============================================
// Main Function
// ============================================

async function main(): Promise<void> {
  console.log('═'.repeat(60));
  console.log('cEDH Tools - Card Enrichment');
  console.log('═'.repeat(60));
  
  const supabase = createSupabaseAdmin();
  
  // Step 1: Download/load Scryfall data
  await downloadScryfallData();
  const scryfallCards = await loadScryfallData();
  
  // Step 2: Enrich cards
  const cardsEnriched = await enrichCards(supabase, scryfallCards);
  
  // Step 3: Enrich commanders
  const commandersEnriched = await enrichCommanders(supabase, scryfallCards);
  
  // Step 4: Enrich tournaments
  const tournamentsEnriched = await enrichTournaments(supabase);
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('Enrichment Complete!');
  console.log('═'.repeat(60));
  console.log(`Cards enriched:       ${cardsEnriched}`);
  console.log(`Commanders enriched:  ${commandersEnriched}`);
  console.log(`Tournaments enriched: ${tournamentsEnriched}`);
}

// ============================================
// Entry Point
// ============================================

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

