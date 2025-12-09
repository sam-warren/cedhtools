/**
 * Data Enrichment Job
 * 
 * Enriches data with additional metadata and validation.
 * Supports incremental mode - only processes records missing enrichment data.
 * 
 * Pipeline: sync -> enrich (this) -> aggregate
 */

import {
  type SupabaseAdmin,
  type EnrichmentStats,
  type ProgressLogger,
  createProgressLogger,
  PAGE_SIZE,
  BATCH_SIZE,
} from './utils';
import { validateDecklistWithRetry } from '../api/scrollrack';

// ============================================
// Configuration
// ============================================

const SCRYFALL_BULK_DATA_URL = 'https://api.scryfall.com/bulk-data';
const VALIDATION_CONCURRENCY = 10;
const VALIDATION_DELAY_MS = 20;

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

// ============================================
// Helper Functions
// ============================================

/**
 * Extract mana_cost from a Scryfall card, handling multi-faced cards.
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

/**
 * Load Scryfall card data from their bulk API.
 * Returns a map of oracle_id -> card data and name -> card data.
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
  
  logger.log('Downloading oracle_cards from Scryfall...');
  const downloadResponse = await fetch(oracleCardsEntry.download_uri, {
    headers: { 'Accept': '*/*', 'User-Agent': 'cedhtools/1.0' },
  });
  
  if (!downloadResponse.ok) {
    throw new Error(`Failed to download Scryfall data: ${downloadResponse.status}`);
  }
  
  const cards: ScryfallCard[] = await downloadResponse.json();
  
  const cardByOracleId = new Map<string, ScryfallCard>() as Map<string, ScryfallCard> & { byName: Map<string, ScryfallCard> };
  const cardByName = new Map<string, ScryfallCard>();
  
  for (const card of cards) {
    cardByOracleId.set(card.oracle_id, card);
    cardByName.set(card.name.toLowerCase(), card);
    
    if (card.name.includes(' // ')) {
      const frontFace = card.name.split(' // ')[0].toLowerCase();
      if (!cardByName.has(frontFace)) {
        cardByName.set(frontFace, card);
      }
    }
  }
  
  cardByOracleId.byName = cardByName;
  logger.log(`Loaded ${cardByOracleId.size} unique cards from Scryfall`);
  
  return cardByOracleId;
}

// ============================================
// Enrichment Functions
// ============================================

/**
 * Enrich cards with Scryfall data.
 * In incremental mode, only processes cards with null scryfall_data.
 */
async function enrichCards(
  supabase: SupabaseAdmin,
  scryfallCards: Map<string, ScryfallCard> & { byName: Map<string, ScryfallCard> },
  stats: EnrichmentStats,
  logger: ProgressLogger,
  incremental: boolean
): Promise<void> {
  logger.log('Enriching cards table...');
  
  // Build query based on mode
  let query = supabase
    .from('cards')
    .select('id, name, oracle_id');
  
  if (incremental) {
    query = query.is('scryfall_data', null);
  }
  
  // Get count for progress
  const countQuery = supabase.from('cards').select('id', { count: 'exact', head: true });
  if (incremental) {
    countQuery.is('scryfall_data', null);
  }
  const { count: totalCount } = await countQuery;
  
  logger.startPhase('Enriching cards', totalCount ?? 0);
  
  const cards: DbCard[] = [];
  let offset = 0;
  
  while (true) {
    let fetchQuery = supabase
      .from('cards')
      .select('id, name, oracle_id')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (incremental) {
      fetchQuery = fetchQuery.is('scryfall_data', null);
    }
    
    const { data, error } = await fetchQuery;
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    cards.push(...(data as DbCard[]));
    offset += PAGE_SIZE;
    
    if (data.length < PAGE_SIZE) break;
  }
  
  const byName = scryfallCards.byName;
  
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
    
    logger.update(Math.min(i + BATCH_SIZE, cards.length));
  }
  
  logger.endPhase();
}

/**
 * Enrich commanders with color identity.
 * In incremental mode, only processes commanders with empty color_id.
 */
