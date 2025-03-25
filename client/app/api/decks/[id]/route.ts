import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { MoxfieldClient } from '@/lib/etl/api-clients';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: deckId } = await params;

        if (!deckId) {
            return NextResponse.json({ error: 'Deck ID is required' }, { status: 400 });
        }

        // Create Supabase client with cookie handling
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => {
                        return [...cookieStore.getAll()];
                    },
                    setAll: (cookies) => {
                        cookies.map((cookie) => {
                            cookieStore.set(cookie.name, cookie.value, cookie.options);
                        });
                    }
                },
            }
        );

        // Instantiate the Moxfield client
        const moxfieldClient = new MoxfieldClient();

        // Fetch the deck data from Moxfield
        const deck = await moxfieldClient.fetchDeck(deckId);

        if (!deck) {
            return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
        }

        // Extract the commander ID
        const commanderCardsObj = deck.boards.commanders.cards || {};
        const commanderCards = Object.values(commanderCardsObj);
        if (!commanderCards || commanderCards.length === 0) {
            return NextResponse.json({ error: 'No commanders found in deck' }, { status: 400 });
        }

        // Generate commander ID (using the same logic as in EtlProcessor)
        const sortedCommanders = [...commanderCards].sort((a, b) =>
            (a.card.uniqueCardId || '').localeCompare(b.card.uniqueCardId || '')
        );

        const commanderId = sortedCommanders.map(card => card.card.uniqueCardId || '').join('_');

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        console.log('[API] User authenticated:', !!user); // Add logging

        if (!user) {
            console.log('[API] No user found, returning 401'); // Add logging
            return NextResponse.json({ 
                error: 'Authentication required',
                message: 'Please log in to access this feature',
                type: 'AUTH_REQUIRED'
            }, { status: 401 });
        }

        // Check user's analysis limits
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('subscription_tier, analyses_used, analyses_limit')
            .eq('id', user.id)
            .single();

        if (userError) {
            console.error('Error fetching user data:', userError);
            return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
        }

        // Check if this deck has already been analyzed by this user
        const moxfieldUrl = `https://www.moxfield.com/decks/${deckId}`;
        const { data: existingAnalysis, error: existingAnalysisError } = await supabase
            .from('deck_analyses')
            .select('id')
            .eq('user_id', user.id)
            .eq('moxfield_url', moxfieldUrl)
            .maybeSingle();

        if (existingAnalysisError) {
            console.error('Error checking for existing analysis:', existingAnalysisError);
            return NextResponse.json({ error: 'Failed to check for existing analysis' }, { status: 500 });
        }

        // Only count toward the limit and create a new record if this is a new analysis
        if (!existingAnalysis) {
            // Check if user has reached their analysis limit
            if (userData.analyses_used >= userData.analyses_limit) {
                return NextResponse.json({
                    error: 'Analysis limit reached',
                    message: 'You have used all your free analyses. Please upgrade to PRO for unlimited analyses.',
                    type: 'UPGRADE_REQUIRED'
                }, { status: 403 });
            }

            // Record the analysis in deck_analyses table
            const { error: analysisError } = await supabase
                .from('deck_analyses')
                .insert({
                    user_id: user.id,
                    moxfield_url: moxfieldUrl,
                    commander_id: commanderId
                });

            if (analysisError) {
                console.error('Error recording deck analysis:', analysisError);
                return NextResponse.json({ error: 'Failed to record deck analysis' }, { status: 500 });
            }
        } else {
            console.log(`[API] User ${user.id} has already analyzed deck ${deckId}, not counting toward limit`);
        }

        // Fetch commander data
        const { data: commanderData } = await supabase
            .from('commanders')
            .select('*')
            .eq('id', commanderId)
            .single();

        if (!commanderData) {
            // Commander not found in our database
            return NextResponse.json({
                deck: {
                    name: deck.name,
                    commanders: commanderCards.map(c => ({
                        name: c.card.name,
                        id: c.card.uniqueCardId
                    })),
                },
                error: 'Commander statistics not found in database',
                cards: Object.values(deck.boards.mainboard.cards || {}).map(c => ({
                    name: c.card.name,
                    id: c.card.uniqueCardId,
                    quantity: c.quantity
                }))
            });
        }

        // Calculate commander win rate
        const totalGames = commanderData.wins + commanderData.losses + commanderData.draws;
        const winRate = totalGames > 0 ? (commanderData.wins / totalGames) * 100 : 0;

        // Fetch card statistics for this commander
        const { data: cardStats } = await supabase
            .from('statistics')
            .select(`
        *,
        cards:card_id(
          unique_card_id,
          name,
          scryfall_id,
          type,
          type_line
        )
      `)
            .eq('commander_id', commanderId);

        // Get unique card IDs from the deck mainboard
        const deckCardIds = Object.values(deck.boards.mainboard.cards || {}).map(card => card.card.uniqueCardId || '');

        // Fetch card data for any cards that might not have statistics
        const { data: cardData } = await supabase
            .from('cards')
            .select('*')
            .in('unique_card_id', deckCardIds);

        // Prepare the card data with statistics
        const deckCards = Object.values(deck.boards.mainboard.cards || {}).map(deckCard => {
            const cardStat = cardStats?.find(stat => stat.card_id === deckCard.card.uniqueCardId);
            // Find card data in our database
            const card = cardData?.find(c => c.unique_card_id === deckCard.card.uniqueCardId);

            let statData = null;
            if (cardStat) {
                const cardTotalGames = cardStat.wins + cardStat.losses + cardStat.draws;
                const cardWinRate = cardTotalGames > 0 ? (cardStat.wins / cardTotalGames) * 100 : 0;
                const inclusionRate = (cardStat.entries / commanderData.entries) * 100;
                const winRateDiff = cardWinRate - winRate;

                statData = {
                    wins: cardStat.wins,
                    losses: cardStat.losses,
                    draws: cardStat.draws,
                    entries: cardStat.entries,
                    winRate: parseFloat(cardWinRate.toFixed(2)),
                    inclusionRate: parseFloat(inclusionRate.toFixed(2)),
                    winRateDiff: parseFloat(winRateDiff.toFixed(2))
                };
            }

            // Get type from our database instead of Moxfield
            // First try card stats (which includes the cards join), then fall back to direct card data
            const typeNumber =
                (cardStat?.cards?.type) ||
                (card?.type) ||
                0; // Default to 0 (unknown) if not found

            // Get type_line from our database
            const typeLine =
                (cardStat?.cards?.type_line) ||
                (card?.type_line) ||
                null;

            return {
                id: deckCard.card.uniqueCardId || '',
                name: deckCard.card.name,
                scryfallId: deckCard.card.scryfall_id || '',
                quantity: deckCard.quantity,
                type: typeNumber,
                type_line: typeLine,
                stats: statData
            };
        });

        // Group cards by type
        const cardsByType = deckCards.reduce((acc, card) => {
            const category = card.type.toString();

            if (!acc[category]) {
                acc[category] = [];
            }

            acc[category].push(card);
            return acc;
        }, {} as Record<string, typeof deckCards>);

        // Get IDs of cards in the current deck
        const currentDeckCardIds = deckCards.map(card => card.id);

        // Filter card stats to only include cards NOT in the current deck
        const otherCardStats = cardStats
            ?.filter(stat => !currentDeckCardIds.includes(stat.card_id))
            // Sort by entries (popularity) in descending order
            .sort((a, b) => b.entries - a.entries)
            .map(stat => {
                const cardTotalGames = stat.wins + stat.losses + stat.draws;
                const cardWinRate = cardTotalGames > 0 ? (stat.wins / cardTotalGames) * 100 : 0;
                const inclusionRate = (stat.entries / commanderData.entries) * 100;
                const winRateDiff = cardWinRate - winRate;

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
                        winRateDiff: parseFloat(winRateDiff.toFixed(2))
                    }
                };
            }) || [];

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
                winRate: parseFloat(winRate.toFixed(2))
            },
            cardsByType,
            otherCards: otherCardStats
        });
    } catch (error) {
        console.error('Error analyzing deck:', error);
        return NextResponse.json(
            { error: 'An error occurred while analyzing the deck' },
            { status: 500 }
        );
    }
} 