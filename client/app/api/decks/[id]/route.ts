/**
 * Deck Analysis API Route
 * 
 * GET /api/decks/[id] - Analyze a Moxfield deck against tournament statistics
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { MoxfieldClient } from '@/lib/etl/api-clients';
import { calculateConfidence, calculateWinRate, calculateInclusionRate } from '@/lib/utils/statistics';
import { generateCommanderId } from '@/lib/utils/commander';
import { apiLogger } from '@/lib/logger';
import { 
    ValidationError, 
    NotFoundError, 
    createErrorResponse,
    isAppError 
} from '@/lib/errors';
import { deckIdSchema, validate } from '@/lib/validations/schemas';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const logger = apiLogger.child({ route: 'decks/[id]' });
    
    try {
        const { id: deckId } = await params;

        // Validate deck ID format
        const validation = validate(deckIdSchema, deckId);
        if (!validation.success) {
            throw new ValidationError('Invalid deck ID format', { 
                deckId, 
                error: validation.error 
            });
        }

        // Create Supabase client with cookie handling
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => [...cookieStore.getAll()],
                    setAll: (cookies) => {
                        cookies.map((cookie) => {
                            cookieStore.set(cookie.name, cookie.value, cookie.options);
                        });
                    }
                },
            }
        );

        // Fetch deck from Moxfield
        const moxfieldClient = new MoxfieldClient();
        const deck = await moxfieldClient.fetchDeck(deckId);

        if (!deck) {
            throw new NotFoundError('Deck', deckId);
        }

        // Extract commander cards
        const commanderCardsObj = deck.boards.commanders.cards || {};
        const commanderCards = Object.values(commanderCardsObj);
        
        if (!commanderCards || commanderCards.length === 0) {
            throw new ValidationError('No commanders found in deck', { deckId });
        }

        // Generate consistent commander ID
        const commanderId = generateCommanderId(commanderCards);

        // Track analysis for authenticated users
        const { data: { user } } = await supabase.auth.getUser();
        logger.debug('User authentication status', { authenticated: !!user });

        if (user) {
            await trackDeckAnalysis(supabase, user.id, deckId, commanderId, deck.name, logger);
        }

        // Fetch commander statistics
        const { data: commanderData } = await supabase
            .from('commanders')
            .select('*')
            .eq('id', commanderId)
            .single();

        if (!commanderData) {
            // Return partial response with deck info but no stats
            logger.info('Commander not found in database', { commanderId });
            return NextResponse.json(buildPartialResponse(deckId, deck, commanderCards));
        }

        // Fetch card statistics
        const { data: cardStats } = await supabase
            .from('statistics')
            .select(`*, cards:card_id(unique_card_id, name, scryfall_id, type, type_line)`)
            .eq('commander_id', commanderId);

        // Fetch card data for cards without statistics
        const deckCardIds = Object.values(deck.boards.mainboard.cards || {})
            .map(card => card.card.uniqueCardId || '');
        
        const { data: cardData } = await supabase
            .from('cards')
            .select('*')
            .in('unique_card_id', deckCardIds);

        // Calculate commander win rate
        const commanderWinRate = calculateWinRate(
            commanderData.wins, 
            commanderData.losses, 
            commanderData.draws
        );

        // Process deck cards with statistics
        const deckCards = processMainboardCards(
            deck.boards.mainboard.cards || {},
            cardStats,
            cardData,
            commanderData,
            commanderWinRate
        );

        // Group cards by type
        const cardsByType = groupCardsByType(deckCards);

        // Get cards not in the current deck
        const otherCards = getOtherCards(
            cardStats,
            deckCards.map(c => c.id),
            commanderData,
            commanderWinRate
        );

        logger.info('Deck analysis completed', { 
            deckId, 
            commanderId, 
            cardsAnalyzed: deckCards.length 
        });

        return NextResponse.json({
            deck: {
                id: deckId,
                name: deck.name,
                commanders: commanderCards.map(c => ({
                    name: c.card.name,
                    id: c.card.uniqueCardId
                })),
            },
            commanderStats: {
                id: commanderId,
                name: commanderData.name,
                wins: commanderData.wins,
                losses: commanderData.losses,
                draws: commanderData.draws,
                entries: commanderData.entries,
                winRate: parseFloat(commanderWinRate.toFixed(2))
            },
            cardsByType,
            otherCards
        });

    } catch (error) {
        // Use custom error handling
        if (isAppError(error)) {
            logger.warn('Request failed', { 
                code: error.code, 
                message: error.message 
            });
        } else {
            logger.logError('Unexpected error analyzing deck', error);
        }
        return createErrorResponse(error);
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Track deck analysis for authenticated users
 */
async function trackDeckAnalysis(
    supabase: ReturnType<typeof createServerClient>,
    userId: string,
    deckId: string,
    commanderId: string,
    deckName: string,
    logger: ReturnType<typeof apiLogger.child>
): Promise<void> {
    const moxfieldUrl = `https://www.moxfield.com/decks/${deckId}`;
    
    // Check if already analyzed
    const { data: existing, error: existingError } = await supabase
        .from('deck_analyses')
        .select('id')
        .eq('user_id', userId)
        .eq('moxfield_url', moxfieldUrl)
        .maybeSingle();

    if (existingError) {
        logger.warn('Error checking existing analysis', { error: existingError.message });
        return;
    }

    if (existing) {
        logger.debug('User already analyzed this deck', { userId, deckId });
        return;
    }

    // Check if commander exists
    const { data: commander, error: commanderError } = await supabase
        .from('commanders')
        .select('id')
        .eq('id', commanderId)
        .maybeSingle();

    if (commanderError) {
        logger.warn('Error checking commander', { error: commanderError.message });
        return;
    }

    if (!commander) {
        logger.debug('Commander not in database, skipping analysis tracking', { commanderId });
        return;
    }

    // Record the analysis
    const { error: insertError } = await supabase
        .from('deck_analyses')
        .insert({
            user_id: userId,
            moxfield_url: moxfieldUrl,
            commander_id: commanderId,
            deck_name: deckName
        });

    if (insertError) {
        logger.warn('Error recording analysis', { error: insertError.message });
    }
}

