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
  getFrontFaceName,
  PAGE_SIZE
} from './utils';

// ============================================
// Configuration
// ============================================

const SCRYFALL_BULK_DATA_URL = 'https://api.scryfall.com/bulk-data';
const VALIDATION_CONCURRENCY = 200; // No rate limits on Scrollrack API - go wide
const VALIDATION_DELAY_MS = 0; // No delay needed
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
  keywords?: string[];
  oracle_text?: string;
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

/**
 * Helper to check if a keywords array contains a keyword (case-insensitive)
 */
function hasKeyword(keywords: string[], keyword: string): boolean {
  const lowerKeyword = keyword.toLowerCase();
  return keywords.some(kw => kw.toLowerCase() === lowerKeyword);
}

/**
 * Check if a commander pairing is legal under MTG rules.
 * 
 * Legal configurations:
 * - Single commander (always legal if it's a valid commander card)
 * - Two commanders with generic "Partner" keyword
 * - Two commanders that "Partner with" each other specifically
 * - A commander with "Choose a Background" keyword + a Background enchantment
 * - Two commanders with "Friends forever" (Stranger Things/Doctor Who)
 * - A Time Lord Doctor + a creature with "Doctor's companion"
 * 
 * Scryfall keyword casing (for reference):
 * - "Partner" / "Partner with" 
 * - "Choose a background" (lowercase 'b')
 * - "Friends forever" (lowercase 'f')
 * - "Doctor's companion" (lowercase 'c')
 * 
 * @param names Array of commander names (split by " / ")
 * @param scryfallByName Map of lowercase card name to ScryfallCard
 * @returns true if the pairing is legal, false otherwise
 */
