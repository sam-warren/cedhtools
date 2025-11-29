/**
 * ETL Worker Service
 * 
 * This module implements a queue-based job processing system for the ETL pipeline.
 * It runs independently of the web application, allowing long-running ETL tasks
 * to execute without blocking web requests.
 * 
 * ## Architecture
 * 
 * ```
 * ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
 * │   Job Queue     │────▶│  Worker Loop    │────▶│  ETL Processor  │
 * │  (etl_jobs)     │     │  (this module)  │     │  (processor.ts) │
 * └─────────────────┘     └─────────────────┘     └─────────────────┘
 *         ▲                       │
 *         │                       │
 *         └───────────────────────┘
 *              (creates follow-up jobs)
 * ```
 * 
 * ## Deployment Options
 * 
 * 1. **Local Development**: Run with `npm run etl:worker`
 * 2. **VPS/EC2**: Run as a systemd service or with PM2
 * 3. **Serverless**: Trigger from cron/scheduler (see etl-cron API route)
 * 
 * ## Job Types
 * 
 * - **SEED**: Initial database population (6 months of historical data)
 * - **DAILY_UPDATE**: Incremental update from last processed date
 * - **BATCH_PROCESS**: Cursor-based processing for serverless environments
 * 
 * ## Stuck Job Handling
 * 
 * Jobs that run longer than `max_runtime_seconds` are automatically reset
 * to PENDING status by the `reset_stuck_jobs` RPC function, allowing them
 * to be picked up and retried.
 */

import EtlProcessor from './processor';
import { supabaseServiceRole } from '../supabase';
import { format, subMonths } from 'date-fns';
import { DEFAULT_BATCH_SIZE, DEFAULT_SEED_MONTHS } from './constants';
import { etlLogger } from '../logger';

// =============================================================================
// WORKER CONFIGURATION
// =============================================================================

/** Polling interval when no jobs are available (in milliseconds) */
const IDLE_POLL_INTERVAL_MS = 60000; // 1 minute

/** Wait time after encountering an error in the main loop (in milliseconds) */
const ERROR_RECOVERY_INTERVAL_MS = 30000; // 30 seconds

/** Logger instance for worker */
const logger = etlLogger.child({ module: 'worker' });

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * ETL Job record from the database.
 * 
 * Jobs are processed in order of:
 * 1. Priority (higher values processed first)
 * 2. Creation time (older jobs processed first within same priority)
 */
