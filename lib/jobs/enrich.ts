/**
 * Data Enrichment Job
 * 
 * Enriches data with additional metadata and validation.
 * Supports incremental mode - only processes records missing enrichment data.
 * 
 * Pipeline: sync -> enrich (this) -> aggregate
 */

import { Readable } from 'stream';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import { validateDecklistWithRetry } from '../api/scrollrack';
import {
  type EnrichmentStats,
  type ProgressLogger,
  type SupabaseAdmin,
  createProgressLogger,
  PAGE_SIZE
} from './utils';

// ============================================
// Configuration
// ============================================

const SCRYFALL_BULK_DATA_URL = 'https://api.scryfall.com/bulk-data';
const VALIDATION_CONCURRENCY = 10;
const VALIDATION_DELAY_MS = 20;
const UPDATE_BATCH_SIZE = 100; // Batch size for DB updates

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

/** 
 * Scryfall card data - only the fields we need for enrichment.
 * Streamed from bulk API to minimize memory usage.
 */
export interface ScryfallCard {
  oracle_id: string;
  name: string;
  type_line?: string;
  mana_cost?: string;
  cmc?: number;
  color_identity?: string[];
  card_faces?: Array<{ mana_cost?: string }>;
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

// ============================================
// Helper Functions
// ============================================

function extractManaCost(card: ScryfallCard): string | null {
  if (card.mana_cost) return card.mana_cost;
  if (card.card_faces?.[0]?.mana_cost) return card.card_faces[0].mana_cost;
  return null;
}

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
// Scryfall Data Loading (Streaming)
// ============================================

/** Raw card from Scryfall API before we filter fields */
interface ScryfallCardRaw {
  oracle_id: string;
  name: string;
  type_line?: string;
  mana_cost?: string;
  cmc?: number;
  color_identity?: string[];
  card_faces?: Array<{ mana_cost?: string }>;
}

/**
 * Load Scryfall card data using streaming to minimize memory.
 * Only keeps fields needed for enrichment (~100MB vs ~800MB full).
 */
export async function loadScryfallData(
  logger: ProgressLogger
): Promise<Map<string, ScryfallCard> & { byName: Map<string, ScryfallCard> }> {
  logger.log('Fetching Scryfall bulk data URL...');
  
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
  
  logger.log('Streaming oracle_cards from Scryfall...');
  const downloadResponse = await fetch(oracleCardsEntry.download_uri, {
    headers: { 'Accept': '*/*', 'User-Agent': 'cedhtools/1.0' },
  });
  
  if (!downloadResponse.ok) {
    throw new Error(`Failed to download Scryfall data: ${downloadResponse.status}`);
  }
  
  if (!downloadResponse.body) {
    throw new Error('Response body is null - cannot stream');
  }
  
  const cardByOracleId = new Map<string, ScryfallCard>() as Map<string, ScryfallCard> & { byName: Map<string, ScryfallCard> };
  const cardByName = new Map<string, ScryfallCard>();
  
  let processedCount = 0;
  const startTime = Date.now();
  
  await new Promise<void>((resolve, reject) => {
    const reader = downloadResponse.body!.getReader();
    const nodeStream = new Readable({
      async read() {
        try {
          const { done, value } = await reader.read();
          if (done) {
            this.push(null);
          } else {
            this.push(Buffer.from(value));
          }
        } catch (err) {
          this.destroy(err as Error);
        }
      }
    });
    
    const pipeline = nodeStream.pipe(parser()).pipe(streamArray());
    
    pipeline.on('data', ({ value: raw }: { value: ScryfallCardRaw }) => {
      const card: ScryfallCard = {
        oracle_id: raw.oracle_id,
        name: raw.name,
        type_line: raw.type_line,
        mana_cost: raw.mana_cost,
        cmc: raw.cmc,
        color_identity: raw.color_identity,
        card_faces: raw.card_faces?.map(f => ({ mana_cost: f.mana_cost })),
      };
      
      cardByOracleId.set(card.oracle_id, card);
      cardByName.set(card.name.toLowerCase(), card);
      
      if (card.name.includes(' // ')) {
        const frontFace = card.name.split(' // ')[0].toLowerCase();
        if (!cardByName.has(frontFace)) {
          cardByName.set(frontFace, card);
        }
      }
      
      processedCount++;
      if (processedCount % 10000 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        logger.debug(`Streamed ${processedCount.toLocaleString()} cards... (${elapsed}s)`);
      }
    });
    
    pipeline.on('end', resolve);
    pipeline.on('error', reject);
  });
  
  cardByOracleId.byName = cardByName;
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  logger.log(`Loaded ${cardByOracleId.size.toLocaleString()} cards from Scryfall in ${elapsed}s`);
  logger.logMemory();
  
  return cardByOracleId;
}

// ============================================
// Enrichment Functions
// ============================================

async function enrichCards(
  supabase: SupabaseAdmin,
  scryfallCards: Map<string, ScryfallCard> & { byName: Map<string, ScryfallCard> },
  stats: EnrichmentStats,
  logger: ProgressLogger,
  incremental: boolean
): Promise<void> {
  // Get count for progress
  let countQuery = supabase.from('cards').select('id', { count: 'exact', head: true });
  if (incremental) countQuery = countQuery.is('scryfall_data', null);
  const { count: totalCount } = await countQuery;
  
  logger.startPhase('Enrich Cards', totalCount ?? 0);
  
  const pendingUpdates: Array<{
    id: number;
    oracle_id: string;
    type_line: string | null;
    mana_cost: string | null;
    cmc: number | null;
    scryfall_data: Record<string, unknown>;
  }> = [];
  
  let offset = 0;
  let totalProcessed = 0;
  const byName = scryfallCards.byName;
  
  while (true) {
    let query = supabase
      .from('cards')
      .select('id, name, oracle_id')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (incremental) query = query.is('scryfall_data', null);
    
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    const cards = data as DbCard[];
    
    for (const card of cards) {
      let scryfallCard = card.oracle_id ? scryfallCards.get(card.oracle_id) : undefined;
      if (!scryfallCard) scryfallCard = byName?.get(card.name.toLowerCase());
      
      if (!scryfallCard) {
        stats.cardsNotFound++;
        continue;
      }
      
      pendingUpdates.push({
        id: card.id,
        oracle_id: scryfallCard.oracle_id,
        type_line: scryfallCard.type_line || null,
        mana_cost: extractManaCost(scryfallCard),
        cmc: scryfallCard.cmc ?? null,
        scryfall_data: scryfallCard as unknown as Record<string, unknown>,
      });
      
      // Flush batch when full
      if (pendingUpdates.length >= UPDATE_BATCH_SIZE) {
        const flushed = await flushCardUpdates(supabase, pendingUpdates);
        stats.cardsEnriched += flushed;
        pendingUpdates.length = 0;
      }
    }
    
    totalProcessed += cards.length;
    logger.update(totalProcessed);
    offset += PAGE_SIZE;
    if (cards.length < PAGE_SIZE) break;
  }
  
  // Flush remaining
  if (pendingUpdates.length > 0) {
    const flushed = await flushCardUpdates(supabase, pendingUpdates);
    stats.cardsEnriched += flushed;
  }
  
  logger.endPhase();
}

async function flushCardUpdates(
  supabase: SupabaseAdmin,
  updates: Array<{
    id: number;
    oracle_id: string;
    type_line: string | null;
    mana_cost: string | null;
    cmc: number | null;
    scryfall_data: Record<string, unknown>;
  }>
): Promise<number> {
  if (updates.length === 0) return 0;
  
  // Use individual updates since cards table may not support upsert by id
  let count = 0;
  for (const update of updates) {
    const { error } = await supabase
      .from('cards')
      .update({
        oracle_id: update.oracle_id,
        type_line: update.type_line,
        mana_cost: update.mana_cost,
        cmc: update.cmc,
        scryfall_data: update.scryfall_data,
      })
      .eq('id', update.id);
    if (!error) count++;
  }
  return count;
}

async function enrichCommanders(
  supabase: SupabaseAdmin,
  scryfallCards: Map<string, ScryfallCard> & { byName: Map<string, ScryfallCard> },
  stats: EnrichmentStats,
  logger: ProgressLogger,
  incremental: boolean
): Promise<void> {
  // Get count for progress
  let countQuery = supabase.from('commanders').select('id', { count: 'exact', head: true });
  if (incremental) countQuery = countQuery.eq('color_id', '');
  const { count: totalCount } = await countQuery;
  
  logger.startPhase('Enrich Commanders', totalCount ?? 0);
  
  const pendingUpdates: Array<{ id: number; color_id: string }> = [];
  let offset = 0;
  let totalProcessed = 0;
  const byName = scryfallCards.byName;
  
  while (true) {
    let query = supabase
      .from('commanders')
      .select('id, name')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (incremental) query = query.eq('color_id', '');
    
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    const commanders = data as DbCommander[];
    
    for (const commander of commanders) {
      const commanderNames = commander.name.split(' / ');
      const combinedColorIdentity: string[] = [];
      
      for (const name of commanderNames) {
        const scryfallCard = byName?.get(name.toLowerCase().trim());
        if (scryfallCard?.color_identity) {
          combinedColorIdentity.push(...scryfallCard.color_identity);
        }
      }
      
      pendingUpdates.push({
        id: commander.id,
        color_id: wubrgify([...new Set(combinedColorIdentity)]),
      });
      
      if (pendingUpdates.length >= UPDATE_BATCH_SIZE) {
        const flushed = await flushCommanderUpdates(supabase, pendingUpdates);
        stats.commandersEnriched += flushed;
        pendingUpdates.length = 0;
      }
    }
    
    totalProcessed += commanders.length;
    logger.update(totalProcessed);
    offset += PAGE_SIZE;
    if (commanders.length < PAGE_SIZE) break;
  }
  
  if (pendingUpdates.length > 0) {
    const flushed = await flushCommanderUpdates(supabase, pendingUpdates);
    stats.commandersEnriched += flushed;
  }
  
  logger.endPhase();
}

async function flushCommanderUpdates(
  supabase: SupabaseAdmin,
  updates: Array<{ id: number; color_id: string }>
): Promise<number> {
  let count = 0;
  for (const update of updates) {
    const { error } = await supabase
      .from('commanders')
      .update({ color_id: update.color_id })
      .eq('id', update.id);
    if (!error) count++;
  }
  return count;
}

async function enrichTournaments(
  supabase: SupabaseAdmin,
  stats: EnrichmentStats,
  logger: ProgressLogger,
  incremental: boolean
): Promise<void> {
  // Get count for progress
  let countQuery = supabase.from('tournaments').select('id', { count: 'exact', head: true });
  if (incremental) countQuery = countQuery.is('bracket_url', null);
  const { count: totalCount } = await countQuery;
  
  logger.startPhase('Enrich Tournaments', totalCount ?? 0);
  
  const pendingUpdates: Array<{ id: number; bracket_url: string }> = [];
  let offset = 0;
  let totalProcessed = 0;
  
  while (true) {
    let query = supabase
      .from('tournaments')
      .select('id, tid')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (incremental) query = query.is('bracket_url', null);
    
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    const tournaments = data as DbTournament[];
    
    for (const tournament of tournaments) {
      pendingUpdates.push({
        id: tournament.id,
        bracket_url: `https://topdeck.gg/bracket/${tournament.tid}`,
      });
      
      if (pendingUpdates.length >= UPDATE_BATCH_SIZE) {
        const flushed = await flushTournamentUpdates(supabase, pendingUpdates);
        stats.tournamentsEnriched += flushed;
        pendingUpdates.length = 0;
      }
    }
    
    totalProcessed += tournaments.length;
    logger.update(totalProcessed);
    offset += PAGE_SIZE;
    if (tournaments.length < PAGE_SIZE) break;
  }
  
  if (pendingUpdates.length > 0) {
    const flushed = await flushTournamentUpdates(supabase, pendingUpdates);
    stats.tournamentsEnriched += flushed;
  }
  
  logger.endPhase();
}

async function flushTournamentUpdates(
  supabase: SupabaseAdmin,
  updates: Array<{ id: number; bracket_url: string }>
): Promise<number> {
  let count = 0;
  for (const update of updates) {
    const { error } = await supabase
      .from('tournaments')
      .update({ bracket_url: update.bracket_url })
      .eq('id', update.id);
    if (!error) count++;
  }
  return count;
}

async function validateDecklists(
  supabase: SupabaseAdmin,
  stats: EnrichmentStats,
  logger: ProgressLogger,
  incremental: boolean
): Promise<void> {
  // Get total count for progress tracking
  let countQuery = supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .not('decklist', 'is', null);
  
  if (incremental) countQuery = countQuery.is('decklist_valid', null);
  
  const { count: totalCount, error: countError } = await countQuery;
  if (countError) throw countError;
  
  logger.startPhase('Validate Decklists', totalCount ?? 0);
  logger.log(`Using ${VALIDATION_CONCURRENCY} parallel requests`);
  
  const pendingUpdates: Array<{ id: number; decklist_valid: boolean }> = [];
  let offset = 0;
  let totalProcessed = 0;
  
  while (true) {
    let query = supabase
      .from('entries')
      .select('id, decklist')
      .not('decklist', 'is', null)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (incremental) query = query.is('decklist_valid', null);
    
    const { data, error } = await query;
    if (error) throw error;
    
    const entries = data as DbEntry[] | null;
    if (!entries || entries.length === 0) break;
    
    // Process in parallel chunks
    for (let i = 0; i < entries.length; i += VALIDATION_CONCURRENCY) {
      const chunk = entries.slice(i, i + VALIDATION_CONCURRENCY);
      
      const results = await Promise.allSettled(
        chunk.map(async (entry) => {
          if (!entry.decklist) return { id: entry.id, skipped: true };
          
          try {
            const result = await validateDecklistWithRetry(entry.decklist);
            return { id: entry.id, valid: result?.valid ?? null, skipped: false };
          } catch {
            return { id: entry.id, valid: null, skipped: false };
          }
        })
      );
      
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { id, valid, skipped } = result.value;
          
          if (skipped) {
            stats.decklistsSkipped++;
          } else {
            stats.decklistsValidated++;
            if (valid === true) {
              stats.decklistsValid++;
              pendingUpdates.push({ id, decklist_valid: true });
            } else if (valid === false) {
              stats.decklistsInvalid++;
              pendingUpdates.push({ id, decklist_valid: false });
            }
          }
        }
      }
      
      // Flush batch when full
      if (pendingUpdates.length >= UPDATE_BATCH_SIZE) {
        await flushValidationUpdates(supabase, pendingUpdates);
        pendingUpdates.length = 0;
      }
      
      totalProcessed += chunk.length;
      logger.update(totalProcessed);
      
      await new Promise(resolve => setTimeout(resolve, VALIDATION_DELAY_MS));
    }
    
