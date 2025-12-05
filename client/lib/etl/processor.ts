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
 * 2. **Filter**: Identify tables with valid players and deck data
 * 3. **Transform**: Extract commanders, cards, seat positions, and calculate statistics
 * 4. **Load**: Upsert aggregated data into Supabase tables
 * 
 * ## Data Source
 * 
 * Topdeck provides tournament data with rounds containing tables.
 * Each table has players listed in seat order (0-3 = seats 1-4) with
 * deck data via their Scrollrack integration.
 * 
 * ## Processing
 * 
 * - Process each round's tables
 * - For each table, identify winner and seat positions
 * - Track seat position win rates for commanders
 * - Track card statistics per commander
 * 
 * @module EtlProcessor
 */

import { addDays, format, parseISO, subDays, subMonths } from 'date-fns';
import { createServiceRoleClient } from '@/lib/api/supabase';

// Create singleton for this module
const serviceRoleClient = createServiceRoleClient();
import { TopdeckClient } from '@/lib/api/topdeck';
import type {
    Tournament,
    TournamentTable,
    TablePlayer,
    TopdeckDeckObj,
} from '@/lib/types/etl';
import {
    DEFAULT_BATCH_SIZE,
    DEFAULT_CONCURRENCY_LIMIT,
    DEFAULT_LOOKBACK_DAYS,
    DEFAULT_SEED_MONTHS,
    WEEKLY_BATCH_DAYS,
    MIN_VALID_TOURNAMENT_YEAR,
    CURSOR_DELIMITER,
} from './constants';
import {
    generateCommanderId,
    generateCommanderName,
} from '@/lib/utils/commander';
import { etlLogger } from '@/lib/logger';

/**
 * Result of processing a single game/table
 */
interface GameResult {
    /** Player's Topdeck user ID */
    playerId: string;
    /** Player's deck object */
    deckObj: TopdeckDeckObj;
    /** Seat position (1-4) */
    seatPosition: number;
    /** Whether this player won the game */
    isWinner: boolean;
    /** Whether the game was a draw */
    isDraw: boolean;
}

/**
 * Main ETL processor class that orchestrates data extraction, transformation,
 * and loading from Topdeck API into the database.
 * 
 * Processes tournament rounds to track:
 * - Commander win rates
 * - Card statistics per commander
 * - Seat position win rates for commanders
 */
export default class EtlProcessor {
    private topdeckClient: TopdeckClient;
    private concurrencyLimit: number;
    private logger = etlLogger.child({ module: 'processor' });

    constructor() {
        this.topdeckClient = new TopdeckClient();
        this.concurrencyLimit = parseInt(
            process.env.ETL_CONCURRENCY_LIMIT || String(DEFAULT_CONCURRENCY_LIMIT), 
            10
        );
    }

