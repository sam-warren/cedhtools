/**
 * ETL Processor
 * 
 * This module is responsible for extracting tournament data from Topdeck,
 * fetching deck information from Moxfield, and aggregating statistics into
 * the Supabase database.
 * 
 * ## Architecture Overview
 * 
 * The ETL process follows this flow:
 * 1. **Extract**: Fetch tournaments from Topdeck API for a date range
 * 2. **Filter**: Identify standings with Moxfield decklist URLs
 * 3. **Extract**: Fetch deck details from Moxfield API (rate-limited)
 * 4. **Transform**: Extract commanders, cards, and calculate statistics
 * 5. **Load**: Upsert aggregated data into Supabase tables
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
 * - **Commanders**: Identified by sorted concatenation of unique card IDs
 *   (e.g., "cardA_cardB" for partner commanders). Statistics are aggregated
 *   across all tournament entries.
 * 
 * - **Statistics**: Per-commander, per-card performance metrics including
 *   wins, losses, draws, and entry counts.
 * 
 * @module EtlProcessor
 */

import { addDays, format, parseISO, subDays, subMonths } from 'date-fns';
import { supabaseServiceRole } from '../supabase';
import { MoxfieldClient, TopdeckClient } from './api-clients';
import {
    EtlStatus,
    MoxfieldDeck,
    Tournament,
    TournamentStanding
} from './types';
import {
    DEFAULT_BATCH_SIZE,
    DEFAULT_CONCURRENCY_LIMIT,
    DEFAULT_LOOKBACK_DAYS,
    DEFAULT_SEED_MONTHS,
    WEEKLY_BATCH_DAYS,
    RATE_LIMIT_PAUSE_MS,
    MIN_VALID_TOURNAMENT_YEAR,
    CURSOR_DELIMITER,
    MOXFIELD_URL_PATTERN,
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
 * and loading from tournament APIs into the database.
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
    private moxfieldClient: MoxfieldClient;
    private concurrencyLimit: number;
    private logger = etlLogger.child({ module: 'processor' });

    constructor() {
        this.topdeckClient = new TopdeckClient();
        this.moxfieldClient = new MoxfieldClient();
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
     * 4. On rate limit or batch limit, save cursor and return
     * 
     * @param cursor - Resume cursor from previous batch, or null to start fresh
     * @param batchSize - Maximum records to process before returning (default: 50)
     * @returns Object containing:
     *   - `nextCursor`: Cursor for next batch, or null if complete
     *   - `recordsProcessed`: Number of records processed in this batch
     *   - `isComplete`: True if all data up to today has been processed
     * 
     * @example
     * ```typescript
     * // Process in a loop (e.g., from cron job or worker)
     * let cursor = null;
     * while (true) {
     *   const { nextCursor, isComplete } = await processor.processBatch(cursor);
     *   if (isComplete) break;
     *   cursor = nextCursor;
     * }
     * ```
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
                // Cursor format: YYYY-MM-DD:tournamentId:index
                // Example: "2024-01-15:abc123:5" means resume at 5th standing in tournament abc123 on Jan 15
                const [date, tournamentId, indexStr] = cursor.split(CURSOR_DELIMITER);
                currentDate = date;
                tournamentIdToSkipTo = tournamentId || null;
                currentTournamentIndex = indexStr ? parseInt(indexStr, 10) : 0;
            } else {
                // No cursor provided - determine start date automatically
                // Priority: 1) Last processed tournament date, 2) Last ETL status, 3) Default lookback
                const lastTournamentDate = await this.getLastProcessedTournamentDate();
                if (lastTournamentDate) {
                    // Start from the day after the last processed tournament
                    currentDate = format(addDays(parseISO(lastTournamentDate), 1), 'yyyy-MM-dd');
                    this.logger.info('Using last processed tournament date', { lastTournamentDate, startingFrom: currentDate });
                } else {
                    // Fallback: check ETL status table or use default lookback
                    const lastEtlStatus = await this.getLastCompletedEtlStatus();
                    currentDate = lastEtlStatus?.lastProcessedDate
                        ? format(addDays(parseISO(lastEtlStatus.lastProcessedDate), 1), 'yyyy-MM-dd')
                        : format(subDays(new Date(), DEFAULT_LOOKBACK_DAYS), 'yyyy-MM-dd');
                    this.logger.info('Using ETL status date', { startingFrom: currentDate });
                }
            }

            // End date is always today - we process up to current date
            const endDate = format(new Date(), 'yyyy-MM-dd');
            
            let recordsProcessed = 0;
            let nextCursor: string | null = null;
            let isComplete = false;

            // =================================================================
            // MAIN PROCESSING LOOP
            // Process one day at a time for predictable batch sizes
            // =================================================================
            if (currentDate <= endDate) {
                this.logger.info('Processing batch', { date: currentDate });

                // Fetch tournaments for the current date
                const tournaments = await this.topdeckClient.fetchTournaments(
                    currentDate,
                    currentDate
                );

                this.logger.info('Found tournaments', { date: currentDate, count: tournaments.length });

                // Apply tournament filtering based on cursor
                let tournamentsToProcess = tournaments;
                
                if (tournamentIdToSkipTo) {
                    // Find the index of the tournament to resume from
                    const resumeIndex = tournaments.findIndex(t => t.TID === tournamentIdToSkipTo);
                    if (resumeIndex >= 0) {
                        // Start from this tournament and skip processed standings
                        tournamentsToProcess = tournaments.slice(resumeIndex);
                    }
                }

                // Process tournaments until we hit the batch size limit
                let batchComplete = true;
                
                for (let i = 0; i < tournamentsToProcess.length; i++) {
                    const tournament = tournamentsToProcess[i];
                    
                    this.logger.debug('Processing tournament', { name: tournament.tournamentName, id: tournament.TID });

                    // Check if tournament has already been processed
                    const { data: existingTournament } = await supabaseServiceRole
                        .from('processed_tournaments')
                        .select('tournament_id, record_count')
                        .eq('tournament_id', tournament.TID)
                        .single();

                    if (existingTournament) {
                        this.logger.debug('Skipping already processed tournament', { name: tournament.tournamentName });
                        continue;
                    }

                    // Filter standings to only include those with Moxfield decklists
                    const moxfieldStandings = tournament.standings.filter(
                        standing => standing.decklist && standing.decklist.includes('moxfield.com/decks/')
                    );

                    this.logger.debug('Found Moxfield decklists', { tournament: tournament.tournamentName, count: moxfieldStandings.length });

                    let tournamentRecordsProcessed = 0;
                    
                    // Start from the specified index if this is the tournament we're resuming
                    const startingIndex = (tournament.TID === tournamentIdToSkipTo) ? currentTournamentIndex : 0;

                    // Process each standing in batches based on concurrency limit
                    let standingIndex = startingIndex;
                    
                    while (standingIndex < moxfieldStandings.length) {
                        const batchEndIndex = Math.min(standingIndex + this.concurrencyLimit, moxfieldStandings.length);
                        const standingsBatch = moxfieldStandings.slice(standingIndex, batchEndIndex);

                        // Process batch sequentially to handle rate limiting properly
                        for (const standing of standingsBatch) {
                            try {
                                await this.processStanding(standing);
                                recordsProcessed++;
                                tournamentRecordsProcessed++;
                                
                                // Check if we've hit the batch size limit
                                if (recordsProcessed >= batchSize) {
                                    // Set the next cursor and stop processing
                                    nextCursor = `${currentDate}:${tournament.TID}:${standingIndex + 1}`;
                                    batchComplete = false;
                                    break;
                                }
                            } catch (error) {
                                if (error instanceof Error &&
                                    (error.message.includes('429') || error.message.includes('Too Many Requests'))) {
                                    // For rate limiting errors, we need to pause and retry the same standing
                                    this.logger.warn('Rate limited, setting cursor and pausing', { standingIndex });
                                    
                                    // Set cursor to current position
                                    nextCursor = `${currentDate}:${tournament.TID}:${standingIndex}`;
                                    batchComplete = false;
                                    break;
                                } else {
                                    // For other errors, just log and continue with next item
                                    this.logger.logError('Error processing standing, skipping', error);
                                }
                            }
                        }

                        // If we've hit the batch size limit or encountered rate limiting, stop processing
                        if (!batchComplete) {
                            break;
                        }

                        standingIndex = batchEndIndex;
                    }

                    // Mark tournament as processed if we completed all its standings
                    if (batchComplete && tournamentRecordsProcessed > 0) {
                        // Convert Unix timestamp (seconds) to milliseconds for Date constructor
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
                    
                    // If we've hit the batch size limit, stop processing
                    if (!batchComplete) {
                        break;
                    }
                }

                // If we've completed all tournaments for this day, move to the next day
                if (batchComplete) {
                    const nextDate = format(addDays(parseISO(currentDate), 1), 'yyyy-MM-dd');
                    
                    if (nextDate <= endDate) {
                        // There are more days to process
                        nextCursor = `${nextDate}::`; // Set cursor to the start of the next day
                    } else {
                        // We've processed all data up to the end date
                        isComplete = true;
                    }
                }
            } else {
                // Current date is past the end date, we're done
                isComplete = true;
            }

            // Update the ETL status record with actual last processed date if records were processed
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

            // Update any ETL status to failed
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
     * Data is processed in weekly batches to balance API load with efficiency.
     * Each batch is committed independently, so partial progress is preserved
     * if the process is interrupted.
     * 
     * @param startDate - Start date in YYYY-MM-DD format (optional, defaults to last processed or 6 months ago)
     * @param endDate - End date in YYYY-MM-DD format (optional, defaults to today)
     * 
     * @example
     * ```typescript
     * // Process last 6 months (for seeding)
     * await processor.processData();
     * 
     * // Process specific date range
     * await processor.processData('2024-01-01', '2024-03-31');
     * ```
     */
    async processData(
        startDate?: string,
        endDate?: string,
    ): Promise<void> {
        try {
            this.logger.info('Starting ETL process');
            
            // Create ETL status record to track this run
            const etlStatusId = await this.createEtlStatus(ETL_STATUS.RUNNING);

            if (!etlStatusId) {
                throw new EtlProcessingError('Failed to create ETL status record', 'initialization');
            }

            // =================================================================
            // DETERMINE DATE RANGE
            // Priority: 1) Provided dates, 2) Last tournament, 3) ETL status, 4) Default
            // =================================================================
            if (!startDate) {
                // Try to get the actual last processed tournament date (most reliable)
                const lastTournamentDate = await this.getLastProcessedTournamentDate();
                if (lastTournamentDate) {
                    startDate = format(addDays(parseISO(lastTournamentDate), 1), 'yyyy-MM-dd');
                    this.logger.info('Using last processed tournament date', { lastTournamentDate, startingFrom: startDate });
                } else {
                    // Fallback to ETL status if no tournaments found
                    const lastEtlStatus = await this.getLastCompletedEtlStatus();
                    startDate = lastEtlStatus?.lastProcessedDate
                        ? format(addDays(parseISO(lastEtlStatus.lastProcessedDate), 1), 'yyyy-MM-dd')
                        : format(subMonths(new Date(), DEFAULT_SEED_MONTHS), 'yyyy-MM-dd');
                    this.logger.info('Using ETL status date', { startingFrom: startDate });
                }
            }

            // Default end date is today
            if (!endDate) {
                endDate = format(new Date(), 'yyyy-MM-dd');
            }

            this.logger.info('Processing data', { startDate, endDate });

            let currentStartDate = startDate;
            let recordsProcessed = 0;

            // =================================================================
            // WEEKLY BATCH PROCESSING LOOP
            // Process data in weekly chunks to avoid overwhelming APIs
            // and to allow for partial progress if interrupted
            // =================================================================
            while (currentStartDate <= endDate) {
                // Calculate batch end: min(current + 7 days, overall end date)
                const batchEndDate = format(
                    new Date(Math.min(
                        addDays(parseISO(currentStartDate), WEEKLY_BATCH_DAYS).getTime(),
                        parseISO(endDate).getTime()
                    )),
                    'yyyy-MM-dd'
                );

                this.logger.info('Processing weekly batch', { startDate: currentStartDate, endDate: batchEndDate });

                // Fetch tournaments for the current batch
                const tournaments = await this.topdeckClient.fetchTournaments(
                    currentStartDate,
                    batchEndDate
                );

                this.logger.info('Found tournaments', { count: tournaments.length });

                // Process the tournaments and their decklists
                const batchRecordsProcessed = await this.processTournaments(tournaments);
                recordsProcessed += batchRecordsProcessed;

                this.logger.info('Batch complete', { batchRecords: batchRecordsProcessed, totalRecords: recordsProcessed });

                // Only update last_processed_date if we actually processed records
                // Use the actual last tournament date if available, otherwise use batchEndDate
                let lastProcessedDate = batchEndDate;
                if (batchRecordsProcessed > 0) {
                    const actualLastDate = await this.getLastProcessedTournamentDate();
                    if (actualLastDate) {
                        lastProcessedDate = actualLastDate;
                    }
                }

                // Update the ETL status record
                await this.updateEtlStatus(etlStatusId, {
                    recordsProcessed,
                    lastProcessedDate: batchRecordsProcessed > 0 ? lastProcessedDate : undefined
                });

                // Move to the next batch
                currentStartDate = format(addDays(parseISO(batchEndDate), 1), 'yyyy-MM-dd');
            }

            // Mark the ETL process as completed
            await this.updateEtlStatus(etlStatusId, {
                status: 'COMPLETED',
                endDate: new Date().toISOString()
            });

            this.logger.info('ETL process completed successfully', { recordsProcessed });
        } catch (error) {
            this.logger.logError('Error in ETL process', error);

            // Update the ETL status to failed
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
     * For each tournament:
     * 1. Check if already processed (skip if yes)
     * 2. Filter standings to only those with Moxfield URLs
     * 3. Process each standing's deck data
     * 4. Mark tournament as processed when complete
     * 
     * @param tournaments - Array of tournaments from Topdeck API
     * @returns Total number of records (standings) processed
     */
    private async processTournaments(tournaments: Tournament[]): Promise<number> {
        let recordsProcessed = 0;

        for (const tournament of tournaments) {
            this.logger.debug('Processing tournament', { name: tournament.tournamentName, id: tournament.TID });

            // Check if tournament has already been processed
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

            // Filter standings to only include those with Moxfield decklists
            const moxfieldStandings = tournament.standings.filter(
                standing => standing.decklist && standing.decklist.includes('moxfield.com/decks/')
            );

            this.logger.debug('Found Moxfield decklists', { tournament: tournament.tournamentName, count: moxfieldStandings.length });

            let tournamentRecordsProcessed = 0;

            // Process each standing in batches based on concurrency limit
            for (let i = 0; i < moxfieldStandings.length; i += this.concurrencyLimit) {
                const batch = moxfieldStandings.slice(i, i + this.concurrencyLimit);

                // Process batch one at a time to handle rate limiting properly
                for (const standing of batch) {
                    try {
                        await this.processStanding(standing);
                        recordsProcessed++;
                        tournamentRecordsProcessed++;
                    } catch (error) {
                        if (error instanceof Error &&
                            (error.message.includes('429') || error.message.includes('Too Many Requests'))) {
                            // Rate limit detected - pause and retry this batch
                            // Note: This should rarely trigger since MoxfieldClient has its own retry logic
                            // This is a safety net for cases where the client's retries are exhausted
                            this.logger.warn('Rate limited, retrying standing after backoff');
                            i -= this.concurrencyLimit; // Move back to retry this batch

                            // Additional pause on top of client's exponential backoff
                            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_PAUSE_MS));
                            break; // Exit the batch loop to retry
                        } else {
                            // Non-rate-limit errors: log and continue with next standing
                            // This prevents one bad deck from blocking the entire tournament
                            this.logger.logError('Error processing standing, skipping', error);
                        }
                    }
                }
            }

            // Mark tournament as processed
            if (tournamentRecordsProcessed > 0) {
                // Convert Unix timestamp (seconds) to milliseconds for Date constructor
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
     * Steps:
     * 1. Extract Moxfield deck ID from the decklist URL
     * 2. Fetch deck data from Moxfield API (with rate limiting)
     * 3. Delegate to processDeck() for data extraction and storage
     * 
     * Rate limit errors (429) are re-thrown to allow retry logic at higher levels.
     * Other errors are caught and logged, allowing processing to continue.
     * 
     * @param standing - Tournament standing with decklist URL and results
     */
    private async processStanding(standing: TournamentStanding): Promise<void> {
        try {
            const startTime = Date.now();
            
            // Extract Moxfield deck ID from the decklist URL
            const deckId = this.extractDeckId(standing.decklist);

            if (!deckId) {
                this.logger.warn('Invalid Moxfield URL', { url: standing.decklist });
                return;
            }

            // Fetch the deck from Moxfield
            // Rate limit errors will propagate up for retry handling
            const fetchStartTime = Date.now();
            const deck = await this.moxfieldClient.fetchDeck(deckId);
            const fetchEndTime = Date.now();

            if (!deck) {
                // Deck may have been deleted or made private
                this.logger.warn('Deck not found', { deckId });
                return;
            }

            // Process the deck data and store in database
            const processStartTime = Date.now();
            await this.processDeck(deck, standing);
            const processEndTime = Date.now();
            
            // Performance logging for monitoring
            const totalTime = processEndTime - startTime;
            this.logger.debug('Deck processing complete', { 
                deckId, 
                totalMs: totalTime, 
                fetchMs: fetchEndTime - fetchStartTime, 
                processMs: processEndTime - processStartTime 
            });
        } catch (error) {
            this.logger.logError('Error processing standing', error);
            
            // Re-throw rate limit errors for upstream retry handling
            if (error instanceof Error &&
                (error.message.includes('429') || error.message.includes('Too Many Requests'))) {
                throw error;
            }
            // Swallow other errors to allow processing to continue
        }
    }

    /**
     * Process a Moxfield deck and update database statistics.
     * 
     * This is the core transformation logic that:
     * 1. Extracts commander(s) and generates a consistent commander ID
     * 2. Extracts all mainboard cards
     * 3. Fetches existing statistics from the database
     * 4. Calculates new aggregated statistics
     * 5. Batch upserts all data (commander, cards, statistics)
     * 
     * ## Commander ID Generation
     * For partner commanders, the ID is a sorted concatenation of unique card IDs
     * (e.g., "cardA_cardB"). This ensures consistent identification regardless of
     * the order commanders appear in the deck.
     * 
     * ## Database Operations
     * Uses a batched approach to minimize round trips:
     * 1. Single query to fetch existing commander data
     * 2. Single query to fetch all existing card statistics
     * 3. Single RPC call to upsert all data atomically
     * 4. Fallback to individual upserts if RPC fails
     * 
     * @param deck - Moxfield deck data
     * @param standing - Tournament standing with win/loss/draw counts
     */
    private async processDeck(
        deck: MoxfieldDeck,
        standing: TournamentStanding
    ): Promise<void> {
        try {
            const startTime = Date.now();
            let dbOperationsTime = 0;
            
            // =================================================================
            // VALIDATION - Ensure deck has required structure
            // =================================================================
            if (!deck) {
                this.logger.warn('Deck is null or undefined');
                return;
            }

            if (!deck.boards) {
                this.logger.warn('Deck has no boards property');
                return;
            }

            if (!deck.boards.commanders) {
                this.logger.warn('Deck has no commanders board');
                return;
            }

            // Extract commanders - Moxfield API uses object map, not array
            const commanderCardsObj = deck.boards.commanders.cards || {};
            const commanderCards = Object.values(commanderCardsObj);
            
            if (commanderCards.length === 0) {
                this.logger.warn('Deck has no commanders');
                return;
            }

            // =================================================================
            // COMMANDER IDENTIFICATION
            // Generate consistent ID for commander/partner pairs using shared utility
            // =================================================================
            const commanderId = generateCommanderId(commanderCards);
            const commanderName = generateCommanderName(commanderCards);

            // Validate mainboard exists
            if (!deck.boards.mainboard || !deck.boards.mainboard.cards) {
                this.logger.warn('Deck has no mainboard cards');
                return;
            }

            // Extract all mainboard cards for batch processing
            const mainboardCards = Object.values(deck.boards.mainboard.cards);
            this.logger.debug('Processing mainboard cards', { count: mainboardCards.length });
            
            // =================================================================
            // STEP 1: FETCH EXISTING COMMANDER DATA
            // Check if this commander already exists to accumulate statistics
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
            // Transform Moxfield card data to database schema format
            // =================================================================
            const allCards = mainboardCards.map(cardEntry => {
                if (!cardEntry || !cardEntry.card) {
                    return null;
                }
                
                return {
                    unique_card_id: cardEntry.card.uniqueCardId || '',
                    name: cardEntry.card.name || 'Unknown Card',
                    scryfall_id: cardEntry.card.scryfall_id || '',
                    type: cardEntry.card.type || 0,
                    type_line: cardEntry.card.type_line || '',
                    updated_at: new Date().toISOString()
                };
            }).filter(Boolean);
            
            // Extract card IDs for statistics query
            const allCardIds = allCards.map(card => card!.unique_card_id);
            
            // =================================================================
            // STEP 3: FETCH EXISTING STATISTICS (BATCH)
            // Get all card statistics for this commander in one query
            // =================================================================
            const statsFetchStart = Date.now();
            const { data: existingStatistics } = await supabaseServiceRole
                .from('statistics')
                .select('*')
                .eq('commander_id', commanderId)
                .in('card_id', allCardIds);
            
            const statsFetchTime = Date.now() - statsFetchStart;
            dbOperationsTime += statsFetchTime;
            
            // Build lookup map for O(1) access to existing stats
            type StatRecord = { card_id: string; wins: number; losses: number; draws: number; entries: number };
            const statsMap: Record<string, StatRecord> = (existingStatistics || []).reduce((acc, stat) => {
                acc[stat.card_id] = stat;
                return acc;
            }, {} as Record<string, StatRecord>);
            
            // =================================================================
            // STEP 4: CALCULATE NEW COMMANDER STATISTICS
            // Accumulate this tournament's results with existing data
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
            // Accumulate card statistics for this commander
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
            // Prefer RPC for atomicity, fallback to sequential upserts
            // =================================================================
            const batchUpsertStart = Date.now();
            
            // Try RPC function for atomic batch operation
            const { error } = await supabaseServiceRole.rpc('batch_upsert_deck_data', {
                commander_data: newCommanderValues,
                cards_data: allCards,
                stats_data: allStatistics
            });
            
            if (error) {
                // RPC may not exist or may fail - fall back to standard batch operations
                // This maintains compatibility and allows the ETL to work without the RPC function
                this.logger.debug('RPC batch operation failed, using fallback', { error: error.message });
                
                // Perform batch operations sequentially (order matters for foreign keys)
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
            
            const cardProcessingEnd = Date.now();
            const totalProcessingTime = cardProcessingEnd - startTime;
            const nonDbTime = totalProcessingTime - dbOperationsTime;
            
            this.logger.debug('Deck processing summary', {
                totalMs: totalProcessingTime,
                dbOpsMs: dbOperationsTime,
                dbPercent: Math.round(dbOperationsTime / totalProcessingTime * 100),
                commanderFetchMs: commanderFetchTime,
                statsFetchMs: statsFetchTime,
                batchUpsertMs: batchUpsertTime,
                otherMs: nonDbTime,
                cardsCount: allCards.length,
                avgMsPerCard: allCards.length > 0 ? Math.round(dbOperationsTime / allCards.length) : 0
            });
        } catch (error) {
            this.logger.logError('Error processing deck', error);
        }
    }

    /**
     * Extract the Moxfield deck ID from a full decklist URL.
     * 
     * @param decklistUrl - Full Moxfield URL (e.g., "https://www.moxfield.com/decks/abc123")
     * @returns The deck ID portion, or null if URL doesn't match expected pattern
     */
    private extractDeckId(decklistUrl: string): string | null {
        const match = decklistUrl.match(MOXFIELD_URL_PATTERN);
        return match ? match[1] : null;
    }

    /**
     * Create a new ETL status record to track the current run.
     * 
     * @param status - Initial status (typically 'RUNNING')
     * @returns The ID of the created record, or null on error
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
     * 
     * If no ID is provided, attempts to update the most recent status record
     * (useful for error handling when the ID may not be available).
     * 
     * @param id - ETL status record ID (optional)
     * @param updates - Fields to update
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
        // Nothing to do if no ID and no status update
        if (!id && !updates?.status) {
            return;
        }

        try {
            if (id) {
                // Update specific record by ID
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
                // Fallback: update most recent record (for error handling)
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
     * 
     * This is used to determine the start date for incremental processing.
     * Only considers runs that actually processed records (records_processed > 0)
     * to avoid false positives from empty runs.
     * 
     * @returns Last completed ETL status, or null if none found
     */
    private async getLastCompletedEtlStatus(): Promise<EtlStatus | null> {
        const { data, error } = await supabaseServiceRole
            .from('etl_status')
            .select('*')
            .eq('status', ETL_STATUS.COMPLETED)
            .gt('records_processed', 0) // Only get statuses that actually processed records
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // PGRST116 = no rows returned - this is expected for first run
                return null;
            }
            this.logger.warn('Error fetching last ETL status', { error: error.message });
            return null;
        }

        // Map database columns to EtlStatus interface
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
     * Get the actual last processed tournament date from the processed_tournaments table.
     * 
     * This is more reliable than using etl_status.last_processed_date because it
     * reflects actual tournament data that was processed, not just ETL run metadata.
     * 
     * ## Handling Corrupted Dates
     * A previous bug caused some tournament_date values to be stored as 1970-01-01
     * (Unix epoch). This method filters out those corrupted dates by requiring
     * tournament_date > MIN_VALID_TOURNAMENT_YEAR.
     * 
     * If all tournament dates are corrupted, falls back to using processed_at
     * as an approximation of when tournaments occurred.
     * 
     * @returns Last processed tournament date in YYYY-MM-DD format, or null if none found
     */
    private async getLastProcessedTournamentDate(): Promise<string | null> {
        // Query for most recently processed tournament with a valid date
        // Uses processed_at ordering to get the most recent, then validates tournament_date
        const { data, error } = await supabaseServiceRole
            .from('processed_tournaments')
            .select('tournament_date, processed_at')
            .gt('tournament_date', MIN_VALID_TOURNAMENT_YEAR) // Filter out corrupted epoch dates
            .order('processed_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No valid tournament dates found - might all be corrupted
                // Fall back to processed_at as an approximation
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

        // Format and return the date
        const tournamentDate = format(parseISO(data.tournament_date), 'yyyy-MM-dd');
        this.logger.info('Found last processed tournament date', { 
            tournamentDate, 
            processedAt: data.processed_at 
        });
        return tournamentDate;
    }
}