/**
 * ETL Worker Service
 * 
 * This service runs independently of the web application to process ETL jobs
 * from the queue. It can be deployed to a separate VPS/EC2 instance or run
 * locally for development.
 */

import EtlProcessor from './processor';
import { supabaseServer, supabaseServiceRole } from '../supabase';
import { format, subMonths } from 'date-fns';

interface EtlJob {
  id: number;
  job_type: 'SEED' | 'DAILY_UPDATE' | 'BATCH_PROCESS';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
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
  next_cursor: string | null;
  records_processed: number;
  error: string | null;
  max_runtime_seconds: number;
}

async function updateJob(jobId: number, updates: Partial<EtlJob>) {
  try {
    const { error } = await supabaseServiceRole
      .from('etl_jobs')
      .update(updates)
      .eq('id', jobId);

    if (error) {
      console.error(`Error updating job ${jobId}:`, error);
      throw error;
    }
  } catch (error) {
    console.error(`Failed to update job ${jobId}:`, error);
  }
}

async function processJob(job: EtlJob) {
  console.log(`[Worker] Processing job ${job.id} (${job.job_type})`);
  const startTime = Date.now();
  
  try {
    // Mark job as running
    await updateJob(job.id, {
      status: 'RUNNING',
      started_at: new Date().toISOString()
    });

    const processor = new EtlProcessor();
    
    switch (job.job_type) {
      case 'SEED':
        // Handle seeding job - can specify date range
        await processor.processData(
          job.parameters.startDate || format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
          job.parameters.endDate || format(new Date(), 'yyyy-MM-dd')
        );
        break;
        
      case 'DAILY_UPDATE':
        // Process daily update, which will use the last processed date
        await processor.processData();
        break;
        
      case 'BATCH_PROCESS':
        // Process a specific batch with cursor support
        const batchSize = job.parameters.batchSize || 50;
        const { nextCursor, recordsProcessed, isComplete } = await processor.processBatch(
          job.parameters.cursor || null,
          batchSize
        );
        
        // If there's more to process, create a new job for the next batch
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
        }
        
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
    console.log(`[Worker] Job ${job.id} completed successfully in ${elapsedSeconds}s`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Worker] Error processing job ${job.id}:`, error);
    
    // Mark job as failed
    await updateJob(job.id, {
      status: 'FAILED',
      completed_at: new Date().toISOString(),
      error: errorMessage
    });
  }
}

async function findAndProcessNextJob() {
  try {
    // Reset any stuck jobs first
    await supabaseServiceRole.rpc('reset_stuck_jobs');
    
    // Find next available job
    const { data: jobs, error } = await supabaseServer
      .from('etl_jobs')
      .select('*')
      .eq('status', 'PENDING')
      .order('priority', { ascending: false })  // Higher priority first
      .order('created_at', { ascending: true }) // Oldest first within same priority
      .limit(1);

    if (error) {
      console.error('[Worker] Error finding next job:', error);
      return false;
    }

    if (!jobs || jobs.length === 0) {
      // No jobs available
      return false;
    }

    // Process the job
    await processJob(jobs[0] as EtlJob);
    return true;
    
  } catch (error) {
    console.error('[Worker] Error in findAndProcessNextJob:', error);
    return false;
  }
}

async function runWorker() {
  console.log('[Worker] Starting ETL worker service');
  
  // Main worker loop
  while (true) {
    try {
      const jobProcessed = await findAndProcessNextJob();
      
      if (!jobProcessed) {
        // No jobs available, wait before checking again
        console.log('[Worker] No jobs available, waiting for 60 seconds');
        await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute
      }
    } catch (error) {
      console.error('[Worker] Error in runWorker loop:', error);
      // If there's an error in the worker loop, wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
    }
  }
}

// Entry point when running this file directly
if (require.main === module) {
  runWorker().catch(error => {
    console.error('[Worker] Fatal error:', error);
    process.exit(1);
  });
}

export { runWorker, processJob };
export type { EtlJob }; 