/**
 * ETL Processor
 * 
 * This module is responsible for extracting tournament data from Topdeck
 * and aggregating statistics into the Supabase database.
 * 
 * ## Architecture Overview
 * 
 * The ETL process follows this flow:
 * 1. **Extract**: Fetch tournaments from Topdeck API for a date range
 * 2. **Filter**: Identify standings with valid deckObj (Scrollrack data)
 * 3. **Transform**: Extract commanders, cards, and calculate statistics
 * 4. **Load**: Upsert aggregated data into Supabase tables
 * 
 * ## Data Source
 * 
 * As of 2024, Topdeck provides deck data directly via their Scrollrack
 * integration. The `deckObj` field on each standing contains:
 * - Commanders with Scryfall UUIDs
 * - Mainboard cards with Scryfall UUIDs
 * 
 * This eliminates the need for separate Moxfield API calls.
 * 
 * ## Processing Modes
 * 
 * - **Full Processing** (`processData`): Processes all data in weekly batches.
 *   Suitable for initial seeding or catching up on large date ranges.
 * 
 * - **Batch Processing** (`processBatch`): Processes data in smaller chunks
 *   with cursor support. Designed for serverless environments with time limits.
 * 
 * ## Data Model
 * 
 * - **Commanders**: Identified by Scryfall UUID (single) or sorted concatenation
 *   of UUIDs for partner pairs (e.g., "uuid1_uuid2").
 * 
 * - **Cards**: Identified by Scryfall UUID.
 * 
 * - **Statistics**: Per-commander, per-card performance metrics including
 *   wins, losses, draws, and entry counts.
 * 
 * @module EtlProcessor
 */

import { addDays, format, parseISO, subDays, subMonths } from 'date-fns';
import { supabaseServiceRole } from '../supabase';
import { TopdeckClient } from './api-clients';
import {
    EtlStatus,
    Tournament,
    TournamentStanding,
    TopdeckDeckObj,
} from './types';
import {
    DEFAULT_BATCH_SIZE,
    DEFAULT_CONCURRENCY_LIMIT,
    DEFAULT_LOOKBACK_DAYS,
    DEFAULT_SEED_MONTHS,
    WEEKLY_BATCH_DAYS,
    MIN_VALID_TOURNAMENT_YEAR,
    CURSOR_DELIMITER,
    ETL_STATUS,
    type EtlStatusType,
} from './constants';
import {
    generateCommanderId,
    generateCommanderName,
} from '../utils/commander';
import { etlLogger } from '../logger';
import { EtlProcessingError } from '../errors';

/**
 * Main ETL processor class that orchestrates data extraction, transformation,
 * and loading from Topdeck API into the database.
 * 
 * @example
 * ```typescript
 * const processor = new EtlProcessor();
 * 
 * // Process all data from a date range
 * await processor.processData('2024-01-01', '2024-06-01');
 * 
 * // Or process in smaller batches with cursor support
 * let cursor = null;
 * do {
 *   const result = await processor.processBatch(cursor, 50);
 *   cursor = result.nextCursor;
 * } while (!result.isComplete);
 * ```
 */
export default class EtlProcessor {
    private topdeckClient: TopdeckClient;
    private concurrencyLimit: number;
    private logger = etlLogger.child({ module: 'processor' });

    constructor() {
        this.topdeckClient = new TopdeckClient();
        // Allow runtime configuration of concurrency via environment variable
        this.concurrencyLimit = parseInt(
            process.env.ETL_CONCURRENCY_LIMIT || String(DEFAULT_CONCURRENCY_LIMIT), 
            10
        );
    }

