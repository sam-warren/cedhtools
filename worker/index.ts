#!/usr/bin/env npx tsx
/**
 * Job Queue Worker
 * 
 * A long-running process that polls the database for pending jobs
 * and executes them. Designed to run on a server with PM2.
 * 
 * Usage:
 *   npx tsx worker/index.ts
 *   
 * Or with PM2:
 *   pm2 start ecosystem.config.js
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 * - TOPDECK_API_KEY: TopDeck.gg API key
 * - WORKER_ID: Unique identifier for this worker instance (optional)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import {
  createProgressLogger,
  createSupabaseAdmin,
  type AggregationStats,
  type EnrichmentStats,
  type SyncStats,
} from '../lib/jobs';
import { aggregateStats } from '../lib/jobs/aggregate';
import { enrichData, enrichDataFull } from '../lib/jobs/enrich';
import { syncTournaments, syncTournamentsFromDate } from '../lib/jobs/sync';

// ============================================
// Configuration
// ============================================

const POLL_INTERVAL_MS = 5000; // Check for jobs every 5 seconds
const WORKER_ID = process.env.WORKER_ID || `worker-${uuidv4().slice(0, 8)}`;
const JOB_TYPES = ['daily_update', 'full_seed', 'sync', 'enrich', 'aggregate'];

// ============================================
// Types
// ============================================

interface Job {
  id: number;
  job_type: string;
  status: string;
  config: Record<string, unknown>;
  created_at: string;
}

interface JobResult {
  sync?: SyncStats;
  enrich?: EnrichmentStats;
  aggregate?: AggregationStats;
  duration_ms: number;
}

// ============================================
// Logging
// ============================================

function log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    warn: '⚠️',
    error: '❌',
  }[level];
  console.log(`[${timestamp}] ${prefix} [${WORKER_ID}] ${message}`);
}

// ============================================
// Job Execution
// ============================================

async function executeDailyUpdate(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  config: Record<string, unknown>
): Promise<JobResult> {
  const startTime = Date.now();
  const logger = createProgressLogger((msg) => log(msg));
  
  log('Starting daily update pipeline...');
  
  // Sync last 7 days (or configured)
  const daysBack = (config.days_back as number) || 7;
  const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  
  const syncStats = await syncTournaments(supabase, {
    startDate,
    endDate: new Date(),
    logger,
  });
  
  log(`Sync complete: ${syncStats.tournamentsProcessed} tournaments processed`);
  
  // Enrich new data (incremental)
  const enrichStats = await enrichData(supabase, {
    incremental: true,
    skipValidation: false,
    logger,
  });
  
  log(`Enrich complete: ${enrichStats.cardsEnriched} cards, ${enrichStats.commandersEnriched} commanders`);
  
  // Re-aggregate stats
  const aggregateStatsResult = await aggregateStats(supabase, { logger });
  
  log(`Aggregate complete: ${aggregateStatsResult.commanderWeeklyStats} commander stats`);
  
  return {
    sync: syncStats,
    enrich: enrichStats,
    aggregate: aggregateStatsResult,
    duration_ms: Date.now() - startTime,
  };
}

async function executeFullSeed(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  config: Record<string, unknown>
): Promise<JobResult> {
  const startTime = Date.now();
  const logger = createProgressLogger((msg) => log(msg));
  
  const startDateStr = (config.start_date as string) || '2025-05-19';
  const startDate = new Date(startDateStr);
  
  log(`Starting full seed from ${startDate.toISOString()}...`);
  
  // Full sync from start date
  const syncStats = await syncTournamentsFromDate(supabase, startDate, logger);
  log(`Sync complete: ${syncStats.tournamentsProcessed} tournaments processed`);
  
  // Full enrich
  const skipValidation = (config.skip_validation as boolean) ?? false;
  const enrichStats = await enrichData(supabase, {
    incremental: false,
    skipValidation,
    logger,
  });
  
  log(`Enrich complete: ${enrichStats.cardsEnriched} cards enriched`);
  
  // Aggregate stats
  const aggregateStatsResult = await aggregateStats(supabase, { logger });
  log(`Aggregate complete: ${aggregateStatsResult.commanderWeeklyStats} stats created`);
  
  return {
    sync: syncStats,
    enrich: enrichStats,
    aggregate: aggregateStatsResult,
    duration_ms: Date.now() - startTime,
  };
}

async function executeSync(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  config: Record<string, unknown>
): Promise<JobResult> {
  const startTime = Date.now();
  const logger = createProgressLogger((msg) => log(msg));
  
  const daysBack = (config.days_back as number) || 7;
  const startDate = config.start_date 
    ? new Date(config.start_date as string)
    : new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  
  log(`Starting sync from ${startDate.toISOString()}...`);
  
  const syncStats = await syncTournaments(supabase, {
    startDate,
    endDate: new Date(),
    logger,
  });
  
  return {
    sync: syncStats,
    duration_ms: Date.now() - startTime,
  };
}

async function executeEnrich(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  config: Record<string, unknown>
): Promise<JobResult> {
  const startTime = Date.now();
  const logger = createProgressLogger((msg) => log(msg));
  
  const incremental = (config.incremental as boolean) ?? true;
  const skipValidation = (config.skip_validation as boolean) ?? false;
  
  log(`Starting enrich (incremental: ${incremental}, skip_validation: ${skipValidation})...`);
  
  let enrichStats: EnrichmentStats;
  if (incremental) {
    enrichStats = await enrichData(supabase, { incremental: true, skipValidation, logger });
  } else {
    enrichStats = await enrichDataFull(supabase, logger);
  }
  
  return {
    enrich: enrichStats,
    duration_ms: Date.now() - startTime,
  };
}

async function executeAggregate(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  _config: Record<string, unknown>
): Promise<JobResult> {
  const startTime = Date.now();
  const logger = createProgressLogger((msg) => log(msg));
  
  log('Starting stats aggregation...');
  
  const aggregateStatsResult = await aggregateStats(supabase, { logger });
  
  return {
    aggregate: aggregateStatsResult,
    duration_ms: Date.now() - startTime,
  };
}

async function executeJob(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  job: Job
): Promise<JobResult> {
  switch (job.job_type) {
    case 'daily_update':
      return executeDailyUpdate(supabase, job.config);
    case 'full_seed':
      return executeFullSeed(supabase, job.config);
    case 'sync':
      return executeSync(supabase, job.config);
    case 'enrich':
      return executeEnrich(supabase, job.config);
    case 'aggregate':
      return executeAggregate(supabase, job.config);
    default:
      throw new Error(`Unknown job type: ${job.job_type}`);
  }
}

// ============================================
// Job Claiming & Processing
// ============================================

async function claimJob(supabase: SupabaseClient): Promise<Job | null> {
  const { data, error } = await supabase.rpc('claim_job', {
    p_job_types: JOB_TYPES,
    p_worker_id: WORKER_ID,
  });
  
  if (error) {
    log(`Error claiming job: ${error.message}`, 'error');
    return null;
  }
  
  // RPC returns a row with NULL values when no job is found
  if (!data || !data.id || !data.job_type) {
    return null;
  }
  
  return data as Job;
}

async function completeJob(
  supabase: SupabaseClient,
  jobId: number,
  result: JobResult
): Promise<void> {
  const { error } = await supabase.rpc('complete_job', {
    p_job_id: jobId,
    p_result: result,
  });
  
  if (error) {
    log(`Error completing job ${jobId}: ${error.message}`, 'error');
  }
}

async function failJob(
  supabase: SupabaseClient,
  jobId: number,
  errorMessage: string
): Promise<void> {
  const { error } = await supabase.rpc('fail_job', {
    p_job_id: jobId,
    p_error: errorMessage,
  });
  
  if (error) {
    log(`Error failing job ${jobId}: ${error.message}`, 'error');
  }
}

function getMemoryMB(): string {
  const used = process.memoryUsage();
  return `${Math.round(used.heapUsed / 1024 / 1024)}MB`;
}

async function processJob(supabase: ReturnType<typeof createSupabaseAdmin>, job: Job): Promise<void> {
  log(`Processing job ${job.id} (${job.job_type})... [mem: ${getMemoryMB()}]`);
  
  try {
    const result = await executeJob(supabase, job);
    await completeJob(supabase, job.id, result);
    log(`Job ${job.id} completed in ${result.duration_ms}ms [mem: ${getMemoryMB()}]`);
    
    // Force garbage collection hint after large jobs
    if (global.gc) {
      global.gc();
      log(`GC triggered, mem: ${getMemoryMB()}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    log(`Job ${job.id} failed: ${errorMessage}`, 'error');
    if (stack) console.error(stack);
    await failJob(supabase, job.id, errorMessage);
  }
}

// ============================================
// Main Loop
// ============================================

let isShuttingDown = false;

async function pollForJobs(supabase: ReturnType<typeof createSupabaseAdmin>): Promise<void> {
  while (!isShuttingDown) {
    try {
      const job = await claimJob(supabase);
      
      if (job) {
        await processJob(supabase, job);
      } else {
        // No jobs available, wait before polling again
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`Error in job poll loop: ${errorMessage}`, 'error');
      // Wait a bit before retrying on error
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS * 2));
    }
  }
}

/**
 * Maximum retry attempts for crashed jobs before giving up
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Reset any jobs that were left running by this worker (crash recovery).
 * This handles the case where PM2 killed us due to OOM or crash.
 * 
 * Jobs are re-queued as pending (up to MAX_RETRY_ATTEMPTS times) so they can be retried.
 */
