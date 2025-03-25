import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { MoxfieldClient } from '@/lib/etl/api-clients';

// Track the last request time for rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second in ms

// Card type mapping - kept for reference
// const TYPE_MAPPING = {
//   BATTLE: 1,
//   PLANESWALKER: 2,
//   CREATURE: 3,
//   SORCERY: 4,
//   INSTANT: 5,
//   ARTIFACT: 6,
//   ENCHANTMENT: 7,
//   LAND: 8,
// };

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: deckId } = await params;

        if (!deckId) {
            return NextResponse.json({ error: 'Deck ID is required' }, { status: 400 });
        }

        // Implement rate limiting - ensure at least 1 second between requests
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;

        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
            const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        lastRequestTime = Date.now();

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

        // Fetch commander data
        const { data: commanderData } = await supabaseServer
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
        const { data: cardStats } = await supabaseServer
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
        const { data: cardData } = await supabaseServer
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