    /**
     * Process data in batches with cursor support for resumable processing.
     * 
     * This method is designed for environments with time constraints (e.g., serverless
     * functions with 10-60 second limits). It processes data incrementally and returns
     * a cursor that can be used to resume processing in the next invocation.
     * 
     * ## Cursor Format
     * The cursor encodes the current position: `{date}:{tournamentId}:{standingIndex}`
     * - `date`: YYYY-MM-DD format, the date being processed
     * - `tournamentId`: ID of the tournament being processed (empty if starting a new day)
     * - `standingIndex`: Index into the standings array (for mid-tournament resume)
     * 
     * ## Processing Strategy
     * 1. Process one day at a time for natural chunking
     * 2. Within a day, process tournaments sequentially
     * 3. Within a tournament, process standings up to batch size limit
     * 4. On batch limit, save cursor and return
     * 
     * @param cursor - Resume cursor from previous batch, or null to start fresh
     * @param batchSize - Maximum records to process before returning (default: 50)
     * @returns Object containing:
     *   - `nextCursor`: Cursor for next batch, or null if complete
     *   - `recordsProcessed`: Number of records processed in this batch
     *   - `isComplete`: True if all data up to today has been processed
     */
    async processBatch(
        cursor: string | null,
        batchSize: number = DEFAULT_BATCH_SIZE
    ): Promise<{ nextCursor: string | null; recordsProcessed: number; isComplete: boolean }> {
        try {
            // Create a new ETL status record to track this batch
            const etlStatusId = await this.createEtlStatus(ETL_STATUS.RUNNING);

            if (!etlStatusId) {
                throw new Error('Failed to create ETL status record');
            }

            // Parse the cursor to determine where to resume processing
            let currentDate: string;
            let currentTournamentIndex = 0;
            let tournamentIdToSkipTo: string | null = null;

            if (cursor) {
                const [date, tournamentId, indexStr] = cursor.split(CURSOR_DELIMITER);
                currentDate = date;
                tournamentIdToSkipTo = tournamentId || null;
                currentTournamentIndex = indexStr ? parseInt(indexStr, 10) : 0;
            } else {
                // No cursor provided - determine start date automatically
                const lastTournamentDate = await this.getLastProcessedTournamentDate();
                if (lastTournamentDate) {
                    currentDate = format(addDays(parseISO(lastTournamentDate), 1), 'yyyy-MM-dd');
                    this.logger.info('Using last processed tournament date', { lastTournamentDate, startingFrom: currentDate });
                } else {
                    const lastEtlStatus = await this.getLastCompletedEtlStatus();
                    currentDate = lastEtlStatus?.lastProcessedDate
                        ? format(addDays(parseISO(lastEtlStatus.lastProcessedDate), 1), 'yyyy-MM-dd')
                        : format(subDays(new Date(), DEFAULT_LOOKBACK_DAYS), 'yyyy-MM-dd');
                    this.logger.info('Using ETL status date', { startingFrom: currentDate });
                }
            }

            const endDate = format(new Date(), 'yyyy-MM-dd');
            
            let recordsProcessed = 0;
            let nextCursor: string | null = null;
            let isComplete = false;

            if (currentDate <= endDate) {
                this.logger.info('Processing batch', { date: currentDate });

                const tournaments = await this.topdeckClient.fetchTournaments(
                    currentDate,
                    currentDate
                );

                this.logger.info('Found tournaments', { date: currentDate, count: tournaments.length });

                let tournamentsToProcess = tournaments;
                
                if (tournamentIdToSkipTo) {
                    const resumeIndex = tournaments.findIndex(t => t.TID === tournamentIdToSkipTo);
                    if (resumeIndex >= 0) {
                        tournamentsToProcess = tournaments.slice(resumeIndex);
                    }
                }

                let batchComplete = true;
                
                for (let i = 0; i < tournamentsToProcess.length; i++) {
                    const tournament = tournamentsToProcess[i];
                    
                    this.logger.debug('Processing tournament', { name: tournament.tournamentName, id: tournament.TID });

                    const { data: existingTournament } = await supabaseServiceRole
                        .from('processed_tournaments')
                        .select('tournament_id, record_count')
                        .eq('tournament_id', tournament.TID)
                        .single();

                    if (existingTournament) {
                        this.logger.debug('Skipping already processed tournament', { name: tournament.tournamentName });
                        continue;
                    }

                    // Filter standings to only include those with valid deckObj
                    const validStandings = tournament.standings.filter(
                        standing => standing.deckObj !== null && 
                                   standing.deckObj.Commanders && 
                                   Object.keys(standing.deckObj.Commanders).length > 0
                    );

                    this.logger.debug('Found valid deck objects', { tournament: tournament.tournamentName, count: validStandings.length });

                    let tournamentRecordsProcessed = 0;
                    const startingIndex = (tournament.TID === tournamentIdToSkipTo) ? currentTournamentIndex : 0;

                    let standingIndex = startingIndex;
                    
                    while (standingIndex < validStandings.length) {
                        const batchEndIndex = Math.min(standingIndex + this.concurrencyLimit, validStandings.length);
                        const standingsBatch = validStandings.slice(standingIndex, batchEndIndex);

                        for (const standing of standingsBatch) {
                            try {
                                await this.processStanding(standing);
                                recordsProcessed++;
                                tournamentRecordsProcessed++;
                                
                                if (recordsProcessed >= batchSize) {
                                    nextCursor = `${currentDate}:${tournament.TID}:${standingIndex + 1}`;
                                    batchComplete = false;
                                    break;
                                }
                            } catch (error) {
                                this.logger.logError('Error processing standing, skipping', error);
                            }
                        }

                        if (!batchComplete) {
                            break;
                        }

                        standingIndex = batchEndIndex;
                    }

                    if (batchComplete && tournamentRecordsProcessed > 0) {
                        const tournamentDate = typeof tournament.startDate === 'string' 
                            ? new Date(parseInt(tournament.startDate) * 1000).toISOString()
                            : new Date(tournament.startDate * 1000).toISOString();
                        
                        await supabaseServiceRole
                            .from('processed_tournaments')
                            .insert({
                                tournament_id: tournament.TID,
                                tournament_date: tournamentDate,
                                name: tournament.tournamentName,
                                record_count: tournamentRecordsProcessed,
                                processed_at: new Date().toISOString()
                            });

                        this.logger.info('Marked tournament as processed', { 
                            tournament: tournament.tournamentName, 
                            records: tournamentRecordsProcessed 
                        });
                    }
                    
                    if (!batchComplete) {
                        break;
                    }
                }

                if (batchComplete) {
                    const nextDate = format(addDays(parseISO(currentDate), 1), 'yyyy-MM-dd');
                    
                    if (nextDate <= endDate) {
                        nextCursor = `${nextDate}::`;
                    } else {
                        isComplete = true;
                    }
                }
            } else {
                isComplete = true;
            }

            let lastProcessedDate = currentDate;
            if (recordsProcessed > 0) {
                const actualLastDate = await this.getLastProcessedTournamentDate();
                if (actualLastDate) {
                    lastProcessedDate = actualLastDate;
                }
            }

            await this.updateEtlStatus(etlStatusId, {
                status: 'COMPLETED',
                endDate: new Date().toISOString(),
                recordsProcessed,
                lastProcessedDate: recordsProcessed > 0 ? lastProcessedDate : undefined
            });

            return { nextCursor, recordsProcessed, isComplete };
        } catch (error) {
            this.logger.logError('Error in batch processing', error);

            await this.updateEtlStatus(undefined, {
                status: 'FAILED',
                endDate: new Date().toISOString()
            });

            throw error;
        }
    }

