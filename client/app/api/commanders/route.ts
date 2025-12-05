/**
 * Commanders API Route
 * 
 * GET /api/commanders - List all commanders with tournament statistics
 * 
 * Used for the commander dropdown in the deck analysis form.
 * Returns commanders sorted by entries (popularity).
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/api/supabase';
import { apiLogger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/errors';

export async function GET(request: Request) {
    const logger = apiLogger.child({ route: 'commanders' });
    
    try {
        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const limit = parseInt(searchParams.get('limit') || '100', 10);
        const minEntries = parseInt(searchParams.get('minEntries') || '1', 10);

        // Create Supabase client
        const cookieStore = await cookies();
        const supabase = createServerClient(cookieStore);

        // Build query
        let query = supabase
            .from('commanders')
            .select('id, name, wins, losses, draws, entries')
            .gte('entries', minEntries)
            .order('entries', { ascending: false })
            .limit(limit);

        // Add search filter if provided
        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        const { data: commanders, error } = await query;

        if (error) {
            logger.warn('Error fetching commanders', { error: error.message });
            throw error;
        }

        logger.debug('Commanders fetched', { count: commanders?.length || 0 });

        // Calculate win rate for each commander
        const commandersWithWinRate = (commanders || []).map(commander => ({
            ...commander,
            winRate: commander.entries > 0 
                ? parseFloat(((commander.wins / (commander.wins + commander.losses + commander.draws)) * 100).toFixed(2))
                : 0
        }));

        return NextResponse.json({
            commanders: commandersWithWinRate,
            total: commandersWithWinRate.length
        });

    } catch (error) {
        logger.logError('Unexpected error fetching commanders', error);
        return createErrorResponse(error);
    }
}