function isLegalCommanderPairing(
  names: string[],
  scryfallByName: Map<string, ScryfallCard>
): boolean {
  // Single commander is always legal
  if (names.length === 1) return true;
  
  // Only 1 or 2 commanders are allowed
  if (names.length !== 2) return false;
  
  const card1 = scryfallByName.get(names[0].toLowerCase().trim());
  const card2 = scryfallByName.get(names[1].toLowerCase().trim());
  
  // If we can't find both cards in Scryfall data, assume legal (might be new cards)
  if (!card1 || !card2) return true;
  
  const kw1 = card1.keywords || [];
  const kw2 = card2.keywords || [];
  const type1 = card1.type_line || '';
  const type2 = card2.type_line || '';
  const oracle1 = card1.oracle_text || '';
  const oracle2 = card2.oracle_text || '';
  
  // Check for "Partner with" - these can ONLY pair with their specific named partner
  // Note: "Partner with" cards also have "Partner" in keywords, so check this FIRST
  const hasPartnerWith1 = hasKeyword(kw1, 'Partner with');
  const hasPartnerWith2 = hasKeyword(kw2, 'Partner with');
  
  if (hasPartnerWith1 || hasPartnerWith2) {
    // Both must have "Partner with" and name each other in their oracle text
    if (hasPartnerWith1 && hasPartnerWith2) {
      const names1Other = oracle1.toLowerCase().includes(card2.name.toLowerCase());
      const names2Other = oracle2.toLowerCase().includes(card1.name.toLowerCase());
      if (names1Other && names2Other) return true;
    }
    // If only one has "Partner with", it's not a valid pairing
    // (Partner with X cannot pair with generic Partner)
    return false;
  }
  
  // Both have generic Partner keyword (and neither has "Partner with")
  if (hasKeyword(kw1, 'Partner') && hasKeyword(kw2, 'Partner')) return true;
  
  // Choose a Background + Background enchantment
  // Scryfall uses "Choose a background" as a keyword (lowercase 'b')
  const hasChooseBackground1 = hasKeyword(kw1, 'Choose a background');
  const hasChooseBackground2 = hasKeyword(kw2, 'Choose a background');
  const isBackground1 = type1.toLowerCase().includes('background');
  const isBackground2 = type2.toLowerCase().includes('background');
  
  if ((hasChooseBackground1 && isBackground2) || (hasChooseBackground2 && isBackground1)) return true;
  
  // Friends forever (Stranger Things / Doctor Who crossover cards)
  if (hasKeyword(kw1, 'Friends forever') && hasKeyword(kw2, 'Friends forever')) return true;
  
  // Doctor's companion - pairs with Time Lord Doctor
  const isDoctor1 = type1.toLowerCase().includes('time lord doctor');
  const isDoctor2 = type2.toLowerCase().includes('time lord doctor');
  const hasCompanion1 = hasKeyword(kw1, "Doctor's companion");
  const hasCompanion2 = hasKeyword(kw2, "Doctor's companion");
  
  if ((isDoctor1 && hasCompanion2) || (isDoctor2 && hasCompanion1)) return true;
  
  // No valid pairing mechanism found
  return false;
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
  keywords?: string[];
  oracle_text?: string;
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
        keywords: raw.keywords,
        oracle_text: raw.oracle_text,
      };
      
      cardByOracleId.set(card.oracle_id, card);
      cardByName.set(card.name.toLowerCase(), card);
      
      // Also index by front face for DFC lookup
      const frontFace = getFrontFaceName(card.name).toLowerCase();
      if (frontFace !== card.name.toLowerCase() && !cardByName.has(frontFace)) {
        cardByName.set(frontFace, card);
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
  logger.log(`Mode: ${incremental ? 'incremental (unenriched only)' : 'full rebuild'}`);
  logger.log(`Scryfall data: ${logger.formatNumber(scryfallCards.size)} cards by oracle_id, ${logger.formatNumber(scryfallCards.byName.size)} by name`);
  
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
  let batchNum = 0;
  let totalFlushed = 0;
  const byName = scryfallCards.byName;
  
  while (true) {
    const batchStartTime = Date.now();
    batchNum++;
    
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
    logger.logBatchStart(batchNum, cards.length, 'cards');
    
    let batchMatched = 0;
    let batchNotFound = 0;
    
    for (const card of cards) {
      let scryfallCard = card.oracle_id ? scryfallCards.get(card.oracle_id) : undefined;
      if (!scryfallCard) scryfallCard = byName?.get(card.name.toLowerCase());
      
      if (!scryfallCard) {
        stats.cardsNotFound++;
        batchNotFound++;
        continue;
      }
      
      batchMatched++;
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
        const flushStart = Date.now();
        const flushed = await flushCardUpdates(supabase, pendingUpdates);
        stats.cardsEnriched += flushed;
        totalFlushed += flushed;
        logger.debug(`Flushed ${flushed} card updates to DB (${Date.now() - flushStart}ms)`);
        pendingUpdates.length = 0;
      }
    }
    
    totalProcessed += cards.length;
    logger.update(totalProcessed);
    logger.logBatchComplete(batchNum, totalProcessed, totalCount ?? 0, Date.now() - batchStartTime);
    logger.debug(`Batch ${batchNum}: ${batchMatched} matched, ${batchNotFound} not found in Scryfall`);
    
    // Check for cancellation between batches
    await logger.checkCancelled();
    
    // In incremental mode, don't increment offset - updated records drop out of the filter
    if (!incremental) {
      offset += PAGE_SIZE;
    }
    if (cards.length < PAGE_SIZE) break;
  }
  
  // Flush remaining
  if (pendingUpdates.length > 0) {
    logger.debug(`Flushing final ${pendingUpdates.length} card updates...`);
    const flushed = await flushCardUpdates(supabase, pendingUpdates);
    stats.cardsEnriched += flushed;
    totalFlushed += flushed;
  }
  
  logger.log(`Total enriched: ${logger.formatNumber(totalFlushed)} cards, ${logger.formatNumber(stats.cardsNotFound)} not found`);
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
  if (incremental) countQuery = countQuery.or('color_id.eq.,is_legal.is.null');
  const { count: totalCount } = await countQuery;
  
  logger.startPhase('Enrich Commanders', totalCount ?? 0);
  logger.log(`Mode: ${incremental ? 'incremental (unenriched or missing legality)' : 'full rebuild'}`);
  
  const pendingUpdates: Array<{ id: number; color_id: string; is_legal: boolean }> = [];
  let offset = 0;
  let totalProcessed = 0;
  let batchNum = 0;
  let totalFlushed = 0;
  const byName = scryfallCards.byName;
  
  // Track color identity distribution for stats
  const colorIdCounts: Record<string, number> = {};
  
  // Track legal/illegal commander counts
  let legalCount = 0;
  let illegalCount = 0;
  const illegalCommanders: string[] = [];
  
  while (true) {
    const batchStartTime = Date.now();
    batchNum++;
    
    let query = supabase
      .from('commanders')
      .select('id, name')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    
    // In incremental mode, process commanders that either:
    // - Haven't been enriched yet (color_id = '')
    // - Haven't had legality checked yet (is_legal IS NULL)
    if (incremental) query = query.or('color_id.eq.,is_legal.is.null');
    
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    const commanders = data as DbCommander[];
    logger.logBatchStart(batchNum, commanders.length, 'commanders');
    
    let batchPartners = 0;
    let batchSolo = 0;
    
    for (const commander of commanders) {
      const commanderNames = commander.name.split(' / ');
      const combinedColorIdentity: string[] = [];
      
      if (commanderNames.length > 1) {
        batchPartners++;
      } else {
        batchSolo++;
      }
      
      for (const name of commanderNames) {
        const scryfallCard = byName?.get(name.toLowerCase().trim());
        if (scryfallCard?.color_identity) {
          combinedColorIdentity.push(...scryfallCard.color_identity);
        }
      }
      
      const colorId = wubrgify([...new Set(combinedColorIdentity)]);
      colorIdCounts[colorId] = (colorIdCounts[colorId] || 0) + 1;
      
      // Check if this commander pairing is legal under MTG rules
      const isLegal = byName ? isLegalCommanderPairing(commanderNames, byName) : true;
      
      if (isLegal) {
        legalCount++;
      } else {
        illegalCount++;
        // Track first 10 illegal commanders for logging
        if (illegalCommanders.length < 10) {
          illegalCommanders.push(commander.name);
        }
      }
      
      pendingUpdates.push({
        id: commander.id,
        color_id: colorId,
        is_legal: isLegal,
      });
      
      if (pendingUpdates.length >= UPDATE_BATCH_SIZE) {
        const flushStart = Date.now();
        const flushed = await flushCommanderUpdates(supabase, pendingUpdates);
        stats.commandersEnriched += flushed;
        totalFlushed += flushed;
        logger.debug(`Flushed ${flushed} commander updates to DB (${Date.now() - flushStart}ms)`);
        pendingUpdates.length = 0;
      }
    }
    
    totalProcessed += commanders.length;
    logger.update(totalProcessed);
    logger.logBatchComplete(batchNum, totalProcessed, totalCount ?? 0, Date.now() - batchStartTime);
    logger.debug(`Batch ${batchNum}: ${batchSolo} solo commanders, ${batchPartners} partner pairs`);
    
    // Check for cancellation between batches
    await logger.checkCancelled();
    
    // In incremental mode, don't increment offset - updated records drop out of the filter
    if (!incremental) {
      offset += PAGE_SIZE;
    }
    if (commanders.length < PAGE_SIZE) break;
  }
  
  if (pendingUpdates.length > 0) {
    logger.debug(`Flushing final ${pendingUpdates.length} commander updates...`);
    const flushed = await flushCommanderUpdates(supabase, pendingUpdates);
    stats.commandersEnriched += flushed;
    totalFlushed += flushed;
  }
  
  // Log color identity distribution
  const topColors = Object.entries(colorIdCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([color, count]) => `${color}: ${count}`)
    .join(', ');
  logger.log(`Total enriched: ${logger.formatNumber(totalFlushed)} commanders`);
  logger.log(`Top color identities: ${topColors}`);
  
  // Log legality stats
  logger.log(`Commander legality: ${logger.formatNumber(legalCount)} legal, ${logger.formatNumber(illegalCount)} illegal`);
  if (illegalCommanders.length > 0) {
    logger.log(`Sample illegal commanders: ${illegalCommanders.slice(0, 5).join(', ')}${illegalCommanders.length > 5 ? '...' : ''}`);
  }
  
  logger.endPhase();
}