    offset += PAGE_SIZE;
    if (entries.length < PAGE_SIZE) break;
  }
  
  // Flush remaining
  if (pendingUpdates.length > 0) {
    await flushValidationUpdates(supabase, pendingUpdates);
  }
  
  logger.endPhase();
}

async function flushValidationUpdates(
  supabase: SupabaseAdmin,
  updates: Array<{ id: number; decklist_valid: boolean }>
): Promise<void> {
  for (const update of updates) {
    await supabase
      .from('entries')
      .update({ decklist_valid: update.decklist_valid })
      .eq('id', update.id);
  }
}

// ============================================
// Main Enrichment Function
// ============================================

export interface EnrichOptions {
  incremental?: boolean;
  skipValidation?: boolean;
  logger?: ProgressLogger;
}

export async function enrichData(
  supabase: SupabaseAdmin,
  options: EnrichOptions = {}
): Promise<EnrichmentStats> {
  const {
    incremental = true,
    skipValidation = false,
    logger = createProgressLogger(),
  } = options;
  
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
  
  const startTime = Date.now();
  
  logger.log(`════════════════════════════════════════════════════════════════════════`);
  logger.log(`ENRICHMENT JOB STARTED`);
  logger.log(`Mode: ${incremental ? 'incremental' : 'full'}`);
  logger.log(`Skip validation: ${skipValidation}`);
  logger.log(`════════════════════════════════════════════════════════════════════════`);
  logger.logMemory();
  
  // Load Scryfall data
  const scryfallCards = await loadScryfallData(logger);
  
  // Enrich each table
  await enrichCards(supabase, scryfallCards, stats, logger, incremental);
  await enrichCommanders(supabase, scryfallCards, stats, logger, incremental);
  await enrichTournaments(supabase, stats, logger, incremental);
  
  if (!skipValidation) {
    await validateDecklists(supabase, stats, logger, incremental);
  } else {
    logger.log('Skipping decklist validation');
  }
  
  // Final summary
  const totalDuration = Date.now() - startTime;
  logger.log(`════════════════════════════════════════════════════════════════════════`);
  logger.log(`🎉 ENRICHMENT JOB COMPLETE`);
  logger.log(`════════════════════════════════════════════════════════════════════════`);
  logger.log(`Duration: ${Math.round(totalDuration / 1000)}s`);
  logger.log(`Cards: ${stats.cardsEnriched.toLocaleString()} enriched, ${stats.cardsNotFound.toLocaleString()} not found`);
  logger.log(`Commanders: ${stats.commandersEnriched.toLocaleString()} enriched`);
  logger.log(`Tournaments: ${stats.tournamentsEnriched.toLocaleString()} enriched`);
  if (!skipValidation) {
    logger.log(`Decklists: ${stats.decklistsValid.toLocaleString()} valid, ${stats.decklistsInvalid.toLocaleString()} invalid`);
  }
  logger.logMemory();
  logger.log(`════════════════════════════════════════════════════════════════════════`);
  
  return stats;
}

export async function enrichDataFull(
  supabase: SupabaseAdmin,
  logger?: ProgressLogger
): Promise<EnrichmentStats> {
  const log = logger ?? createProgressLogger();
  
  log.log('Clearing previously enriched data...');
  
  await supabase.from('cards').update({
    type_line: null,
    mana_cost: null,
    cmc: null,
    scryfall_data: null,
  }).neq('id', 0);
  
  await supabase.from('commanders').update({ color_id: '' }).neq('id', 0);
  await supabase.from('tournaments').update({ bracket_url: null }).neq('id', 0);
  await supabase.from('entries').update({ decklist_valid: null }).neq('id', 0);
  
  log.log('All enriched data cleared');
  
  return enrichData(supabase, { incremental: false, logger: log });
}


