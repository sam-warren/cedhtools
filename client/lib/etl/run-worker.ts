/**
 * ETL Worker Runner
 * 
 * This script runs the ETL worker as a standalone process.
 * It can be run directly from the command line with:
 * 
 * npm run etl:worker
 * 
 * For production:
 * npm run etl:worker:prod
 */

import { runWorker } from './worker';

console.log('Starting ETL worker...');

runWorker().catch(error => {
  console.error('Fatal error in ETL worker:', error);
  process.exit(1);
}); 