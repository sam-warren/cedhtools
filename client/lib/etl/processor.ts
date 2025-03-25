import { addDays, format, parseISO, subDays, subMonths } from 'date-fns';
import { supabaseServer } from '../supabase';
import { MoxfieldClient, TopdeckClient } from './api-clients';
import {
    EtlStatus,
    MoxfieldCardEntry,
    MoxfieldDeck,
    Tournament,
    TournamentStanding
} from './types';

export default class EtlProcessor {
    private topdeckClient: TopdeckClient;
    private moxfieldClient: MoxfieldClient;
    private concurrencyLimit: number;

    constructor() {
        this.topdeckClient = new TopdeckClient();
        this.moxfieldClient = new MoxfieldClient();
        this.concurrencyLimit = parseInt(process.env.ETL_CONCURRENCY_LIMIT || '5', 10);
    }

    /**
     * Process data in batches with cursor support
     * This method is used by the worker to process data in smaller batches that fit within time constraints
     * 
     * @param cursor Optional cursor to resume processing from (tournament id or date)
     * @param batchSize Maximum number of records to process in this batch
     * @returns Information about the processed batch and next cursor
     */
    async processBatch(
        cursor: string | null,
        batchSize: number = 50
    ): Promise<{ nextCursor: string | null; recordsProcessed: number; isComplete: boolean }> {
        try {
            // Create a new ETL status record
            const etlStatusId = await this.createEtlStatus('RUNNING');

            if (!etlStatusId) {
                throw new Error('Failed to create ETL status record');
            }

            // Parse the cursor if provided
            let currentDate: string;
            let currentTournamentIndex = 0;
            let tournamentIdToSkipTo: string | null = null;

            if (cursor) {
                // Cursor format: YYYY-MM-DD:tournamentId:index
                const [date, tournamentId, indexStr] = cursor.split(':');
                currentDate = date;
                tournamentIdToSkipTo = tournamentId || null;
                currentTournamentIndex = indexStr ? parseInt(indexStr, 10) : 0;
            } else {
                // If no cursor, get the last processed date or default to 7 days ago
                const lastEtlStatus = await this.getLastCompletedEtlStatus();
                currentDate = lastEtlStatus?.lastProcessedDate
                    ? format(addDays(parseISO(lastEtlStatus.lastProcessedDate), 1), 'yyyy-MM-dd')
                    : format(subDays(new Date(), 7), 'yyyy-MM-dd');
            }

            // Default end date is today
            const endDate = format(new Date(), 'yyyy-MM-dd');
            
            let recordsProcessed = 0;
            let nextCursor: string | null = null;
            let isComplete = false;

            // Process just one day's worth of data per batch
            // This provides natural chunking for the batches
            if (currentDate <= endDate) {
                console.log(`Processing batch for date ${currentDate}`);

                // Fetch tournaments for the current date
                const tournaments = await this.topdeckClient.fetchTournaments(
                    currentDate,
                    currentDate
                );

                console.log(`Found ${tournaments.length} tournaments for ${currentDate}`);

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
                    
                    console.log(`Processing tournament: ${tournament.tournamentName} (ID: ${tournament.TID})`);

                    // Check if tournament has already been processed
                    const { data: existingTournament } = await supabaseServer
                        .from('processed_tournaments')
                        .select('tournament_id, record_count')
                        .eq('tournament_id', tournament.TID)
                        .single();

                    if (existingTournament) {
                        console.log(`Skipping already processed tournament: ${tournament.tournamentName}`);
                        continue;
                    }

                    // Filter standings to only include those with Moxfield decklists
                    const moxfieldStandings = tournament.standings.filter(
                        standing => standing.decklist && standing.decklist.includes('moxfield.com/decks/')
                    );

                    console.log(`Found ${moxfieldStandings.length} Moxfield decklists in tournament ${tournament.tournamentName}`);

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
                                    console.log(`Rate limited, setting cursor and pausing...`);
                                    
                                    // Set cursor to current position
                                    nextCursor = `${currentDate}:${tournament.TID}:${standingIndex}`;
                                    batchComplete = false;
                                    break;
                                } else {
                                    // For other errors, just log and continue with next item
                                    console.error(`Error processing standing, skipping:`, error);
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
                        await supabaseServer
                            .from('processed_tournaments')
                            .insert({
                                tournament_id: tournament.TID,
                                tournament_date: new Date(tournament.startDate).toISOString(),
                                name: tournament.tournamentName,
                                record_count: tournamentRecordsProcessed,
                                processed_at: new Date().toISOString()
                            });

                        console.log(`Marked tournament ${tournament.tournamentName} as processed with ${tournamentRecordsProcessed} records`);
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

            // Update the ETL status record
            await this.updateEtlStatus(etlStatusId, {
                status: 'COMPLETED',
                endDate: new Date().toISOString(),
                recordsProcessed,
                lastProcessedDate: currentDate
            });

            return { nextCursor, recordsProcessed, isComplete };
        } catch (error) {
            console.error('Error in batch processing:', error);

            // Update any ETL status to failed
            await this.updateEtlStatus(undefined, {
                status: 'FAILED',
                endDate: new Date().toISOString()
            });

            throw error;
        }
    }

    async processData(
        startDate?: string,
        endDate?: string,
    ): Promise<void> {
        try {
            console.log('[Processor] Starting ETL process...');
            
            // Create a new ETL status record
            const etlStatusId = await this.createEtlStatus('RUNNING');

            if (!etlStatusId) {
                throw new Error('Failed to create ETL status record');
            }

            // If no dates provided, get the last processed date or default to 6 months ago
            if (!startDate) {
                const lastEtlStatus = await this.getLastCompletedEtlStatus();
                startDate = lastEtlStatus?.lastProcessedDate
                    ? format(addDays(parseISO(lastEtlStatus.lastProcessedDate), 1), 'yyyy-MM-dd')
                    : format(subMonths(new Date(), 6), 'yyyy-MM-dd');
            }

            // If no end date, use today
            if (!endDate) {
                endDate = format(new Date(), 'yyyy-MM-dd');
            }

            console.log(`[Processor] Processing data from ${startDate} to ${endDate}`);

            let currentStartDate = startDate;
            let recordsProcessed = 0;

            // Process data in weekly batches to avoid overwhelming the API
            while (currentStartDate <= endDate) {
                // Calculate the end of the current batch (7 days later or the overall end date)
                const batchEndDate = format(
                    new Date(Math.min(
                        addDays(parseISO(currentStartDate), 7).getTime(),
                        parseISO(endDate).getTime()
                    )),
                    'yyyy-MM-dd'
                );

                console.log(`[Processor] Processing batch from ${currentStartDate} to ${batchEndDate}`);

                // Fetch tournaments for the current batch
                console.log(`[Processor] Fetching tournaments from Topdeck...`);
                const tournaments = await this.topdeckClient.fetchTournaments(
                    currentStartDate,
                    batchEndDate
                );

                console.log(`[Processor] Found ${tournaments.length} tournaments`);

                // Process the tournaments and their decklists
                console.log(`[Processor] Starting to process tournaments...`);
                const batchRecordsProcessed = await this.processTournaments(tournaments);
                recordsProcessed += batchRecordsProcessed;

                console.log(`[Processor] Processed ${batchRecordsProcessed} records in this batch. Total: ${recordsProcessed}`);

                // Update the ETL status record
                await this.updateEtlStatus(etlStatusId, {
                    recordsProcessed,
                    lastProcessedDate: batchEndDate
                });

                // Move to the next batch
                currentStartDate = format(addDays(parseISO(batchEndDate), 1), 'yyyy-MM-dd');
            }

            // Mark the ETL process as completed
            await this.updateEtlStatus(etlStatusId, {
                status: 'COMPLETED',
                endDate: new Date().toISOString()
            });

            console.log(`[Processor] ETL process completed successfully. Processed ${recordsProcessed} records.`);
        } catch (error) {
            console.error('[Processor] Error in ETL process:', error);

            // Update the ETL status to failed
            if (error instanceof Error) {
                await this.updateEtlStatus(undefined, {
                    status: 'FAILED',
                    endDate: new Date().toISOString()
                });
            }

            throw error;
        }
    }

    private async processTournaments(tournaments: Tournament[]): Promise<number> {
        let recordsProcessed = 0;

        for (const tournament of tournaments) {
            console.log(`Processing tournament: ${tournament.tournamentName} (ID: ${tournament.TID})`);

            // Check if tournament has already been processed
            const { data: existingTournament } = await supabaseServer
                .from('processed_tournaments')
                .select('tournament_id, record_count')
                .eq('tournament_id', tournament.TID)
                .single();

            if (existingTournament) {
                console.log(`Skipping already processed tournament: ${tournament.tournamentName} (ID: ${tournament.TID}) with ${existingTournament.record_count} records`);
                continue;
            }

            // Filter standings to only include those with Moxfield decklists
            const moxfieldStandings = tournament.standings.filter(
                standing => standing.decklist && standing.decklist.includes('moxfield.com/decks/')
            );

            console.log(`Found ${moxfieldStandings.length} Moxfield decklists in tournament ${tournament.tournamentName}`);

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
                            // For rate limiting errors, we need to pause and retry the same standing
                            console.log(`Rate limited, retrying standing after backoff...`);
                            i -= this.concurrencyLimit; // Move back to retry this batch

                            // Wait a bit before retrying (this should rarely happen since fetchDeck has its own retry logic)
                            await new Promise(resolve => setTimeout(resolve, 30000)); // 30s additional pause
                            break; // Exit the batch loop to retry
                        } else {
                            // For other errors, just log and continue with next item
                            console.error(`Error processing standing, skipping:`, error);
                        }
                    }
                }
            }

            // Mark tournament as processed
            if (tournamentRecordsProcessed > 0) {
                await supabaseServer
                    .from('processed_tournaments')
                    .insert({
                        tournament_id: tournament.TID,
                        tournament_date: new Date(tournament.startDate).toISOString(),
                        name: tournament.tournamentName,
                        record_count: tournamentRecordsProcessed,
                        processed_at: new Date().toISOString()
                    });

                console.log(`Marked tournament ${tournament.tournamentName} as processed with ${tournamentRecordsProcessed} records`);
            }
        }

        return recordsProcessed;
    }

    private async processStanding(standing: TournamentStanding): Promise<void> {
        try {
            const startTime = Date.now();
            
            // Extract Moxfield deck ID from the decklist URL
            const deckId = this.extractDeckId(standing.decklist);

            if (!deckId) {
                console.warn(`Invalid Moxfield URL: ${standing.decklist}`);
                return;
            }

            // Fetch the deck from Moxfield - let rate limit errors propagate to retry logic
            console.log(`[PERF] Starting fetch for deck ${deckId}...`);
            const fetchStartTime = Date.now();
            const deck = await this.moxfieldClient.fetchDeck(deckId);
            const fetchEndTime = Date.now();
            console.log(`[PERF] Fetch for deck ${deckId} took ${fetchEndTime - fetchStartTime}ms`);

            if (!deck) {
                console.warn(`Deck not found: ${deckId}`);
                return;
            }

            // Process the deck data
            console.log(`[PERF] Starting processing for deck ${deckId}...`);
            const processStartTime = Date.now();
            await this.processDeck(deck, standing);
            const processEndTime = Date.now();
            
            const totalTime = processEndTime - startTime;
            console.log(`[PERF] Processing deck ${deckId} took ${processEndTime - processStartTime}ms`);
            console.log(`[PERF] Total time for deck ${deckId}: ${totalTime}ms (Fetch: ${fetchEndTime - fetchStartTime}ms, Process: ${processEndTime - processStartTime}ms)`);
        } catch (error) {
            console.error(`Error processing standing:`, error);
            // Re-throw rate limit errors so they can be properly handled
            if (error instanceof Error &&
                (error.message.includes('429') || error.message.includes('Too Many Requests'))) {
                throw error;
            }
            // For other errors, continue processing
        }
    }

    private async processDeck(
        deck: MoxfieldDeck,
        standing: TournamentStanding
    ): Promise<void> {
        try {
            const startTime = Date.now();
            let dbOperationsTime = 0;
            
            // First check if deck exists
            if (!deck) {
                console.warn(`Deck is null or undefined`);
                return;
            }

            // Check if deck has boards property
            if (!deck.boards) {
                console.warn(`Deck has no boards property`);
                return;
            }

            // Check if commanders board exists
            if (!deck.boards.commanders) {
                console.warn(`Deck has no commanders board`);
                return;
            }

            // Extract commanders - in the API, cards is an object map not an array
            const commanderCardsObj = deck.boards.commanders.cards || {};
            const commanderCards = Object.values(commanderCardsObj);
            
            if (commanderCards.length === 0) {
                console.warn(`Deck has no commanders`);
                return;
            }

            // Identify the commander or commander pair
            const commanderId = this.generateCommanderId(commanderCards);
            const commanderName = this.generateCommanderName(commanderCards);

            // Prepare to batch process all cards
            if (!deck.boards.mainboard || !deck.boards.mainboard.cards) {
                console.warn(`Deck has no mainboard cards`);
                return;
            }

            // Process all cards in the mainboard at once
            const mainboardCards = Object.values(deck.boards.mainboard.cards);
            console.log(`[PERF] Processing ${mainboardCards.length} cards in mainboard`);
            
            const cardProcessingStart = Date.now();
            
            // Step 1: Fetch the commander data
            const commanderFetchStart = Date.now();
            const { data: existingCommander } = await supabaseServer
                .from('commanders')
                .select('*')
                .eq('id', commanderId)
                .single();
            
            const commanderFetchTime = Date.now() - commanderFetchStart;
            dbOperationsTime += commanderFetchTime;
            
            // Step 2: Prepare all cards data for batch operations
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
            
            // Get all card IDs for fetching existing statistics
            const allCardIds = allCards.map(card => card!.unique_card_id);
            
            // Step 3: Fetch all existing statistics in one query
            const statsFetchStart = Date.now();
            const { data: existingStatistics } = await supabaseServer
                .from('statistics')
                .select('*')
                .eq('commander_id', commanderId)
                .in('card_id', allCardIds);
            
            const statsFetchTime = Date.now() - statsFetchStart;
            dbOperationsTime += statsFetchTime;
            
            // Create a map for faster lookups
            const statsMap = (existingStatistics || []).reduce((acc, stat) => {
                acc[stat.card_id] = stat;
                return acc;
            }, {});
            
            // Step 4: Calculate new commander values
            const newCommanderValues = {
                id: commanderId,
                name: commanderName,
                wins: (existingCommander?.wins || 0) + standing.wins,
                losses: (existingCommander?.losses || 0) + standing.losses,
                draws: (existingCommander?.draws || 0) + standing.draws,
                entries: (existingCommander?.entries || 0) + 1,
                updated_at: new Date().toISOString()
            };
            
            // Step 5: Prepare all statistics records
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
            
            // Step 6: Execute batch operations
            const batchUpsertStart = Date.now();
            
            // Use a transaction to ensure data consistency
            const { error } = await supabaseServer.rpc('batch_upsert_deck_data', {
                commander_data: newCommanderValues,
                cards_data: allCards,
                stats_data: allStatistics
            });
            
            if (error) {
                // If RPC fails, fall back to standard batch operations
                console.warn(`RPC batch operation failed: ${error.message}. Falling back to standard batch operations.`);
                
                // Perform batch operations in sequence
                const commanderResult = await supabaseServer
                    .from('commanders')
                    .upsert(newCommanderValues, { onConflict: 'id' });
                    
                if (commanderResult.error) {
                    console.error(`Error upserting commander: ${commanderResult.error.message}`);
                }
                
                const cardsResult = await supabaseServer
                    .from('cards')
                    .upsert(allCards, { onConflict: 'unique_card_id' });
                    
                if (cardsResult.error) {
                    console.error(`Error upserting cards: ${cardsResult.error.message}`);
                }
                
                const statsResult = await supabaseServer
                    .from('statistics')
                    .upsert(allStatistics, { onConflict: 'commander_id,card_id' });
                    
                if (statsResult.error) {
                    console.error(`Error upserting statistics: ${statsResult.error.message}`);
                }
            }
            
            const batchUpsertTime = Date.now() - batchUpsertStart;
            dbOperationsTime += batchUpsertTime;
            
            const cardProcessingEnd = Date.now();
            const totalProcessingTime = cardProcessingEnd - startTime;
            const nonDbTime = totalProcessingTime - dbOperationsTime;
            
            console.log(`[PERF] Card processing complete in ${cardProcessingEnd - cardProcessingStart}ms`);
            console.log(`[PERF] Deck processing summary:
            - Total time: ${totalProcessingTime}ms
            - DB operations: ${dbOperationsTime}ms (${Math.round(dbOperationsTime/totalProcessingTime*100)}%)
            - Command fetch: ${commanderFetchTime}ms
            - Stats fetch: ${statsFetchTime}ms
            - Batch upsert: ${batchUpsertTime}ms
            - Other processing: ${nonDbTime}ms (${Math.round(nonDbTime/totalProcessingTime*100)}%)
            - Cards processed: ${allCards.length}
            - Avg time per card: ${allCards.length > 0 ? Math.round(dbOperationsTime/allCards.length) : 0}ms`);
        } catch (error) {
            console.error(`Error processing deck:`, error);
        }
    }

    private generateCommanderId(commanderCards: MoxfieldCardEntry[]): string {
        // Sort by uniqueCardId to ensure consistent ordering
        const sortedCards = [...commanderCards].sort((a, b) =>
            (a.card.uniqueCardId || '').localeCompare(b.card.uniqueCardId || '')
        );

        return sortedCards.map(card => card.card.uniqueCardId || '').join('_');
    }

    private generateCommanderName(commanderCards: MoxfieldCardEntry[]): string {
        return commanderCards.map(card => card.card.name || 'Unknown Commander').join(' + ');
    }

    private extractDeckId(decklistUrl: string): string | null {
        const match = decklistUrl.match(/moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    }

    private async createEtlStatus(status: 'RUNNING' | 'COMPLETED' | 'FAILED'): Promise<number | null> {
        const { data, error } = await supabaseServer
            .from('etl_status')
            .insert({
                start_date: new Date().toISOString(),
                status,
                records_processed: 0
            })
            .select('id')
            .single();

        if (error) {
            console.error(`Error creating ETL status:`, error);
            return null;
        }

        return data.id;
    }

    private async updateEtlStatus(
        id?: number,
        updates?: Partial<{
            status: 'RUNNING' | 'COMPLETED' | 'FAILED';
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
                const { error } = await supabaseServer
                    .from('etl_status')
                    .update({
                        status: updates?.status,
                        end_date: updates?.endDate,
                        records_processed: updates?.recordsProcessed,
                        last_processed_date: updates?.lastProcessedDate,
                    })
                    .eq('id', id);

                if (error) {
                    console.error(`Error updating ETL status:`, error);
                }
            } else {
                // If no ID provided, update the most recent ETL status with the given status
                const { error } = await supabaseServer
                    .from('etl_status')
                    .update({
                        status: updates?.status,
                        end_date: updates?.endDate,
                    })
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (error) {
                    console.error(`Error updating ETL status:`, error);
                }
            }
        } catch (error) {
            console.error(`Error updating ETL status:`, error);
        }
    }

    private async getLastCompletedEtlStatus(): Promise<EtlStatus | null> {
        const { data, error } = await supabaseServer
            .from('etl_status')
            .select('*')
            .eq('status', 'COMPLETED')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No data found
                return null;
            }
            console.error(`Error fetching last ETL status:`, error);
            return null;
        }

        return {
            id: data.id,
            startDate: data.start_date,
            endDate: data.end_date,
            status: data.status,
            recordsProcessed: data.records_processed,
            lastProcessedDate: data.last_processed_date
        };
    }
}