interface EtlJob {
  id: number;
  /** Type of ETL operation to perform */
  job_type: 'SEED' | 'DAILY_UPDATE' | 'BATCH_PROCESS';
  /** Current job status */
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  /** Job-specific parameters */
  parameters: {
    startDate?: string;
    endDate?: string;
    batchSize?: number;
    cursor?: string;
    priority?: number;
  };
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  /** Cursor for next batch (BATCH_PROCESS jobs only) */
  next_cursor: string | null;
  /** Number of records processed by this job */
  records_processed: number;
  /** Error message if job failed */
  error: string | null;
  /** Maximum allowed runtime before job is considered stuck */
  max_runtime_seconds: number;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Update a job's status and metadata in the database.
 * 
 * @param jobId - The job ID to update
 * @param updates - Partial job object with fields to update
 */
async function updateJob(jobId: number, updates: Partial<EtlJob>): Promise<void> {
  try {
    const { error } = await supabaseServiceRole
      .from('etl_jobs')
      .update(updates)
      .eq('id', jobId);

    if (error) {
      logger.warn('Error updating job', { jobId, error: error.message });
      throw error;
    }
  } catch (error) {
    logger.logError('Failed to update job', error, { jobId });
  }
}

/**
 * Process a single ETL job based on its type.
 * 
 * ## Job Type Behaviors
 * 
 * **SEED**: Full historical data load
 * - Uses provided date range or defaults to last 6 months
 * - Processes all data in weekly batches
 * - Suitable for initial database population
 * 
 * **DAILY_UPDATE**: Incremental update
 * - Automatically determines start date from last processed tournament
 * - Processes all data up to current date
 * - Ideal for scheduled daily runs
 * 
 * **BATCH_PROCESS**: Cursor-based processing
 * - Processes a limited number of records per job
 * - Creates follow-up job if more data exists
 * - Designed for serverless environments with time limits
 * 
 * @param job - The job to process
 */
async function processJob(job: EtlJob): Promise<void> {
  logger.info('Processing job', { jobId: job.id, jobType: job.job_type });
  const startTime = Date.now();
  
  try {
    // Mark job as running and record start time
    await updateJob(job.id, {
      status: 'RUNNING',
      started_at: new Date().toISOString()
    });

    const processor = new EtlProcessor();
    
    switch (job.job_type) {
      case 'SEED':
        // SEED: Full historical data load
        // Uses provided date range or defaults to last 6 months
        await processor.processData(
          job.parameters.startDate || format(subMonths(new Date(), DEFAULT_SEED_MONTHS), 'yyyy-MM-dd'),
          job.parameters.endDate || format(new Date(), 'yyyy-MM-dd')
        );
        break;
        
      case 'DAILY_UPDATE':
        // DAILY_UPDATE: Incremental processing from last processed date
        // The processor will automatically determine the start date
        await processor.processData();
        break;
        
      case 'BATCH_PROCESS':
        // BATCH_PROCESS: Limited batch with cursor support
        // Ideal for serverless environments with execution time limits
        const batchSize = job.parameters.batchSize || DEFAULT_BATCH_SIZE;
        const { nextCursor, recordsProcessed, isComplete } = await processor.processBatch(
          job.parameters.cursor || null,
          batchSize
        );
        
        // If there's more data to process, create a follow-up job
        // This allows the worker to process data across multiple invocations
        if (!isComplete && nextCursor) {
          await supabaseServiceRole
            .from('etl_jobs')
            .insert({
              job_type: 'BATCH_PROCESS',
              status: 'PENDING',
              parameters: {
                ...job.parameters,
                cursor: nextCursor
              },
              priority: job.parameters.priority || 0
            });
          logger.info('Created follow-up job', { cursor: nextCursor });
        }
        
        // Record progress for this batch
        await updateJob(job.id, {
          records_processed: recordsProcessed,
          next_cursor: nextCursor || null
        });
        break;
    }

    // Mark job as completed
    await updateJob(job.id, {
      status: 'COMPLETED',
      completed_at: new Date().toISOString()
    });

    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    logger.info('Job completed successfully', { jobId: job.id, elapsedSeconds });
    
  } catch (error) {
    // Job failed - record error message for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.logError('Error processing job', error, { jobId: job.id });
    
    await updateJob(job.id, {
      status: 'FAILED',
      completed_at: new Date().toISOString(),
      error: errorMessage
    });
  }
}

/**
 * Find and process the next available job from the queue.
 * 
 * ## Job Selection Order
 * 1. Reset any stuck jobs (running longer than max_runtime_seconds)
 * 2. Select highest priority PENDING job
 * 3. Within same priority, select oldest job (FIFO)
 * 
 * @returns True if a job was processed, false if no jobs available
 */
async function findAndProcessNextJob(): Promise<boolean> {
  try {
    // First, reset any jobs that have been running too long
    // This prevents stuck jobs from blocking the queue
    await supabaseServiceRole.rpc('reset_stuck_jobs');
    
    // Query for the next job to process
    // Priority ordering: higher priority first, then oldest within same priority
    const { data: jobs, error } = await supabaseServiceRole
      .from('etl_jobs')
      .select('*')
      .eq('status', 'PENDING')
      .order('priority', { ascending: false })  // Higher priority first
      .order('created_at', { ascending: true }) // FIFO within same priority
      .limit(1);

    if (error) {
      logger.warn('Error finding next job', { error: error.message });
      return false;
    }

    if (!jobs || jobs.length === 0) {
      // No pending jobs - queue is empty
      return false;
    }

    // Process the selected job
    await processJob(jobs[0] as EtlJob);
    return true;
    
  } catch (error) {
    logger.logError('Error in findAndProcessNextJob', error);
    return false;
  }
}

/**
 * Main worker loop that continuously processes jobs from the queue.
 * 
 * ## Behavior
 * - Polls the job queue continuously
 * - Processes jobs one at a time
 * - Waits 60 seconds between polls when queue is empty
 * - Waits 30 seconds after errors before retrying
 * - Never exits (run as a daemon/service)
 * 
 * ## Usage
 * ```bash
 * # Development
 * npm run etl:worker
 * 
 * # Production (with PM2)
 * pm2 start npm --name "etl-worker" -- run etl:worker:prod
 * ```
 */
async function runWorker(): Promise<never> {
  logger.info('Starting ETL worker service');
  
  // Infinite loop - worker runs until killed
  while (true) {
    try {
      const jobProcessed = await findAndProcessNextJob();
      
      if (!jobProcessed) {
        // No jobs available - poll again after interval
        logger.debug('No jobs available, waiting', { waitSeconds: IDLE_POLL_INTERVAL_MS / 1000 });
        await new Promise(resolve => setTimeout(resolve, IDLE_POLL_INTERVAL_MS));
      }
      // If a job was processed, immediately check for more (no delay)
    } catch (error) {
      // Unexpected error in the main loop - wait before retrying
      logger.logError('Error in runWorker loop', error);
      await new Promise(resolve => setTimeout(resolve, ERROR_RECOVERY_INTERVAL_MS));
    }
  }
}

// =============================================================================
// ENTRY POINT
// =============================================================================

// When this file is run directly (not imported), start the worker
if (require.main === module) {
  runWorker().catch(error => {
    logger.logError('Fatal error', error);
    process.exit(1);
  });
}

// Export for use by other modules (e.g., cron triggers)
export { runWorker, processJob };
export type { EtlJob }; 