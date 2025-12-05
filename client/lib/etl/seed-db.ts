/**
 * Database Seeding Script
 * 
 * Seeds the database with tournament data from January 1, 2025 onwards.
 * This date corresponds to when Topdeck started including deckObj data
 * with Scryfall UUIDs via their Scrollrack integration.
 * 
 * Run with: npm run etl:seed (local database)
 * Run with: npm run etl:seed:prod (production database)
 */

import EtlProcessor from './processor';
import { format } from 'date-fns';
import { config } from 'dotenv';
import { resolve } from 'path';
import { cliLogger } from '@/lib/logger';

// Determine which env file to load
const envFile = process.env.ENV_FILE || '.env.local';
const logger = cliLogger.child({ script: 'seed-db' });

logger.info('Loading environment', { envFile });
config({ path: resolve(__dirname, `../../${envFile}`) });

async function seedDatabase() {
    logger.info('┌────────────────────────────────────────┐');
    logger.info('│ CEDH Tools - Database Seeding Utility  │');
    logger.info('└────────────────────────────────────────┘');

    // Start from January 1, 2025 - when Topdeck started including deckObj data
    const startDate = '2025-01-01';
    const endDate = format(new Date(), 'yyyy-MM-dd');

    logger.info('Starting ETL process to seed database', {
        startDate,
        endDate,
        note: 'Using Topdeck deckObj data (available from 2025)'
    });
    
    logger.info('This operation may take a long time depending on the amount of data.');
    logger.info('Progress will be logged to the console.');
    logger.info('Initializing ETL processor...');

    const processor = new EtlProcessor();

    try {
        // Log start time
        const startTime = new Date();
        logger.info('ETL process started', { startTime: startTime.toLocaleTimeString() });

        // Start the ETL process
        await processor.processData(startDate, endDate);

        // Calculate and log duration
        const endTime = new Date();
        const durationMs = endTime.getTime() - startTime.getTime();
        const durationMinutes = Math.floor(durationMs / 60000);
        const durationSeconds = Math.floor((durationMs % 60000) / 1000);

        logger.info('┌────────────────────────────────────────┐');
        logger.info('│ Database seeding completed successfully │');
        logger.info('└────────────────────────────────────────┘');
        logger.info('Seeding complete', {
            durationMinutes,
            durationSeconds,
            startTime: startTime.toLocaleString(),
            endTime: endTime.toLocaleString()
        });
    } catch (error) {
        logger.logError('Error during database seeding', error);
        process.exit(1);
    }
}

// Run the function
seedDatabase().catch(error => {
    logger.logError('Unhandled error', error);
    process.exit(1);
});