    /**
     * Process data in batches with cursor support for resumable processing.
     * 
     * @param cursor - Resume cursor from previous batch, or null to start fresh
     * @param batchSize - Maximum records to process before returning (default: 50)
     * @returns Object containing nextCursor, recordsProcessed, and isComplete
     */
    async processBatch(
        cursor: string | null,
        batchSize: number = DEFAULT_BATCH_SIZE
    ): Promise<{ nextCursor: string | null; recordsProcessed: number; isComplete: boolean }> {
        try {
            let currentDate: string;
            let tournamentIdToSkipTo: string | null = null;
            let tableIndexToSkipTo = 0;

            if (cursor) {
                const [date, tournamentId, indexStr] = cursor.split(CURSOR_DELIMITER);
                currentDate = date;
                tournamentIdToSkipTo = tournamentId || null;
                tableIndexToSkipTo = indexStr ? parseInt(indexStr, 10) : 0;
            } else {
                const lastTournamentDate = await this.getLastProcessedTournamentDate();
                if (lastTournamentDate) {
                    currentDate = format(addDays(parseISO(lastTournamentDate), 1), 'yyyy-MM-dd');
                    this.logger.info('Starting from last processed tournament date', { lastTournamentDate, startingFrom: currentDate });
                } else {
                    currentDate = format(subDays(new Date(), DEFAULT_LOOKBACK_DAYS), 'yyyy-MM-dd');
                    this.logger.info('No previous data found, starting from lookback', { startingFrom: currentDate });
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
                
                for (const tournament of tournamentsToProcess) {
                    this.logger.debug('Processing tournament', { name: tournament.tournamentName, id: tournament.TID });

                    const { data: existingTournament } = await serviceRoleClient
                        .from('processed_tournaments')
                        .select('tournament_id, record_count')
                        .eq('tournament_id', tournament.TID)
                        .single();

                    if (existingTournament) {
                        this.logger.debug('Skipping already processed tournament', { name: tournament.tournamentName });
                        continue;
                    }

                    // Collect all tables from all rounds
                    const allTables = this.collectTables(tournament);
                    
                    this.logger.debug('Found tables', { tournament: tournament.tournamentName, count: allTables.length });

                    let tournamentRecordsProcessed = 0;
                    const startingIndex = (tournament.TID === tournamentIdToSkipTo) ? tableIndexToSkipTo : 0;

                    for (let tableIndex = startingIndex; tableIndex < allTables.length; tableIndex++) {
                        const table = allTables[tableIndex];
                        
                        try {
                            const processed = await this.processTable(table);
                            if (processed) {
                                recordsProcessed++;
                                tournamentRecordsProcessed++;
                            }
                            
                            if (recordsProcessed >= batchSize) {
                                nextCursor = `${currentDate}:${tournament.TID}:${tableIndex + 1}`;
                                batchComplete = false;
                                break;
                            }
                        } catch (error) {
                            this.logger.logError('Error processing table, skipping', error);
                        }
                    }

                    if (batchComplete && tournamentRecordsProcessed > 0) {
                        const tournamentDate = typeof tournament.startDate === 'string' 
                            ? new Date(parseInt(tournament.startDate) * 1000).toISOString()
                            : new Date(tournament.startDate * 1000).toISOString();
                        
                        await serviceRoleClient
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

            this.logger.info('Batch processing complete', { recordsProcessed, isComplete, nextCursor });

            return { nextCursor, recordsProcessed, isComplete };
        } catch (error) {
            this.logger.logError('Error in batch processing', error);
            throw error;
        }
    }

    /**
     * Process all tournament data within a date range.
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

            if (!startDate) {
                const lastTournamentDate = await this.getLastProcessedTournamentDate();
                if (lastTournamentDate) {
                    startDate = format(addDays(parseISO(lastTournamentDate), 1), 'yyyy-MM-dd');
                    this.logger.info('Starting from last processed tournament date', { lastTournamentDate, startingFrom: startDate });
                } else {
                    startDate = format(subMonths(new Date(), DEFAULT_SEED_MONTHS), 'yyyy-MM-dd');
                    this.logger.info('No previous data found, starting from seed date', { startingFrom: startDate });
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

                currentStartDate = format(addDays(parseISO(batchEndDate), 1), 'yyyy-MM-dd');
            }

            this.logger.info('ETL process completed successfully', { recordsProcessed });
        } catch (error) {
            this.logger.logError('Error in ETL process', error);
            throw error;
        }
    }

    /**
     * Collect all tables from all rounds in a tournament.
     */
    private collectTables(tournament: Tournament): TournamentTable[] {
        const tables: TournamentTable[] = [];
        
        if (!tournament.rounds) {
            return tables;
        }
        
        for (const round of tournament.rounds) {
            if (round.tables) {
                tables.push(...round.tables);
            }
        }
        
        return tables;
    }

    /**
     * Process a list of tournaments.
     * 
     * @param tournaments - Array of tournaments from Topdeck API
     * @returns Total number of tables processed
     */
    private async processTournaments(tournaments: Tournament[]): Promise<number> {
        let recordsProcessed = 0;

        for (const tournament of tournaments) {
            this.logger.debug('Processing tournament', { name: tournament.tournamentName, id: tournament.TID });

            const { data: existingTournament } = await serviceRoleClient
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

            const allTables = this.collectTables(tournament);
            
            this.logger.debug('Found tables', { tournament: tournament.tournamentName, count: allTables.length });

            let tournamentRecordsProcessed = 0;

            for (let i = 0; i < allTables.length; i += this.concurrencyLimit) {
                const batch = allTables.slice(i, i + this.concurrencyLimit);

                for (const table of batch) {
                    try {
                        const processed = await this.processTable(table);
                        if (processed) {
                            recordsProcessed++;
                            tournamentRecordsProcessed++;
                        }
                    } catch (error) {
                        this.logger.logError('Error processing table, skipping', error);
                    }
                }
            }

            if (tournamentRecordsProcessed > 0) {
                const tournamentDate = typeof tournament.startDate === 'string' 
                    ? new Date(parseInt(tournament.startDate) * 1000).toISOString()
                    : new Date(tournament.startDate * 1000).toISOString();
                
                await serviceRoleClient
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
     * Process a single table/game.
     * 
     * Extracts game results from the table and updates statistics.
     * 
     * @param table - Tournament table with players and winner
     * @returns true if the table was processed, false if skipped
     */
    private async processTable(table: TournamentTable): Promise<boolean> {
        try {
            if (!table.players || table.players.length === 0) {
                return false;
            }

            if (table.status !== 'Completed') {
                return false;
            }

            const isDraw = table.winner === 'Draw' || table.winner_id === 'Draw';
            const gameResults: GameResult[] = [];

            // Process each player at the table
            for (let seatIndex = 0; seatIndex < table.players.length; seatIndex++) {
                const player = table.players[seatIndex];
                
                if (!player.deckObj || !player.deckObj.Commanders || Object.keys(player.deckObj.Commanders).length === 0) {
                    continue;
                }

                const isWinner = !isDraw && player.id === table.winner_id;
                
                gameResults.push({
                    playerId: player.id,
                    deckObj: player.deckObj,
                    seatPosition: seatIndex + 1, // Convert 0-indexed to 1-indexed
                    isWinner,
                    isDraw
                });
            }

            if (gameResults.length === 0) {
                return false;
            }

            // Process each player's deck data
            for (const result of gameResults) {
                await this.processGameResult(result);
            }

            return true;
        } catch (error) {
            this.logger.logError('Error processing table', error);
            throw error;
        }
    }

    /**
     * Process a single player's game result.
     * 
     * Updates commander stats (including seat position) and card statistics.
     */
    private async processGameResult(result: GameResult): Promise<void> {
        try {
            const { deckObj, seatPosition, isWinner, isDraw } = result;
            
            // Validate deck
            if (!deckObj.Commanders || Object.keys(deckObj.Commanders).length === 0) {
                return;
            }

            if (!deckObj.Mainboard || Object.keys(deckObj.Mainboard).length === 0) {
                return;
            }

            const commanderId = generateCommanderId(deckObj.Commanders);
            const commanderName = generateCommanderName(deckObj.Commanders);

            // Fetch existing commander data
            const { data: existingCommander } = await serviceRoleClient
                .from('commanders')
                .select('*')
                .eq('id', commanderId)
                .single();

            // Prepare card data
            const allCards = Object.entries(deckObj.Mainboard).map(([cardName, entry]) => ({
                unique_card_id: entry.id,
                name: cardName,
                updated_at: new Date().toISOString()
            }));
            
            const allCardIds = allCards.map(card => card.unique_card_id);

            // Fetch existing statistics
            const { data: existingStatistics } = await serviceRoleClient
                .from('statistics')
                .select('*')
                .eq('commander_id', commanderId)
                .in('card_id', allCardIds);
            
            type StatRecord = { card_id: string; wins: number; losses: number; draws: number; entries: number };
            const statsMap: Record<string, StatRecord> = (existingStatistics || []).reduce((acc, stat) => {
                acc[stat.card_id] = stat;
                return acc;
            }, {} as Record<string, StatRecord>);

            // Calculate win/loss/draw increments
            const winIncrement = isWinner ? 1 : 0;
            const lossIncrement = (!isWinner && !isDraw) ? 1 : 0;
            const drawIncrement = isDraw ? 1 : 0;

            // Calculate seat position increments
            const seatWinKey = `seat${seatPosition}_wins` as const;
            const seatEntriesKey = `seat${seatPosition}_entries` as const;

            // Prepare commander update
            const newCommanderValues: Record<string, unknown> = {
                id: commanderId,
                name: commanderName,
                wins: (existingCommander?.wins || 0) + winIncrement,
                losses: (existingCommander?.losses || 0) + lossIncrement,
                draws: (existingCommander?.draws || 0) + drawIncrement,
                entries: (existingCommander?.entries || 0) + 1,
                seat1_wins: existingCommander?.seat1_wins || 0,
                seat1_entries: existingCommander?.seat1_entries || 0,
                seat2_wins: existingCommander?.seat2_wins || 0,
                seat2_entries: existingCommander?.seat2_entries || 0,
                seat3_wins: existingCommander?.seat3_wins || 0,
                seat3_entries: existingCommander?.seat3_entries || 0,
                seat4_wins: existingCommander?.seat4_wins || 0,
                seat4_entries: existingCommander?.seat4_entries || 0,
                updated_at: new Date().toISOString()
            };

            // Increment the appropriate seat position stats
            newCommanderValues[seatWinKey] = (existingCommander?.[seatWinKey] || 0) + winIncrement;
            newCommanderValues[seatEntriesKey] = (existingCommander?.[seatEntriesKey] || 0) + 1;

            // Prepare statistics records
            const allStatistics = allCardIds.map(cardId => {
                const existingStat = statsMap[cardId];
                
                return {
                    commander_id: commanderId,
                    card_id: cardId,
                    wins: (existingStat?.wins || 0) + winIncrement,
                    losses: (existingStat?.losses || 0) + lossIncrement,
                    draws: (existingStat?.draws || 0) + drawIncrement,
                    entries: (existingStat?.entries || 0) + 1,
                    updated_at: new Date().toISOString()
                };
            });

            // Batch upsert all data
            const { error } = await serviceRoleClient.rpc('batch_upsert_deck_data', {
                commander_data: newCommanderValues,
                cards_data: allCards,
                stats_data: allStatistics
            });
            
            if (error) {
                this.logger.debug('RPC batch operation failed, using fallback', { error: error.message });
                
                const commanderResult = await serviceRoleClient
                    .from('commanders')
                    .upsert(newCommanderValues, { onConflict: 'id' });
                    
                if (commanderResult.error) {
                    this.logger.warn('Error upserting commander', { error: commanderResult.error.message });
                }
                
                const cardsResult = await serviceRoleClient
                    .from('cards')
                    .upsert(allCards, { onConflict: 'unique_card_id' });
                    
                if (cardsResult.error) {
                    this.logger.warn('Error upserting cards', { error: cardsResult.error.message });
                }
                
                const statsResult = await serviceRoleClient
                    .from('statistics')
                    .upsert(allStatistics, { onConflict: 'commander_id,card_id' });
                    
                if (statsResult.error) {
                    this.logger.warn('Error upserting statistics', { error: statsResult.error.message });
                }
            }

            this.logger.debug('Game result processed', {
                commander: commanderName,
                seat: seatPosition,
                isWinner,
                isDraw,
                cardsCount: allCards.length
            });
        } catch (error) {
            this.logger.logError('Error processing game result', error);
        }
    }

    /**
     * Get the actual last processed tournament date from the processed_tournaments table.
     */
    private async getLastProcessedTournamentDate(): Promise<string | null> {
        const { data, error } = await serviceRoleClient
            .from('processed_tournaments')
            .select('tournament_date, processed_at')
            .gt('tournament_date', MIN_VALID_TOURNAMENT_YEAR)
            .order('processed_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                const { data: fallbackData } = await serviceRoleClient
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