async function recoverStuckJobs(supabase: ReturnType<typeof createSupabaseAdmin>): Promise<void> {
  log('Checking for stuck jobs from previous run...');
  
  // First, find any jobs that were running with our worker ID (we crashed)
  const { data: myStuckJobs, error: findError } = await supabase
    .from('jobs')
    .select('id, job_type, config, retry_count')
    .eq('status', 'running')
    .eq('worker_id', WORKER_ID);
  
  if (findError) {
    log(`Error finding own stuck jobs: ${findError.message}`, 'warn');
  } else if (myStuckJobs && myStuckJobs.length > 0) {
    for (const job of myStuckJobs) {
      const retryCount = (job.retry_count || 0) + 1;
      
      if (retryCount <= MAX_RETRY_ATTEMPTS) {
        // Re-queue for retry
        const { error: updateError } = await supabase
          .from('jobs')
          .update({
            status: 'pending',
            started_at: null,
            worker_id: null,
            retry_count: retryCount,
            error: `Worker ${WORKER_ID} crashed (attempt ${retryCount}/${MAX_RETRY_ATTEMPTS}) - re-queued for retry`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);
        
        if (updateError) {
          log(`Error re-queuing job ${job.id}: ${updateError.message}`, 'warn');
        } else {
          log(`Re-queued crashed job ${job.id} (${job.job_type}) for retry (attempt ${retryCount}/${MAX_RETRY_ATTEMPTS})`, 'warn');
        }
      } else {
        // Max retries exceeded, mark as permanently failed
        const { error: updateError } = await supabase
          .from('jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            retry_count: retryCount,
            error: `Worker ${WORKER_ID} crashed - max retries (${MAX_RETRY_ATTEMPTS}) exceeded`,
          })
          .eq('id', job.id);
        
        if (updateError) {
          log(`Error failing job ${job.id}: ${updateError.message}`, 'warn');
        } else {
          log(`Job ${job.id} (${job.job_type}) failed permanently after ${MAX_RETRY_ATTEMPTS} retries`, 'error');
        }
      }
    }
  }
  
  // Also reset any jobs that have been running for more than 4 hours (from any worker)
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
  const { data: oldStuckJobs, error: oldError } = await supabase
    .from('jobs')
    .update({
      status: 'pending',
      started_at: null,
      worker_id: null,
      error: 'Auto-reset: job was stuck for >4 hours',
    })
    .eq('status', 'running')
    .lt('started_at', fourHoursAgo)
    .select('id, job_type, worker_id');
  
  if (oldError) {
    log(`Error resetting old stuck jobs: ${oldError.message}`, 'warn');
  } else if (oldStuckJobs && oldStuckJobs.length > 0) {
    for (const job of oldStuckJobs) {
      log(`Reset stuck job ${job.id} (${job.job_type}) from worker ${job.worker_id} - was running >4h`, 'warn');
    }
  }
  
  log('Stuck job recovery complete');
}

