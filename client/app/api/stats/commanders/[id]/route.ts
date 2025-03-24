import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../../../lib/supabase';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const commanderId = params.id;

        // Fetch the commander data
        const { data: commander, error: commanderError } = await supabaseServer
            .from('commanders')
            .select('*')
            .eq('id', commanderId)
            .single();

        if (commanderError) {
            return NextResponse.json(
                { error: 'Commander not found' },
                { status: 404 }
            );
        }

        // Calculate the overall commander win rate
        const totalCommanderGames = commander.wins + commander.losses + commander.draws;
        const overallWinRate = totalCommanderGames > 0
            ? (commander.wins / totalCommanderGames) * 100
            : 0;

        // Fetch card statistics for this commander
        const { data: cardStats, error: statsError } = await supabaseServer
            .from('statistics')
            .select(`
        *,
        cards:card_id(
          unique_card_id,
          name,
          scryfall_id
        )
      `)
            .eq('commander_id', commanderId)
            .order('entries', { ascending: false });

        if (statsError) {
            return NextResponse.json(
                { error: 'Failed to fetch card statistics' },
                { status: 500 }
            );
        }

        // Calculate win rates, inclusion rates, and win rate differential
        const formattedStats = cardStats.map(stat => {
            const totalGames = stat.wins + stat.losses + stat.draws;
            const cardWinRate = totalGames > 0 ? (stat.wins / totalGames) * 100 : 0;
            const inclusionRate = (stat.entries / commander.entries) * 100;

            // Calculate win rate differential (card win rate - overall commander win rate)
            const winRateDiff = cardWinRate - overallWinRate;

            return {
                cardId: stat.card_id,
                cardName: stat.cards.name,
                scryfallId: stat.cards.scryfall_id,
                wins: stat.wins,
                losses: stat.losses,
                draws: stat.draws,
                entries: stat.entries,
                totalGames,
                winRate: parseFloat(cardWinRate.toFixed(2)),
                inclusionRate: parseFloat(inclusionRate.toFixed(2)),
                winRateDiff: parseFloat(winRateDiff.toFixed(2))
            };
        });

        return NextResponse.json({
            commander: {
                id: commander.id,
                name: commander.name,
                totalEntries: commander.entries,
                winRate: parseFloat(overallWinRate.toFixed(2))
            },
            cardStats: formattedStats
        });
    } catch (error) {
        console.error('Error fetching commander statistics:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
} 