    /**
     * Process all tournament data within a date range.
     * 
     * This method is suitable for:
     * - Initial database seeding (6 months of historical data)
     * - Catching up after extended downtime
     * - Running in environments without strict time limits
     * 
     * @param startDate - Start date in YYYY-MM-DD format (optional)
     * @param endDate - End date in YYYY-MM-DD format (optional, defaults to today)
     */
    async processData(
        startDate?: string,
        endDate?: string,
    ): Promise<void> {
        try {
            this.logger.info('Starting ETL process');
            
            const etlStatusId = await this.createEtlStatus(ETL_STATUS.RUNNING);

            if (!etlStatusId) {
                throw new EtlProcessingError('Failed to create ETL status record', 'initialization');
            }

            if (!startDate) {
                const lastTournamentDate = await this.getLastProcessedTournamentDate();
                if (lastTournamentDate) {
                    startDate = format(addDays(parseISO(lastTournamentDate), 1), 'yyyy-MM-dd');
                    this.logger.info('Using last processed tournament date', { lastTournamentDate, startingFrom: startDate });
                } else {
                    const lastEtlStatus = await this.getLastCompletedEtlStatus();
                    startDate = lastEtlStatus?.lastProcessedDate
                        ? format(addDays(parseISO(lastEtlStatus.lastProcessedDate), 1), 'yyyy-MM-dd')
                        : format(subMonths(new Date(), DEFAULT_SEED_MONTHS), 'yyyy-MM-dd');
                    this.logger.info('Using ETL status date', { startingFrom: startDate });
                }
            }

            if (!endDate) {
                endDate = format(new Date(), 'yyyy-MM-dd');
            }

            this.logger.info('Processing data', { startDate, endDate });

            let currentStartDate = startDate;
            let recordsProcessed = 0;

            while (currentStartDate <= endDate) {
                const batchEndDate = format(
                    new Date(Math.min(
                        addDays(parseISO(currentStartDate), WEEKLY_BATCH_DAYS).getTime(),
                        parseISO(endDate).getTime()
                    )),
                    'yyyy-MM-dd'
                );

                this.logger.info('Processing weekly batch', { startDate: currentStartDate, endDate: batchEndDate });

                const tournaments = await this.topdeckClient.fetchTournaments(
                    currentStartDate,
                    batchEndDate
                );

                this.logger.info('Found tournaments', { count: tournaments.length });

                const batchRecordsProcessed = await this.processTournaments(tournaments);
                recordsProcessed += batchRecordsProcessed;

                this.logger.info('Batch complete', { batchRecords: batchRecordsProcessed, totalRecords: recordsProcessed });

                let lastProcessedDate = batchEndDate;
                if (batchRecordsProcessed > 0) {
                    const actualLastDate = await this.getLastProcessedTournamentDate();
                    if (actualLastDate) {
                        lastProcessedDate = actualLastDate;
                    }
                }

                await this.updateEtlStatus(etlStatusId, {
                    recordsProcessed,
                    lastProcessedDate: batchRecordsProcessed > 0 ? lastProcessedDate : undefined
                });

                currentStartDate = format(addDays(parseISO(batchEndDate), 1), 'yyyy-MM-dd');
            }

            await this.updateEtlStatus(etlStatusId, {
                status: 'COMPLETED',
                endDate: new Date().toISOString()
            });

            this.logger.info('ETL process completed successfully', { recordsProcessed });
        } catch (error) {
            this.logger.logError('Error in ETL process', error);

            await this.updateEtlStatus(undefined, {
                status: 'FAILED',
                endDate: new Date().toISOString()
            });

            throw error;
        }
    }

