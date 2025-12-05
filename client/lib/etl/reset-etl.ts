/**
 * ETL Data Reset Script
 * 
 * Clears all ETL data from the database for a fresh start.
 * Run with: npx tsx lib/etl/reset-etl.ts
 */

import { createServiceRoleClient } from '@/lib/api/supabase';

// Create singleton for this module
const serviceRoleClient = createServiceRoleClient();
import { cliLogger } from '@/lib/logger';

const logger = cliLogger.child({ script: 'reset-etl' });

async function resetEtlData() {
    logger.info('Resetting all ETL data...');

    try {
        // Call our SQL function to clear data
        const { error } = await serviceRoleClient.rpc('clear_etl_data');

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
            await serviceRoleClient.from('statistics').delete().neq('id', 0);
            await serviceRoleClient.from('commanders').delete().neq('id', '');
            await serviceRoleClient.from('cards').delete().neq('unique_card_id', '');
            await serviceRoleClient.from('etl_jobs').delete().neq('id', 0);
            await serviceRoleClient.from('processed_tournaments').delete().neq('tournament_id', '');

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
