/**
 * Commander Detail API Route
 * 
 * GET /api/commanders/[id] - Get commander stats and top cards
 * 
 * Returns detailed commander statistics including:
 * - Commander win rate, entries, wins/losses/draws
 * - Seat position win rates
 * - Top cards played with this commander (by inclusion rate)
 * - Card statistics (win rate, inclusion rate, win rate differential)
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/api/supabase';
import { apiLogger } from '@/lib/logger';
import { NotFoundError, createErrorResponse } from '@/lib/errors';
import { calculateWinRate, calculateInclusionRate, calculateConfidence } from '@/lib/utils/statistics';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
    const logger = apiLogger.child({ route: 'commanders/[id]' });
    const { id } = await params;
    
    try {
        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const topCardsLimit = parseInt(searchParams.get('topCards') || '50', 10);

        // Create Supabase client
        const cookieStore = await cookies();
        const supabase = createServerClient(cookieStore);

        // Fetch commander data (including seat position stats)
        const { data: commander, error: commanderError } = await supabase
            .from('commanders')
            .select('*')
            .eq('id', id)
            .single();

        if (commanderError || !commander) {
            throw new NotFoundError('Commander', id);
        }

        // Calculate commander win rate
        const commanderWinRate = calculateWinRate(
            commander.wins,
            commander.losses,
            commander.draws
        );

        // Calculate seat position win rates
        const seatStats = [1, 2, 3, 4].map(seat => {
            const winsKey = `seat${seat}_wins` as keyof typeof commander;
            const entriesKey = `seat${seat}_entries` as keyof typeof commander;
            const wins = commander[winsKey] as number || 0;
            const entries = commander[entriesKey] as number || 0;
            const winRate = entries > 0 ? (wins / entries) * 100 : 0;
            
            return {
                seat,
                wins,
                entries,
                winRate: parseFloat(winRate.toFixed(2))
            };
        });

        // Fetch top cards for this commander
        const { data: cardStats, error: statsError } = await supabase
            .from('statistics')
            .select(`
                card_id,
                wins,
                losses,
                draws,
                entries,
                cards:card_id (
                    unique_card_id,
                    name
                )
            `)
            .eq('commander_id', id)
            .order('entries', { ascending: false })
            .limit(topCardsLimit);

        if (statsError) {
            logger.warn('Error fetching card statistics', { error: statsError.message });
        }

        // Process card statistics
        const topCards = (cardStats || []).map(stat => {
            const cardWinRate = calculateWinRate(stat.wins, stat.losses, stat.draws);
            const inclusionRate = calculateInclusionRate(stat.entries, commander.entries);
            const winRateDiff = cardWinRate - commanderWinRate;
            const confidence = calculateConfidence(
                stat.wins, stat.losses, stat.draws, stat.entries,
                commander.wins, commander.losses, commander.draws, commander.entries
            );

            // Handle the case where cards might be an array or single object
            const cardData = Array.isArray(stat.cards) ? stat.cards[0] : stat.cards;

            return {
                id: stat.card_id,
                name: cardData?.name || 'Unknown Card',
                stats: {
                    wins: stat.wins,
                    losses: stat.losses,
                    draws: stat.draws,
                    entries: stat.entries,
                    winRate: parseFloat(cardWinRate.toFixed(2)),
                    inclusionRate: parseFloat(inclusionRate.toFixed(2)),
                    winRateDiff: parseFloat(winRateDiff.toFixed(2)),
                    confidence: confidence || 0
                }
            };
        });

        logger.debug('Commander detail fetched', { 
            commanderId: id, 
            topCardsCount: topCards.length 
        });

        return NextResponse.json({
            commander: {
                id: commander.id,
                name: commander.name,
                wins: commander.wins,
                losses: commander.losses,
                draws: commander.draws,
                entries: commander.entries,
                winRate: parseFloat(commanderWinRate.toFixed(2)),
                seatStats
            },
            topCards,
            totalCards: topCards.length
        });

    } catch (error) {
        logger.logError('Error fetching commander detail', error);
        return createErrorResponse(error);
    }
}