async function enrichCommanders(
  supabase: SupabaseAdmin,
  scryfallCards: Map<string, ScryfallCard> & { byName: Map<string, ScryfallCard> },
  stats: EnrichmentStats,
  logger: ProgressLogger,
  incremental: boolean
): Promise<void> {
  logger.log('Enriching commanders table...');
  
  const commanders: DbCommander[] = [];
  let offset = 0;
  
  while (true) {
    let query = supabase
      .from('commanders')
      .select('id, name')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (incremental) {
      query = query.eq('color_id', '');
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    commanders.push(...(data as DbCommander[]));
    offset += PAGE_SIZE;
    
    if (data.length < PAGE_SIZE) break;
  }
  
  logger.log(`Found ${commanders.length} commanders to enrich`);
  
  const byName = scryfallCards.byName;
  
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
  
  logger.log(`Enriched ${stats.commandersEnriched} commanders with color identity`);
}

/**
 * Enrich tournaments with bracket URLs.
 * In incremental mode, only processes tournaments with null bracket_url.
 */
async function enrichTournaments(
  supabase: SupabaseAdmin,
  stats: EnrichmentStats,
  logger: ProgressLogger,
  incremental: boolean
): Promise<void> {
  logger.log('Enriching tournaments table...');
  
  const tournaments: DbTournament[] = [];
  let offset = 0;
  
  while (true) {
    let query = supabase
      .from('tournaments')
      .select('id, tid')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (incremental) {
      query = query.is('bracket_url', null);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    tournaments.push(...(data as DbTournament[]));
    offset += PAGE_SIZE;
    
    if (data.length < PAGE_SIZE) break;
  }
  
  logger.log(`Found ${tournaments.length} tournaments to update`);
  
  for (const tournament of tournaments) {
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({ bracket_url: `https://topdeck.gg/bracket/${tournament.tid}` })
      .eq('id', tournament.id);
    
    if (!updateError) {
      stats.tournamentsEnriched++;
    }
  }
  
  logger.log(`Updated ${stats.tournamentsEnriched} tournaments with bracket_url`);
}

/**
 * Validate decklists via Scrollrack API.
 * In incremental mode, only processes entries with null decklist_valid.
 */
async function validateDecklists(
  supabase: SupabaseAdmin,
  stats: EnrichmentStats,
  logger: ProgressLogger,
  incremental: boolean
): Promise<void> {
  logger.log('Validating decklists via Scrollrack API...');
  logger.log(`Using ${VALIDATION_CONCURRENCY} parallel requests`);
  
  // Get total count for progress tracking
  let countQuery = supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .not('decklist', 'is', null);
  
  if (incremental) {
    countQuery = countQuery.is('decklist_valid', null);
  }
  
  const { count: totalCount, error: countError } = await countQuery;
  if (countError) throw countError;
  
  const totalEntries = totalCount ?? 0;
  logger.startPhase('Validating decklists', totalEntries);
  
  let offset = 0;
  
  while (true) {
    let query = supabase
      .from('entries')
      .select('id, decklist')
      .not('decklist', 'is', null)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (incremental) {
      query = query.is('decklist_valid', null);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    const entries = data as DbEntry[] | null;
    if (!entries || entries.length === 0) break;
    
    // Process in parallel chunks
    for (let i = 0; i < entries.length; i += VALIDATION_CONCURRENCY) {
      const chunk = entries.slice(i, i + VALIDATION_CONCURRENCY);
      
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
          }
        }
      }
      
      logger.increment(chunk.length);
      
      // Small delay between parallel batches
      await new Promise(resolve => setTimeout(resolve, VALIDATION_DELAY_MS));
    }
    
    offset += PAGE_SIZE;
    if (entries.length < PAGE_SIZE) break;
  }
  
  logger.endPhase();
}

// ============================================
// Main Enrichment Function
// ============================================

export interface EnrichOptions {
  /** Enable incremental mode (only process un-enriched records) */
  incremental?: boolean;
  /** Skip decklist validation (useful for faster runs) */
  skipValidation?: boolean;
  /** Custom progress logger */
  logger?: ProgressLogger;
}

/**
 * Enrich database records with Scryfall data and validate decklists.
 */
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
  
  logger.log(`Enrichment mode: ${incremental ? 'incremental' : 'full'}`);
  
  // Load Scryfall data
  const scryfallCards = await loadScryfallData(logger);
  
  // Enrich cards
  await enrichCards(supabase, scryfallCards, stats, logger, incremental);
  
  // Enrich commanders
  await enrichCommanders(supabase, scryfallCards, stats, logger, incremental);
  
  // Enrich tournaments
  await enrichTournaments(supabase, stats, logger, incremental);
  
  // Validate decklists
  if (!skipValidation) {
    await validateDecklists(supabase, stats, logger, incremental);
  } else {
    logger.log('Skipping decklist validation');
  }
  
  return stats;
}

/**
 * Full enrichment with clearing existing data (for re-seeding).
 */
export async function enrichDataFull(
  supabase: SupabaseAdmin,
  logger?: ProgressLogger
): Promise<EnrichmentStats> {
  const log = logger ?? createProgressLogger();
  
  log.log('Clearing previously enriched data...');
  
  // Clear cards enrichment data
  await supabase
    .from('cards')
    .update({
      type_line: null,
      mana_cost: null,
      cmc: null,
      scryfall_data: null,
    })
    .neq('id', 0);
  
  // Clear commanders color_id
  await supabase
    .from('commanders')
    .update({ color_id: '' })
    .neq('id', 0);
  
  // Clear tournaments bracket_url
  await supabase
    .from('tournaments')
    .update({ bracket_url: null })
    .neq('id', 0);
  
  // Clear entries decklist_valid
  await supabase
    .from('entries')
    .update({ decklist_valid: null })
    .neq('id', 0);
  
  log.log('All enriched data cleared');
  
  return enrichData(supabase, { incremental: false, logger: log });
}

