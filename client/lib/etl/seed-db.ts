import EtlProcessor from './processor';
import { format, subMonths } from 'date-fns';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../../.env.local') });

/**
 * This script seeds the database with data from the last 6 months
 * Run with: npm run etl:seed
 */
async function seedDatabase() {
    console.log('┌────────────────────────────────────────┐');
    console.log('│ CEDH Tools - Database Seeding Utility  │');
    console.log('└────────────────────────────────────────┘');
    console.log('');

    const startDate = format(subMonths(new Date(), 6), 'yyyy-MM-dd');
    const endDate = format(new Date(), 'yyyy-MM-dd');

    console.log(`Starting ETL process to seed database with 6 months of data:`);
    console.log(`From: ${startDate} To: ${endDate}`);
    console.log('');
    console.log('This operation may take a long time depending on the amount of data.');
    console.log('Progress will be logged to the console.');
    console.log('');
    console.log('Initializing ETL processor...');

    const processor = new EtlProcessor();

    try {
        // Log start time
        const startTime = new Date();
        console.log(`Started at: ${startTime.toLocaleTimeString()}`);

        // Start the ETL process
        await processor.processData(startDate, endDate);

        // Calculate and log duration
        const endTime = new Date();
        const durationMs = endTime.getTime() - startTime.getTime();
        const durationMinutes = Math.floor(durationMs / 60000);
        const durationSeconds = Math.floor((durationMs % 60000) / 1000);

        console.log('');
        console.log('┌────────────────────────────────────────┐');
        console.log('│ Database seeding completed successfully │');
        console.log('└────────────────────────────────────────┘');
        console.log(`Total duration: ${durationMinutes} minutes, ${durationSeconds} seconds`);
        console.log(`Started: ${startTime.toLocaleString()}`);
        console.log(`Finished: ${endTime.toLocaleString()}`);
    } catch (error) {
        console.error('Error during database seeding:');
        console.error(error);
        process.exit(1);
    }
}

// Run the function
seedDatabase().catch(console.error); 