import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { MoxfieldClient } from '@/lib/etl/api-clients';

// Add these helper functions before the GET handler
function calculateEffectSize(
    cardWins: number,
    cardLosses: number,
    commanderWins: number,
    commanderLosses: number
): { effectSize: number; lowerCI: number; upperCI: number } {
    // Calculate proportions
    const cardTotal = cardWins + cardLosses;
    const commanderTotal = commanderWins + commanderLosses;

    if (cardTotal === 0 || commanderTotal === 0) return { effectSize: 0, lowerCI: 0, upperCI: 0 };

    const cardProportion = cardWins / cardTotal;
    const commanderProportion = commanderWins / commanderTotal;

    // Calculate Cohen's h for proportions
    const effectSize = 2 * Math.asin(Math.sqrt(cardProportion)) - 2 * Math.asin(Math.sqrt(commanderProportion));

    // Calculate standard error for confidence intervals
    const cardSE = 1 / Math.sqrt(cardTotal);
    const commanderSE = 1 / Math.sqrt(commanderTotal);
    const combinedSE = Math.sqrt(cardSE * cardSE + commanderSE * commanderSE);

    // 95% confidence intervals
    const z = 1.96; // 95% confidence level
    const lowerCI = effectSize - z * combinedSE;
    const upperCI = effectSize + z * combinedSE;

    return { effectSize, lowerCI, upperCI };
}

function calculateChiSquare(
    cardWins: number,
    cardLosses: number,
    commanderWins: number,
    commanderLosses: number
): { chiSquare: number; pValue: number } {
    const cardTotal = cardWins + cardLosses;
    const commanderTotal = commanderWins + commanderLosses;
    const total = cardTotal + commanderTotal;

    if (cardTotal === 0 || commanderTotal === 0) return { chiSquare: 0, pValue: 1 };

    // Use Fisher's Exact Test for small samples
    if (cardWins < 5 || cardLosses < 5 || commanderWins < 5 || commanderLosses < 5) {
        // Fisher's Exact Test approximation for 2x2 contingency table
        const n = total;
        const a = cardWins;
        const b = cardLosses;
        const c = commanderWins;
        const d = commanderLosses;
        
        // Calculate Fisher's Exact Test statistic
        const numerator = Math.log(
            (factorial(a + b) * factorial(c + d) * factorial(a + c) * factorial(b + d)) /
            (factorial(a) * factorial(b) * factorial(c) * factorial(d) * factorial(n))
        );
        
        // Convert to chi-square approximation
        const chiSquare = -2 * numerator;
        const pValue = Math.exp(-chiSquare / 2);
        
        return { chiSquare, pValue };
    }

    // Create contingency table with continuity correction
    const expectedWins = (cardTotal * (commanderWins + cardWins)) / total;
    const expectedLosses = (cardTotal * (commanderLosses + cardLosses)) / total;

    // Calculate chi-square statistic with continuity correction
    const chiSquare =
        Math.pow(Math.abs(cardWins - expectedWins) - 0.5, 2) / expectedWins +
        Math.pow(Math.abs(cardLosses - expectedLosses) - 0.5, 2) / expectedLosses;

    // Calculate p-value using chi-square distribution with 1 degree of freedom
    const pValue = Math.exp(-chiSquare / 2);

    return { chiSquare, pValue };
}