    /**
     * Process a list of tournaments, extracting and storing deck data.
     * 
     * @param tournaments - Array of tournaments from Topdeck API
     * @returns Total number of records (standings) processed
     */
    private async processTournaments(tournaments: Tournament[]): Promise<number> {
        let recordsProcessed = 0;

        for (const tournament of tournaments) {
            this.logger.debug('Processing tournament', { name: tournament.tournamentName, id: tournament.TID });

            const { data: existingTournament } = await supabaseServiceRole
                .from('processed_tournaments')
                .select('tournament_id, record_count')
                .eq('tournament_id', tournament.TID)
                .single();

            if (existingTournament) {
                this.logger.debug('Skipping already processed tournament', { 
                    name: tournament.tournamentName, 
                    id: tournament.TID, 
                    records: existingTournament.record_count 
                });
                continue;
            }

            // Filter standings to only include those with valid deckObj
            const validStandings = tournament.standings.filter(
                standing => standing.deckObj !== null && 
                           standing.deckObj.Commanders && 
                           Object.keys(standing.deckObj.Commanders).length > 0
            );

            this.logger.debug('Found valid deck objects', { tournament: tournament.tournamentName, count: validStandings.length });

            let tournamentRecordsProcessed = 0;

            for (let i = 0; i < validStandings.length; i += this.concurrencyLimit) {
                const batch = validStandings.slice(i, i + this.concurrencyLimit);

                for (const standing of batch) {
                    try {
                        await this.processStanding(standing);
                        recordsProcessed++;
                        tournamentRecordsProcessed++;
                    } catch (error) {
                        this.logger.logError('Error processing standing, skipping', error);
                    }
                }
            }

            if (tournamentRecordsProcessed > 0) {
                const tournamentDate = typeof tournament.startDate === 'string' 
                    ? new Date(parseInt(tournament.startDate) * 1000).toISOString()
                    : new Date(tournament.startDate * 1000).toISOString();
                
                await supabaseServiceRole
                    .from('processed_tournaments')
                    .insert({
                        tournament_id: tournament.TID,
                        tournament_date: tournamentDate,
                        name: tournament.tournamentName,
                        record_count: tournamentRecordsProcessed,
                        processed_at: new Date().toISOString()
                    });

                this.logger.info('Marked tournament as processed', { 
                    tournament: tournament.tournamentName, 
                    records: tournamentRecordsProcessed 
                });
            }
        }

        return recordsProcessed;
    }