interface PartialCardResponse {
    id: string;
    name: string;
    scryfallId: string;
    quantity: number;
    type: number;
    type_line: null;
    stats: null;
}

/**
 * Build partial response when commander not found
 */
function buildPartialResponse(
    deckId: string, 
    deck: { name: string; boards: { mainboard: { cards: Record<string, { card: { uniqueCardId?: string; name: string; scryfall_id?: string }; quantity: number }> }; commanders: { cards: Record<string, { card: { name: string; uniqueCardId: string } }> } } },
    commanderCards: Array<{ card: { name: string; uniqueCardId: string } }>
) {
    const mainboardCards = deck.boards.mainboard.cards || {};
    
    const cardsByType: Record<string, PartialCardResponse[]> = {};
    
    Object.values(mainboardCards).forEach(card => {
        const category = '0';
        if (!cardsByType[category]) cardsByType[category] = [];
        cardsByType[category].push({
            id: card.card.uniqueCardId || '',
            name: card.card.name,
            scryfallId: card.card.scryfall_id || '',
            quantity: card.quantity,
            type: 0,
            type_line: null,
            stats: null
        });
    });

    return {
        deck: {
            id: deckId,
            name: deck.name,
            commanders: commanderCards.map(c => ({
                name: c.card.name,
                id: c.card.uniqueCardId
            })),
        },
        error: 'Commander statistics not found in database for this commander',
        cardsByType,
        otherCards: []
    };
}

/**
 * Process mainboard cards with statistics
 */
function processMainboardCards(
    mainboardCards: Record<string, { card: { uniqueCardId?: string; name: string; scryfall_id?: string }; quantity: number }>,
    cardStats: Array<{ card_id: string; wins: number; losses: number; draws: number; entries: number; cards?: { type?: number; type_line?: string } }> | null,
    cardData: Array<{ unique_card_id: string; type?: number | null; type_line?: string | null }> | null,
    commanderData: { wins: number; losses: number; draws: number; entries: number },
    commanderWinRate: number
) {
    return Object.values(mainboardCards).map(deckCard => {
        const cardStat = cardStats?.find(stat => stat.card_id === deckCard.card.uniqueCardId);
        const card = cardData?.find(c => c.unique_card_id === deckCard.card.uniqueCardId);

        let statData = null;
        if (cardStat) {
            const cardWinRate = calculateWinRate(cardStat.wins, cardStat.losses, cardStat.draws);
            const inclusionRate = calculateInclusionRate(cardStat.entries, commanderData.entries);
            const winRateDiff = cardWinRate - commanderWinRate;
            const confidence = calculateConfidence(
                cardStat.wins, cardStat.losses, cardStat.draws, cardStat.entries,
                commanderData.wins, commanderData.losses, commanderData.draws, commanderData.entries
            );

            statData = {
                wins: cardStat.wins,
                losses: cardStat.losses,
                draws: cardStat.draws,
                entries: cardStat.entries,
                winRate: parseFloat(cardWinRate.toFixed(2)),
                inclusionRate: parseFloat(inclusionRate.toFixed(2)),
                winRateDiff: parseFloat(winRateDiff.toFixed(2)),
                confidence: confidence || 0
            };
        }

        return {
            id: deckCard.card.uniqueCardId || '',
            name: deckCard.card.name,
            scryfallId: deckCard.card.scryfall_id || '',
            quantity: deckCard.quantity,
            type: cardStat?.cards?.type || card?.type || 0,
            type_line: cardStat?.cards?.type_line || card?.type_line || null,
            stats: statData
        };
    });
}

/**
 * Group cards by type number
 */
function groupCardsByType<T extends { type: number }>(cards: T[]): Record<string, T[]> {
    return cards.reduce((acc, card) => {
        const category = card.type.toString();
        if (!acc[category]) acc[category] = [];
        acc[category].push(card);
        return acc;
    }, {} as Record<string, T[]>);
}

/**
 * Get cards not in the current deck
 */
function getOtherCards(
    cardStats: Array<{ card_id: string; wins: number; losses: number; draws: number; entries: number; cards?: { name?: string; scryfall_id?: string; type?: number; type_line?: string } }> | null,
    currentDeckCardIds: string[],
    commanderData: { wins: number; losses: number; draws: number; entries: number },
    commanderWinRate: number
) {
    if (!cardStats) return [];

    return cardStats
        .filter(stat => !currentDeckCardIds.includes(stat.card_id))
        .sort((a, b) => b.entries - a.entries)
        .map(stat => {
            const cardWinRate = calculateWinRate(stat.wins, stat.losses, stat.draws);
            const inclusionRate = calculateInclusionRate(stat.entries, commanderData.entries);
            const winRateDiff = cardWinRate - commanderWinRate;
            const confidence = calculateConfidence(
                stat.wins, stat.losses, stat.draws, stat.entries,
                commanderData.wins, commanderData.losses, commanderData.draws, commanderData.entries
            );

            return {
                id: stat.card_id,
                name: stat.cards?.name || 'Unknown',
                scryfallId: stat.cards?.scryfall_id || '',
                type: stat.cards?.type || 0,
                type_line: stat.cards?.type_line || null,
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
}