function factorial(n: number): number {
    if (n < 0) return 0;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

function calculateConfidence(
    cardWins: number,
    cardLosses: number,
    cardDraws: number,
    cardEntries: number,
    commanderWins: number,
    commanderLosses: number,
    commanderDraws: number,
    commanderEntries: number
): number {
    // Calculate total games for both card and commander
    const cardTotalGames = cardWins + cardLosses + cardDraws;
    const commanderTotalGames = commanderWins + commanderLosses + commanderDraws;

    // If we have no games or entries, return 0 instead of null
    if (cardTotalGames === 0 || commanderTotalGames === 0 || cardEntries === 0 || commanderEntries === 0) {
        return 0;
    }

    // Ensure we have valid numbers for all inputs
    if (isNaN(cardWins) || isNaN(cardLosses) || isNaN(cardDraws) || 
        isNaN(cardEntries) || isNaN(commanderWins) || isNaN(commanderLosses) || 
        isNaN(commanderDraws) || isNaN(commanderEntries)) {
        return 0;
    }

    // 1. Sample Size Score (0-40 points)
    // Using power analysis for binary outcomes
    // For α = 0.05, power = 0.8, and medium effect size (h = 0.5):
    // Required sample size ≈ 64 per group
    // We'll use 100 as our target for a more conservative estimate
    // Using sigmoid function for smoother scaling
    const targetSampleSize = 100;
    const sampleSizeScore = 40 * (1 / (1 + Math.exp(-(cardTotalGames - targetSampleSize/2) / (targetSampleSize/4))));

    // 2. Statistical Significance Score (0-30 points)
    const { pValue } = calculateChiSquare(cardWins, cardLosses, commanderWins, commanderLosses);
    // Convert p-value to score using -log10(p) to get a continuous scale
    // p = 0.001 → 3 points
    // p = 0.01 → 2 points
    // p = 0.05 → 1.3 points
    const significanceScore = Math.min(30, -Math.log10(Math.max(pValue, 1e-10)) * 10);

    // 3. Effect Size Score (0-30 points)
    const { effectSize, lowerCI, upperCI } = calculateEffectSize(cardWins, cardLosses, commanderWins, commanderLosses);
    // Convert Cohen's h to score using absolute value and confidence interval width
    // h = 0.8 → 30 points
    // h = 0.5 → 18.75 points
    // h = 0.2 → 7.5 points
    const ciWidth = Math.max(0, upperCI - lowerCI);
    const effectSizeScore = Math.min(30, Math.abs(effectSize) * 37.5 * (1 - ciWidth/2));

    // Combine all scores for final confidence (0-100)
    const finalScore = Math.round(sampleSizeScore + significanceScore + effectSizeScore);
    
    // Ensure we return a valid number between 0 and 100
    return Math.max(0, Math.min(100, finalScore));
}

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

        // Get the current user - authentication is optional
        const { data: { user } } = await supabase.auth.getUser();
        console.log('[API] User authenticated:', !!user);

        // If user is authenticated, track this deck analysis
        if (user) {
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
                // Continue processing even if there's an error checking for existing analysis
            }

            // Create a new record if this is a new analysis and no errors checking existing ones
            if (!existingAnalysis && !existingAnalysisError) {
                // First check if the commander exists
                const { data: commander, error: commanderError } = await supabase
                    .from('commanders')
                    .select('id')
                    .eq('id', commanderId)
                    .maybeSingle();

                if (commanderError) {
                    console.error('Error checking commander existence:', commanderError);
                    // Continue processing even if there's an error checking commander
                }

                // Only record the analysis if the commander exists
                if (commander) {
                    // Record the analysis in deck_analyses table
                    const { error: analysisError } = await supabase
                        .from('deck_analyses')
                        .insert({
                            user_id: user.id,
                            moxfield_url: moxfieldUrl,
                            commander_id: commanderId,
                            deck_name: deck.name
                        });

                    if (analysisError) {
                        console.error('Error recording deck analysis:', analysisError);
                        // Continue processing even if there's an error recording the analysis
                    }
                } else {
                    console.log(`[API] Commander ${commanderId} not found in database, skipping analysis recording`);
                }
            } else {
                console.log(`[API] User ${user.id} has already analyzed deck ${deckId}`);
            }
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
                    id: deckId,
                    name: deck.name,
                    commanders: commanderCards.map(c => ({
                        name: c.card.name,
                        id: c.card.uniqueCardId
                    })),
                },
                error: 'Commander statistics not found in database for this commander',
                cardsByType: Object.values(deck.boards.mainboard.cards || {}).reduce((acc, card) => {
                    const typeNumber = 0;
                    const category = typeNumber.toString();

                    if (!acc[category]) {
                        acc[category] = [];
                    }

                    acc[category].push({
                        id: card.card.uniqueCardId || '',
                        name: card.card.name,
                        scryfallId: card.card.scryfall_id || '',
                        quantity: card.quantity,
                        type: typeNumber,
                        type_line: null,
                        stats: null
                    });
                    return acc;
                }, {} as Record<string, Array<{
                    id: string;
                    name: string;
                    scryfallId: string;
                    quantity: number;
                    type: number;
                    type_line: string | null;
                    stats: null;
                }>>),
                otherCards: []
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
                const confidence = calculateConfidence(
                    cardStat.wins,
                    cardStat.losses,
                    cardStat.draws,
                    cardStat.entries,
                    commanderData.wins,
                    commanderData.losses,
                    commanderData.draws,
                    commanderData.entries
                );
                console.log(`[API] Calculating confidence for ${deckCard.card.name}:`, {
                    cardWins: cardStat.wins,
                    cardLosses: cardStat.losses,
                    cardDraws: cardStat.draws,
                    cardEntries: cardStat.entries,
                    commanderWins: commanderData.wins,
                    commanderLosses: commanderData.losses,
                    commanderDraws: commanderData.draws,
                    commanderEntries: commanderData.entries,
                    confidence
                });

                statData = {
                    wins: cardStat.wins,
                    losses: cardStat.losses,
                    draws: cardStat.draws,
                    entries: cardStat.entries,
                    winRate: parseFloat(cardWinRate.toFixed(2)),
                    inclusionRate: parseFloat(inclusionRate.toFixed(2)),
                    winRateDiff: parseFloat(winRateDiff.toFixed(2)),
                    confidence: confidence || 0 // Ensure we never return null
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
                const confidence = calculateConfidence(
                    stat.wins,
                    stat.losses,
                    stat.draws,
                    stat.entries,
                    commanderData.wins,
                    commanderData.losses,
                    commanderData.draws,
                    commanderData.entries
                );
                console.log(`[API] Calculating confidence for other card ${stat.cards?.name}:`, {
                    cardWins: stat.wins,
                    cardLosses: stat.losses,
                    cardDraws: stat.draws,
                    cardEntries: stat.entries,
                    commanderWins: commanderData.wins,
                    commanderLosses: commanderData.losses,
                    commanderDraws: commanderData.draws,
                    commanderEntries: commanderData.entries,
                    confidence
                });

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
                        confidence: confidence || 0 // Ensure we never return null
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