    /**
     * Process a single tournament standing (one player's deck entry).
     * 
     * Extracts deck data from deckObj and updates database statistics.
     * 
     * @param standing - Tournament standing with deckObj and results
     */
    private async processStanding(standing: TournamentStanding): Promise<void> {
        try {
            const startTime = Date.now();

            if (!standing.deckObj) {
                this.logger.warn('Standing has no deckObj', { player: standing.name });
                return;
            }

            await this.processDeck(standing.deckObj, standing);
            
            const totalTime = Date.now() - startTime;
            this.logger.debug('Standing processing complete', { 
                player: standing.name,
                totalMs: totalTime 
            });
        } catch (error) {
            this.logger.logError('Error processing standing', error);
            throw error;
        }
    }

    /**
     * Process a deck object and update database statistics.
     * 
     * This is the core transformation logic that:
     * 1. Extracts commander(s) and generates a consistent commander ID
     * 2. Extracts all mainboard cards
     * 3. Fetches existing statistics from the database
     * 4. Calculates new aggregated statistics
     * 5. Batch upserts all data (commander, cards, statistics)
     * 
     * @param deckObj - Topdeck deck object with Commanders and Mainboard
     * @param standing - Tournament standing with win/loss/draw counts
     */
    private async processDeck(
        deckObj: TopdeckDeckObj,
        standing: TournamentStanding
    ): Promise<void> {
        try {
            const startTime = Date.now();
            let dbOperationsTime = 0;
            
            // =================================================================
            // VALIDATION
            // =================================================================
            if (!deckObj.Commanders || Object.keys(deckObj.Commanders).length === 0) {
                this.logger.warn('Deck has no commanders');
                return;
            }

            if (!deckObj.Mainboard || Object.keys(deckObj.Mainboard).length === 0) {
                this.logger.warn('Deck has no mainboard cards');
                return;
            }

            // =================================================================
            // COMMANDER IDENTIFICATION
            // Generate consistent ID for commander/partner pairs using Scryfall UUIDs
            // =================================================================
            const commanderId = generateCommanderId(deckObj.Commanders);
            const commanderName = generateCommanderName(deckObj.Commanders);

            // =================================================================
            // STEP 1: FETCH EXISTING COMMANDER DATA
            // =================================================================
            const commanderFetchStart = Date.now();
            const { data: existingCommander } = await supabaseServiceRole
                .from('commanders')
                .select('*')
                .eq('id', commanderId)
                .single();
            
            const commanderFetchTime = Date.now() - commanderFetchStart;
            dbOperationsTime += commanderFetchTime;
            
            // =================================================================
            // STEP 2: PREPARE CARD DATA FOR BATCH OPERATIONS
            // =================================================================
            const allCards = Object.entries(deckObj.Mainboard).map(([cardName, entry]) => ({
                unique_card_id: entry.id,
                name: cardName,
                scryfall_id: entry.id, // Same as unique_card_id now
                updated_at: new Date().toISOString()
            }));
            
            const allCardIds = allCards.map(card => card.unique_card_id);
            
            // =================================================================
            // STEP 3: FETCH EXISTING STATISTICS (BATCH)
            // =================================================================
            const statsFetchStart = Date.now();
            const { data: existingStatistics } = await supabaseServiceRole
                .from('statistics')
                .select('*')
                .eq('commander_id', commanderId)
                .in('card_id', allCardIds);
            
            const statsFetchTime = Date.now() - statsFetchStart;
            dbOperationsTime += statsFetchTime;
            
            type StatRecord = { card_id: string; wins: number; losses: number; draws: number; entries: number };
            const statsMap: Record<string, StatRecord> = (existingStatistics || []).reduce((acc, stat) => {
                acc[stat.card_id] = stat;
                return acc;
            }, {} as Record<string, StatRecord>);
            
            // =================================================================
            // STEP 4: CALCULATE NEW COMMANDER STATISTICS
            // =================================================================
            const newCommanderValues = {
                id: commanderId,
                name: commanderName,
                wins: (existingCommander?.wins || 0) + standing.wins,
                losses: (existingCommander?.losses || 0) + standing.losses,
                draws: (existingCommander?.draws || 0) + standing.draws,
                entries: (existingCommander?.entries || 0) + 1,
                updated_at: new Date().toISOString()
            };
            
            // =================================================================
            // STEP 5: PREPARE STATISTICS RECORDS
            // =================================================================
            const allStatistics = allCardIds.map(cardId => {
                const existingStat = statsMap[cardId];
                
                return {
                    commander_id: commanderId,
                    card_id: cardId,
                    wins: (existingStat?.wins || 0) + standing.wins,
                    losses: (existingStat?.losses || 0) + standing.losses,
                    draws: (existingStat?.draws || 0) + standing.draws,
                    entries: (existingStat?.entries || 0) + 1,
                    updated_at: new Date().toISOString()
                };
            });
            
            // =================================================================
            // STEP 6: BATCH UPSERT ALL DATA
            // =================================================================
            const batchUpsertStart = Date.now();
            
            const { error } = await supabaseServiceRole.rpc('batch_upsert_deck_data', {
                commander_data: newCommanderValues,
                cards_data: allCards,
                stats_data: allStatistics
            });
            
            if (error) {
                this.logger.debug('RPC batch operation failed, using fallback', { error: error.message });
                
                const commanderResult = await supabaseServiceRole
                    .from('commanders')
                    .upsert(newCommanderValues, { onConflict: 'id' });
                    
                if (commanderResult.error) {
                    this.logger.warn('Error upserting commander', { error: commanderResult.error.message });
                }
                
                const cardsResult = await supabaseServiceRole
                    .from('cards')
                    .upsert(allCards, { onConflict: 'unique_card_id' });
                    
                if (cardsResult.error) {
                    this.logger.warn('Error upserting cards', { error: cardsResult.error.message });
                }
                
                const statsResult = await supabaseServiceRole
                    .from('statistics')
                    .upsert(allStatistics, { onConflict: 'commander_id,card_id' });
                    
                if (statsResult.error) {
                    this.logger.warn('Error upserting statistics', { error: statsResult.error.message });
                }
            }
            
            const batchUpsertTime = Date.now() - batchUpsertStart;
            dbOperationsTime += batchUpsertTime;
            
            const totalProcessingTime = Date.now() - startTime;
            
            this.logger.debug('Deck processing summary', {
                totalMs: totalProcessingTime,
                dbOpsMs: dbOperationsTime,
                commanderFetchMs: commanderFetchTime,
                statsFetchMs: statsFetchTime,
                batchUpsertMs: batchUpsertTime,
                cardsCount: allCards.length
            });
        } catch (error) {
            this.logger.logError('Error processing deck', error);
        }
    }