async function flushCommanderUpdates(
  supabase: SupabaseAdmin,
  updates: Array<{ id: number; color_id: string; is_legal: boolean }>
): Promise<number> {
  let count = 0;
  for (const update of updates) {
    const { error } = await supabase
      .from('commanders')
      .update({ color_id: update.color_id, is_legal: update.is_legal })
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
  logger.log(`Mode: ${incremental ? 'incremental (unenriched only)' : 'full rebuild'}`);
  logger.log(`Adding bracket URLs to tournaments...`);
  
  const pendingUpdates: Array<{ id: number; bracket_url: string }> = [];
  let offset = 0;
  let totalProcessed = 0;
  let batchNum = 0;
  let totalFlushed = 0;
  
  while (true) {
    const batchStartTime = Date.now();
    batchNum++;
    
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
    logger.logBatchStart(batchNum, tournaments.length, 'tournaments');
    
    for (const tournament of tournaments) {
      pendingUpdates.push({
        id: tournament.id,
        bracket_url: `https://topdeck.gg/bracket/${tournament.tid}`,
      });
      
      if (pendingUpdates.length >= UPDATE_BATCH_SIZE) {
        const flushStart = Date.now();
        const flushed = await flushTournamentUpdates(supabase, pendingUpdates);
        stats.tournamentsEnriched += flushed;
        totalFlushed += flushed;
        logger.debug(`Flushed ${flushed} tournament updates to DB (${Date.now() - flushStart}ms)`);
        pendingUpdates.length = 0;
      }
    }
    
    totalProcessed += tournaments.length;
    logger.update(totalProcessed);
    logger.logBatchComplete(batchNum, totalProcessed, totalCount ?? 0, Date.now() - batchStartTime);
    
    // Check for cancellation between batches
    await logger.checkCancelled();
    
    // In incremental mode, don't increment offset - updated records drop out of the filter
    // In full mode, increment offset to paginate through all records
    if (!incremental) {
      offset += PAGE_SIZE;
    }
    if (tournaments.length < PAGE_SIZE) break;
  }
  
  if (pendingUpdates.length > 0) {
    logger.debug(`Flushing final ${pendingUpdates.length} tournament updates...`);
    const flushed = await flushTournamentUpdates(supabase, pendingUpdates);
    stats.tournamentsEnriched += flushed;
    totalFlushed += flushed;
  }
  
  logger.log(`Total enriched: ${logger.formatNumber(totalFlushed)} tournaments with bracket URLs`);
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
  logger.log(`Mode: ${incremental ? 'incremental (unvalidated only)' : 'full rebuild'}`);
  logger.log(`Concurrency: ${VALIDATION_CONCURRENCY} parallel requests`);
  
  const pendingUpdates: Array<{ id: number; decklist_valid: boolean }> = [];
  let offset = 0;
  let totalProcessed = 0;
  let batchNum = 0;
  let chunkNum = 0;
  let totalFlushed = 0;
  
  // Track validation results for summary
  let totalApiCalls = 0;
  let totalApiErrors = 0;
  let lastProgressTime = Date.now();
  
  while (true) {
    const batchStartTime = Date.now();
    batchNum++;
    
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
    
    logger.logBatchStart(batchNum, entries.length, 'decklists');
    
    let batchValid = 0;
    let batchInvalid = 0;
    let batchSkipped = 0;
    let batchErrors = 0;
    
    // Process in parallel chunks
    for (let i = 0; i < entries.length; i += VALIDATION_CONCURRENCY) {
      const chunk = entries.slice(i, i + VALIDATION_CONCURRENCY);
      chunkNum++;
      const chunkStart = Date.now();
      
      const results = await Promise.allSettled(
        chunk.map(async (entry) => {
          if (!entry.decklist) return { id: entry.id, skipped: true };
          
          try {
            totalApiCalls++;
            const result = await validateDecklistWithRetry(entry.decklist);
            return { id: entry.id, valid: result?.valid ?? null, skipped: false };
          } catch {
            totalApiErrors++;
            return { id: entry.id, valid: null, skipped: false, error: true };
          }
        })
      );
      
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { id, valid, skipped } = result.value;
          
          if (skipped) {
            stats.decklistsSkipped++;
            batchSkipped++;
          } else {
            stats.decklistsValidated++;
            if (valid === true) {
              stats.decklistsValid++;
              batchValid++;
              pendingUpdates.push({ id, decklist_valid: true });
            } else if (valid === false) {
              stats.decklistsInvalid++;
              batchInvalid++;
              pendingUpdates.push({ id, decklist_valid: false });
            } else {
              batchErrors++;
            }
          }
        } else {
          batchErrors++;
        }
      }
      
      // Flush batch when full
      if (pendingUpdates.length >= UPDATE_BATCH_SIZE) {
        const flushStart = Date.now();
        await flushValidationUpdates(supabase, pendingUpdates);
        totalFlushed += pendingUpdates.length;
        logger.debug(`Flushed ${pendingUpdates.length} validation updates to DB (${Date.now() - flushStart}ms)`);
        pendingUpdates.length = 0;
      }
      
      totalProcessed += chunk.length;
      logger.update(totalProcessed);
      
      // Log detailed chunk progress every 30 seconds
      const now = Date.now();
      if (now - lastProgressTime >= 30000) {
        const chunkRate = chunk.length / ((now - chunkStart) / 1000);
        logger.debug(`Chunk ${chunkNum}: ${chunk.length} validated at ${chunkRate.toFixed(1)}/s | API calls: ${totalApiCalls}, errors: ${totalApiErrors}`);
        lastProgressTime = now;
      }
      
      // No delay needed - Scrollrack API has no rate limits
    }
    
    logger.logBatchComplete(batchNum, totalProcessed, totalCount ?? 0, Date.now() - batchStartTime);
    logger.debug(`Batch ${batchNum} results: ${batchValid} valid, ${batchInvalid} invalid, ${batchSkipped} skipped, ${batchErrors} errors`);
    
    // Check for cancellation between batches
    await logger.checkCancelled();
    
    // In incremental mode, don't increment offset - updated records drop out of the filter
    if (!incremental) {
      offset += PAGE_SIZE;
    }
    if (entries.length < PAGE_SIZE) break;
  }
  
  // Flush remaining
  if (pendingUpdates.length > 0) {
    logger.debug(`Flushing final ${pendingUpdates.length} validation updates...`);
    await flushValidationUpdates(supabase, pendingUpdates);
    totalFlushed += pendingUpdates.length;
  }
  
  // Summary statistics
  const validRate = stats.decklistsValidated > 0 
    ? ((stats.decklistsValid / stats.decklistsValidated) * 100).toFixed(1) 
    : '0';
  logger.log(`Validation complete:`);
  logger.log(`  Total validated: ${logger.formatNumber(stats.decklistsValidated)}`);
  logger.log(`  Valid: ${logger.formatNumber(stats.decklistsValid)} (${validRate}%)`);
  logger.log(`  Invalid: ${logger.formatNumber(stats.decklistsInvalid)}`);
  logger.log(`  Skipped: ${logger.formatNumber(stats.decklistsSkipped)}`);
  logger.log(`  API calls: ${logger.formatNumber(totalApiCalls)}, errors: ${totalApiErrors}`);
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
  
  await supabase.from('commanders').update({ color_id: '', is_legal: null }).neq('id', 0);
  await supabase.from('tournaments').update({ bracket_url: null }).neq('id', 0);
  await supabase.from('entries').update({ decklist_valid: null }).neq('id', 0);
  
  log.log('All enriched data cleared');
  
  return enrichData(supabase, { incremental: false, logger: log });
}


