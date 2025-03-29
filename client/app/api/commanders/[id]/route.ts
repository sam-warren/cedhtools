import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Add helper functions for confidence calculation (copied from deck API)
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
        const { id: commanderId } = await params;

        if (!commanderId) {
            return NextResponse.json({ error: 'Commander ID is required' }, { status: 400 });
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

        // Get the current user - authentication is optional
        const { data: { user } } = await supabase.auth.getUser();
        console.log('[API] User authenticated:', !!user);

        // Fetch commander data
        const { data: commanderData, error: commanderError } = await supabase
            .from('commanders')
            .select('*')
            .eq('id', commanderId)
            .single();

        if (commanderError || !commanderData) {
            return NextResponse.json({ 
                error: 'Commander not found in database',
                commander: {
                    id: commanderId,
                    name: "Unknown Commander"
                },
                cardsByType: {},
            }, { status: 404 });
        }

        // If user is authenticated, track this commander analysis
        if (user) {
            // Check if this commander has already been analyzed by this user
            const { data: existingAnalysis, error: existingAnalysisError } = await supabase
                .from('commander_analyses')
                .select('id')
                .eq('user_id', user.id)
                .eq('commander_id', commanderId)
                .maybeSingle();

            if (existingAnalysisError) {
                console.error('Error checking for existing analysis:', existingAnalysisError);
                // Continue processing even if there's an error checking for existing analysis
            }

            // Create a new record if this is a new analysis and no errors checking existing ones
            if (!existingAnalysis && !existingAnalysisError) {
                // Record the analysis in commander_analyses table
                const { error: analysisError } = await supabase
                    .from('commander_analyses')
                    .insert({
                        user_id: user.id,
                        commander_id: commanderId
                    });

                if (analysisError) {
                    console.error('Error recording commander analysis:', analysisError);
                    // Continue processing even if there's an error recording the analysis
                }
            } else {
                console.log(`[API] User ${user.id} has already analyzed commander ${commanderId}`);
            }
        }

        // Calculate commander win rate
        const totalGames = commanderData.wins + commanderData.losses + commanderData.draws;
        const winRate = totalGames > 0 ? (commanderData.wins / totalGames) * 100 : 0;

        // Fetch card statistics for this commander
        const { data: cardStats, error: cardStatsError } = await supabase
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

        if (cardStatsError) {
            console.error('Error fetching card statistics:', cardStatsError);
            return NextResponse.json({ error: 'Failed to retrieve card statistics' }, { status: 500 });
        }

        // Process card statistics and group by type
        const processedCardStats = cardStats.map(stat => {
            const cardTotalGames = stat.wins + stat.losses + stat.draws;
            const cardWinRate = cardTotalGames > 0 ? (stat.wins / cardTotalGames) * 100 : 0;
            const inclusionRate = (stat.entries / commanderData.entries) * 100;
            const winRateDiff = cardWinRate - winRate;
            
            // Calculate confidence score
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
                    confidence: confidence
                }
            };
        });

        // Group cards by type
        const cardsByType = processedCardStats.reduce((acc, card) => {
            const category = card.type.toString();

            if (!acc[category]) {
                acc[category] = [];
            }

            acc[category].push(card);
            return acc;
        }, {} as Record<string, Array<typeof processedCardStats[0]>>);

        return NextResponse.json({
            commander: {
                id: commanderId,
                name: commanderData.name,
                imageUrl: commanderData.image_url || null
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
            cardsByType
        });
    } catch (error) {
        console.error('Error retrieving commander data:', error);
        return NextResponse.json(
            { error: 'An error occurred while retrieving commander data' },
            { status: 500 }
        );
    }
}