    /**
     * Create a new ETL status record to track the current run.
     */
    private async createEtlStatus(status: EtlStatusType): Promise<number | null> {
        const { data, error } = await supabaseServiceRole
            .from('etl_status')
            .insert({
                start_date: new Date().toISOString(),
                status,
                records_processed: 0
            })
            .select('id')
            .single();

        if (error) {
            this.logger.warn('Error creating ETL status', { error: error.message });
            return null;
        }

        return data.id;
    }

    /**
     * Update an ETL status record with progress or completion information.
     */
    private async updateEtlStatus(
        id?: number,
        updates?: Partial<{
            status: EtlStatusType;
            endDate: string;
            recordsProcessed: number;
            lastProcessedDate: string;
        }>
    ): Promise<void> {
        if (!id && !updates?.status) {
            return;
        }

        try {
            if (id) {
                const { error } = await supabaseServiceRole
                    .from('etl_status')
                    .update({
                        status: updates?.status,
                        end_date: updates?.endDate,
                        records_processed: updates?.recordsProcessed,
                        last_processed_date: updates?.lastProcessedDate,
                    })
                    .eq('id', id);

                if (error) {
                    this.logger.warn('Error updating ETL status', { id, error: error.message });
                }
            } else {
                const { error } = await supabaseServiceRole
                    .from('etl_status')
                    .update({
                        status: updates?.status,
                        end_date: updates?.endDate,
                    })
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (error) {
                    this.logger.warn('Error updating ETL status', { error: error.message });
                }
            }
        } catch (error) {
            this.logger.logError('Error updating ETL status', error);
        }
    }

