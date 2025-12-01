/**
 * Deck Analysis API Route (Text-based)
 * 
 * POST /api/decks/analyze - Analyze a text deck list against tournament statistics
 * 
 * This endpoint accepts a commander ID (from our database) and a text-based deck list.
 * Card names are resolved to Scryfall IDs using the Scryfall API.
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { resolveDeckList, parseDeckList } from '@/lib/scryfall';
import { calculateConfidence, calculateWinRate, calculateInclusionRate } from '@/lib/utils/statistics';
import { apiLogger } from '@/lib/logger';
import { 
    ValidationError, 
    NotFoundError, 
    createErrorResponse,
    isAppError 
} from '@/lib/errors';

interface AnalyzeRequest {
    commanderId: string;
    deckList: string;
    deckName?: string;
}

export async function POST(request: Request) {
    const logger = apiLogger.child({ route: 'decks/analyze' });
    
    try {
        const body: AnalyzeRequest = await request.json();

        // Validate request body
        if (!body.commanderId || typeof body.commanderId !== 'string') {
            throw new ValidationError('Commander ID is required', { field: 'commanderId' });
        }

        if (!body.deckList || typeof body.deckList !== 'string') {
            throw new ValidationError('Deck list is required', { field: 'deckList' });
        }

        // Parse deck list to check it's not empty
        const parsedEntries = parseDeckList(body.deckList);
        if (parsedEntries.length === 0) {
            throw new ValidationError('Deck list is empty or invalid format', { field: 'deckList' });
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

        // Fetch commander data to verify it exists
        const { data: commanderData, error: commanderError } = await supabase
            .from('commanders')
            .select('*')
            .eq('id', body.commanderId)
            .single();

        if (commanderError || !commanderData) {
            throw new NotFoundError('Commander', body.commanderId);
        }

        logger.info('Resolving deck list via Scryfall', { cardCount: parsedEntries.length });

        // Resolve card names to Scryfall IDs
        const resolvedDeck = await resolveDeckList(body.deckList);

        logger.info('Deck resolved', { 
            resolved: resolvedDeck.cards.length, 
            notFound: resolvedDeck.notFound.length 
        });

        // Track analysis for authenticated users
        const { data: { user } } = await supabase.auth.getUser();
        logger.debug('User authentication status', { authenticated: !!user });

        if (user) {
            await trackDeckAnalysis(
                supabase, 
                user.id, 
                body.commanderId, 
                body.deckName || 'Untitled Deck',
                body.deckList,
                logger
            );
        }

        // Get all resolved card IDs
        const resolvedCardIds = resolvedDeck.cards.map(c => c.scryfall_id);

        // Fetch card statistics for this commander
        const { data: cardStats } = await supabase
            .from('statistics')
            .select(`*, cards:card_id(unique_card_id, name, scryfall_id, type, type_line)`)
            .eq('commander_id', body.commanderId)
            .in('card_id', resolvedCardIds);

        // Fetch card data for cards without statistics
        const { data: cardData } = await supabase
            .from('cards')
            .select('*')
            .in('unique_card_id', resolvedCardIds);

        // Calculate commander win rate
        const commanderWinRate = calculateWinRate(
            commanderData.wins, 
            commanderData.losses, 
            commanderData.draws
        );

        // Process deck cards with statistics
        const deckCards = processResolvedCards(
            resolvedDeck.cards,
            cardStats,
            cardData,
            commanderData,
            commanderWinRate
        );

        // Group cards by type
        const cardsByType = groupCardsByType(deckCards);

        // Get cards not in the current deck (popular cards for this commander)
        const otherCards = getOtherCards(
            cardStats,
            resolvedCardIds,
            commanderData,
            commanderWinRate,
            supabase,
            body.commanderId
        );

        logger.info('Deck analysis completed', { 
            commanderId: body.commanderId, 
            cardsAnalyzed: deckCards.length,
            notFound: resolvedDeck.notFound
        });

        return NextResponse.json({
            deck: {
                name: body.deckName || 'Untitled Deck',
                commanders: [{
                    name: commanderData.name,
                    id: commanderData.id
                }],
            },
            commanderStats: {
                id: commanderData.id,
                name: commanderData.name,
                wins: commanderData.wins,
                losses: commanderData.losses,
                draws: commanderData.draws,
                entries: commanderData.entries,
                winRate: parseFloat(commanderWinRate.toFixed(2))
            },
            cardsByType,
            otherCards: await otherCards,
            notFoundCards: resolvedDeck.notFound
        });

    } catch (error) {
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
    commanderId: string,
    deckName: string,
    deckList: string,
    logger: ReturnType<typeof apiLogger.child>
): Promise<void> {
    // Record the analysis with deck list instead of moxfield_url
    const { error: insertError } = await supabase
        .from('deck_analyses')
        .insert({
            user_id: userId,
            moxfield_url: null, // Deprecated field
            deck_list: deckList,
            commander_id: commanderId,
            deck_name: deckName
        });

    if (insertError) {
        logger.warn('Error recording analysis', { error: insertError.message });
    }
}

/**
 * Process resolved cards with statistics
 */
