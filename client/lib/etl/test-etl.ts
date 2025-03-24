import EtlProcessor from './processor';
import { format, subDays } from 'date-fns';

// Run ETL process for just 1 day to minimize API pressure
async function runTestEtl() {
  console.log('Starting test ETL process...');

  const processor = new EtlProcessor();

  // Use a 1-day window for testing
  const endDate = format(new Date(), 'yyyy-MM-dd');
  const startDate = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  console.log(`Processing data from ${startDate} to ${endDate}`);

  try {
    await processor.processData(startDate, endDate);
    console.log('ETL process completed successfully.');
  } catch (error) {
    console.error('Error running ETL process:', error);
  }
}

// Execute the test function
runTestEtl(); 