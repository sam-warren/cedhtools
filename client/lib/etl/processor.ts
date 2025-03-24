import { TopdeckClient, MoxfieldClient } from './api-clients';
import { supabaseServer } from '../supabase';
import {
    Tournament,
    TournamentStanding,
    MoxfieldDeck,
    Commander,
    Card,
    Statistic,
    EtlStatus,
    MoxfieldCard
} from './types';
import { addDays, format, subMonths, parseISO, subDays } from 'date-fns';

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

            console.log(`Starting ETL process from ${startDate} to ${endDate}`);

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

                console.log(`Processing batch from ${currentStartDate} to ${batchEndDate}`);

                // Fetch tournaments for the current batch
                const tournaments = await this.topdeckClient.fetchTournaments(
                    currentStartDate,
                    batchEndDate
                );

                console.log(`Found ${tournaments.length} tournaments`);

                // Process the tournaments and their decklists
                const batchRecordsProcessed = await this.processTournaments(tournaments);
                recordsProcessed += batchRecordsProcessed;

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

            console.log(`ETL process completed successfully. Processed ${recordsProcessed} records.`);
        } catch (error) {
            console.error('Error in ETL process:', error);

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
            // Extract Moxfield deck ID from the decklist URL
            const deckId = this.extractDeckId(standing.decklist);

            if (!deckId) {
                console.warn(`Invalid Moxfield URL: ${standing.decklist}`);
                return;
            }

            // Fetch the deck from Moxfield - let rate limit errors propagate to retry logic
            const deck = await this.moxfieldClient.fetchDeck(deckId);

            if (!deck) {
                console.warn(`Deck not found: ${deckId}`);
                return;
            }

            // Process the deck data
            await this.processDeck(deck, standing);
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
            // Extract commander(s) from the deck
            const commanderCards = deck.commanders.cards;

            if (commanderCards.length === 0) {
                console.warn(`Deck has no commanders`);
                return;
            }

            // Identify the commander or commander pair
            const commanderId = this.generateCommanderId(commanderCards);
            const commanderName = this.generateCommanderName(commanderCards);

            // Upsert the commander into the database
            await this.upsertCommander({
                id: commanderId,
                name: commanderName,
                wins: standing.wins,
                losses: standing.losses,
                draws: standing.draws,
                entries: 1
            });

            // Process each card in the mainboard
            for (const cardEntry of deck.mainboard.cards) {
                const card: Card = {
                    uniqueCardId: cardEntry.card.uniqueCardId,
                    name: cardEntry.card.name,
                    scryfallId: cardEntry.card.scryfallId,
                    type: cardEntry.card.type,
                    type_line: cardEntry.card.type_line
                };

                // Upsert the card
                await this.upsertCard(card);

                // Upsert the statistics
                await this.upsertStatistic({
                    commanderId,
                    cardId: card.uniqueCardId,
                    wins: standing.wins,
                    losses: standing.losses,
                    draws: standing.draws,
                    entries: 1
                });
            }
        } catch (error) {
            console.error(`Error processing deck:`, error);
        }
    }

    private generateCommanderId(commanderCards: MoxfieldCard[]): string {
        // Sort by uniqueCardId to ensure consistent ordering
        const sortedCards = [...commanderCards].sort((a, b) =>
            a.card.uniqueCardId.localeCompare(b.card.uniqueCardId)
        );

        return sortedCards.map(card => card.card.uniqueCardId).join('_');
    }

    private generateCommanderName(commanderCards: MoxfieldCard[]): string {
        return commanderCards.map(card => card.card.name).join(' + ');
    }

    private extractDeckId(decklistUrl: string): string | null {
        const match = decklistUrl.match(/moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    }

    private async upsertCommander(commander: Commander): Promise<void> {
        // First get the existing commander if it exists
        const { data: existingCommander } = await supabaseServer
            .from('commanders')
            .select('*')
            .eq('id', commander.id)
            .single();

        // Calculate the new values
        const newValues = {
            id: commander.id,
            name: commander.name,
            wins: (existingCommander?.wins || 0) + commander.wins,
            losses: (existingCommander?.losses || 0) + commander.losses,
            draws: (existingCommander?.draws || 0) + commander.draws,
            entries: (existingCommander?.entries || 0) + commander.entries,
            updated_at: new Date().toISOString()
        };

        // Upsert with the calculated values
        const { error } = await supabaseServer
            .from('commanders')
            .upsert(newValues, { onConflict: 'id' });

        if (error) {
            console.error(`Error upserting commander:`, error);
            throw error;
        }
    }

    private async upsertCard(card: Card): Promise<void> {
        const { error } = await supabaseServer
            .from('cards')
            .upsert(
                {
                    unique_card_id: card.uniqueCardId,
                    name: card.name,
                    scryfall_id: card.scryfallId,
                    type: card.type,
                    type_line: card.type_line,
                    updated_at: new Date().toISOString()
                },
                {
                    onConflict: 'unique_card_id'
                }
            );

        if (error) {
            console.error(`Error upserting card:`, error);
            throw error;
        }
    }

    private async upsertStatistic(statistic: Statistic): Promise<void> {
        // First get the existing statistic if it exists
        const { data: existingStat } = await supabaseServer
            .from('statistics')
            .select('*')
            .eq('commander_id', statistic.commanderId)
            .eq('card_id', statistic.cardId)
            .single();

        // Calculate the new values
        const newValues = {
            commander_id: statistic.commanderId,
            card_id: statistic.cardId,
            wins: (existingStat?.wins || 0) + statistic.wins,
            losses: (existingStat?.losses || 0) + statistic.losses,
            draws: (existingStat?.draws || 0) + statistic.draws,
            entries: (existingStat?.entries || 0) + statistic.entries,
            updated_at: new Date().toISOString()
        };

        // Upsert with the calculated values
        const { error } = await supabaseServer
            .from('statistics')
            .upsert(newValues, { onConflict: 'commander_id,card_id' });

        if (error) {
            console.error(`Error upserting statistic:`, error);
            throw error;
        }
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