function processResolvedCards(
    resolvedCards: Array<{ name: string; scryfall_id: string; type_line: string; quantity: number }>,
    cardStats: Array<{ card_id: string; wins: number; losses: number; draws: number; entries: number; cards?: { type?: number; type_line?: string } }> | null,
    cardData: Array<{ unique_card_id: string; type?: number | null; type_line?: string | null }> | null,
    commanderData: { wins: number; losses: number; draws: number; entries: number },
    commanderWinRate: number
) {
    return resolvedCards.map(resolvedCard => {
        const cardStat = cardStats?.find(stat => stat.card_id === resolvedCard.scryfall_id);
        const card = cardData?.find(c => c.unique_card_id === resolvedCard.scryfall_id);

        // Derive type number from type_line
        const typeNumber = deriveTypeNumber(resolvedCard.type_line);

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
            id: resolvedCard.scryfall_id,
            name: resolvedCard.name,
            scryfallId: resolvedCard.scryfall_id,
            quantity: resolvedCard.quantity,
            type: cardStat?.cards?.type || card?.type || typeNumber,
            type_line: resolvedCard.type_line || cardStat?.cards?.type_line || card?.type_line || null,
            stats: statData
        };
    });
}

/**
 * Derive a type number from the type_line string
 */
function deriveTypeNumber(typeLine: string): number {
    const lowerType = typeLine.toLowerCase();
    
    if (lowerType.includes('land')) return 8;
    if (lowerType.includes('creature')) return 3;
    if (lowerType.includes('instant')) return 5;
    if (lowerType.includes('sorcery')) return 4;
    if (lowerType.includes('artifact')) return 6;
    if (lowerType.includes('enchantment')) return 7;
    if (lowerType.includes('planeswalker')) return 2;
    if (lowerType.includes('battle')) return 1;
    
    return 0; // Unknown
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
async function getOtherCards(
    currentCardStats: Array<{ card_id: string; wins: number; losses: number; draws: number; entries: number; cards?: { name?: string; scryfall_id?: string; type?: number; type_line?: string } }> | null,
    currentDeckCardIds: string[],
    commanderData: { wins: number; losses: number; draws: number; entries: number },
    commanderWinRate: number,
    supabase: ReturnType<typeof createServerClient>,
    commanderId: string
) {
    // Fetch all card statistics for this commander (to get cards not in deck)
    const { data: allCardStats } = await supabase
        .from('statistics')
        .select(`*, cards:card_id(unique_card_id, name, scryfall_id, type, type_line)`)
        .eq('commander_id', commanderId)
        .order('entries', { ascending: false })
        .limit(200);

    if (!allCardStats) return [];

    return allCardStats
        .filter(stat => !currentDeckCardIds.includes(stat.card_id))
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

