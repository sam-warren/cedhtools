import { supabaseServer } from '../supabase';

/**
 * This script clears all ETL data from the database
 * Run with: npx tsx lib/etl/reset-etl.ts
 */
async function resetEtlData() {
    console.log('Resetting all ETL data...');

    try {
        // Call our SQL function to clear data
        const { error } = await supabaseServer.rpc('clear_etl_data');

        if (error) {
            throw error;
        }

        console.log('Successfully cleared all ETL data');
        console.log('Ready for a fresh ETL run');
    } catch (error) {
        console.error('Error resetting ETL data:', error);

        // Fallback method if the function doesn't work
        console.log('Attempting manual data reset...');

        try {
            await supabaseServer.from('statistics').delete().neq('id', 0);
            await supabaseServer.from('commanders').delete().neq('id', '');
            await supabaseServer.from('cards').delete().neq('unique_card_id', '');
            await supabaseServer.from('etl_status').delete().neq('id', 0);
            await supabaseServer.from('processed_tournaments').delete().neq('tournament_id', '');

            console.log('Manual reset complete');
        } catch (fallbackError) {
            console.error('Failed to reset data manually:', fallbackError);
        }
    }
}

// Run the function
resetEtlData()
    .catch(console.error)
    .finally(() => {
        console.log('Reset script complete');
        process.exit(0);
    }); 