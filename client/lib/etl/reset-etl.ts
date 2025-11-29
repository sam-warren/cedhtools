/**
 * ETL Data Reset Script
 * 
 * Clears all ETL data from the database for a fresh start.
 * Run with: npx tsx lib/etl/reset-etl.ts
 */

import { supabaseServer } from '../supabase';
import { cliLogger } from '../logger';

const logger = cliLogger.child({ script: 'reset-etl' });

async function resetEtlData() {
    logger.info('Resetting all ETL data...');

    try {
        // Call our SQL function to clear data
        const { error } = await supabaseServer.rpc('clear_etl_data');

        if (error) {
            throw error;
        }

        logger.info('Successfully cleared all ETL data');
        logger.info('Ready for a fresh ETL run');
    } catch (error) {
        logger.logError('Error resetting ETL data', error);

        // Fallback method if the function doesn't work
        logger.info('Attempting manual data reset...');

        try {
            await supabaseServer.from('statistics').delete().neq('id', 0);
            await supabaseServer.from('commanders').delete().neq('id', '');
            await supabaseServer.from('cards').delete().neq('unique_card_id', '');
            await supabaseServer.from('etl_status').delete().neq('id', 0);
            await supabaseServer.from('processed_tournaments').delete().neq('tournament_id', '');

            logger.info('Manual reset complete');
        } catch (fallbackError) {
            logger.logError('Failed to reset data manually', fallbackError);
        }
    }
}

// Run the function
resetEtlData()
    .catch(error => {
        logger.logError('Unhandled error', error);
    })
    .finally(() => {
        logger.info('Reset script complete');
        process.exit(0);
    });