    /**
     * Get the most recent completed ETL status that processed records.
     */
    private async getLastCompletedEtlStatus(): Promise<EtlStatus | null> {
        const { data, error } = await supabaseServiceRole
            .from('etl_status')
            .select('*')
            .eq('status', ETL_STATUS.COMPLETED)
            .gt('records_processed', 0)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            this.logger.warn('Error fetching last ETL status', { error: error.message });
            return null;
        }

        return {
            id: data.id,
            startDate: data.start_date,
            endDate: data.end_date,
            status: data.status as EtlStatusType,
            recordsProcessed: data.records_processed,
            lastProcessedDate: data.last_processed_date
        };
    }

    /**
     * Get the actual last processed tournament date.
     */
    private async getLastProcessedTournamentDate(): Promise<string | null> {
        const { data, error } = await supabaseServiceRole
            .from('processed_tournaments')
            .select('tournament_date, processed_at')
            .gt('tournament_date', MIN_VALID_TOURNAMENT_YEAR)
            .order('processed_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                const { data: fallbackData } = await supabaseServiceRole
                    .from('processed_tournaments')
                    .select('processed_at')
                    .order('processed_at', { ascending: false })
                    .limit(1)
                    .single();
                
                if (fallbackData?.processed_at) {
                    const processedDate = parseISO(fallbackData.processed_at);
                    this.logger.info('No valid tournament dates found, using processed_at', { 
                        date: format(processedDate, 'yyyy-MM-dd') 
                    });
                    return format(processedDate, 'yyyy-MM-dd');
                }
                return null;
            }
            this.logger.warn('Error fetching last processed tournament date', { error: error.message });
            return null;
        }

        if (!data || !data.tournament_date) {
            return null;
        }

        const tournamentDate = format(parseISO(data.tournament_date), 'yyyy-MM-dd');
        this.logger.info('Found last processed tournament date', { 
            tournamentDate, 
            processedAt: data.processed_at 
        });
        return tournamentDate;
    }
}