async function main(): Promise<void> {
  log('Worker starting...');
  log(`Worker ID: ${WORKER_ID}`);
  log(`Job types: ${JOB_TYPES.join(', ')}`);
  log(`Poll interval: ${POLL_INTERVAL_MS}ms`);
  
  // Validate environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const topdeckKey = process.env.TOPDECK_API_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    log('Missing required Supabase environment variables', 'error');
    process.exit(1);
  }
  
  if (!topdeckKey) {
    log('Missing TOPDECK_API_KEY - sync jobs will fail', 'warn');
  }
  
  const supabase = createSupabaseAdmin();
  
  // Recover any stuck jobs from crashes
  await recoverStuckJobs(supabase);
  
  // Handle graceful shutdown
  let shutdownTimer: NodeJS.Timeout | null = null;
  const shutdown = (source: string) => {
    log(`Shutdown signal received (${source}), finishing current job...`);
    isShuttingDown = true;
    
    // If we're mid-job and can't exit gracefully, force exit after 30 seconds
    // This prevents PM2 from waiting forever on a blocked job
    if (!shutdownTimer) {
      shutdownTimer = setTimeout(() => {
        log('Graceful shutdown timed out after 30s, forcing exit...', 'warn');
        process.exit(0);
      }, 30000);
    }
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle PM2 shutdown via IPC message (when shutdown_with_message: true)
  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      shutdown('PM2 IPC');
    }
  });
  
  log('Worker ready, polling for jobs...');
  
  // Signal to PM2 that we're ready (if running under PM2 with wait_ready: true)
  if (typeof process.send === 'function') {
    process.send('ready');
  }
  
  await pollForJobs(supabase);
  
  log('Worker shutdown complete');
}

// ============================================
// Entry Point
// ============================================

// Handle uncaught errors for debugging
process.on('uncaughtException', (error) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ [${WORKER_ID}] Uncaught Exception: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ [${WORKER_ID}] Unhandled Rejection at:`, promise);
  console.error('Reason:', reason);
  process.exit(1);
});

// Log memory usage periodically during long jobs
const logMemory = () => {
  const used = process.memoryUsage();
  const mb = (bytes: number) => Math.round(bytes / 1024 / 1024);
  const heapMB = mb(used.heapUsed);
  const rssMB = mb(used.rss);
  log(`Memory: heap=${heapMB}MB, rss=${rssMB}MB, external=${mb(used.external)}MB`);
  
  // Warn if approaching dangerous memory levels on a 2GB droplet
  if (rssMB > 1500) {
    log(`⚠️ HIGH MEMORY WARNING: RSS=${rssMB}MB approaching 2GB limit`, 'warn');
  }
};

// Log memory every 2 minutes
setInterval(logMemory, 120000);

main().catch((error) => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error.stack);
  process.exit(1);
});

