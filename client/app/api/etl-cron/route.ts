/**
 * ETL Cron Job API Route
 * 
 * Called by Vercel Cron to queue ETL jobs. This endpoint:
 * 1. Validates CRON_SECRET authorization
 * 2. Checks for existing active jobs (prevents concurrent runs)
 * 3. Queues seed jobs every 6 months, otherwise daily updates
 */

import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { format, subMonths } from 'date-fns';
import { etlLogger } from '@/lib/logger';
import { 
    AuthenticationError, 
    DatabaseError, 
    createErrorResponse, 
    isAppError 
} from '@/lib/errors';
import { 
    WORKER_DEFAULT_MAX_RUNTIME_SECONDS, 
    SEED_JOB_MAX_RUNTIME_SECONDS,
    SEED_JOB_INTERVAL_MONTHS 
} from '@/lib/etl/constants';

// Configuration for Vercel deployment
export const runtime = 'nodejs';
export const maxDuration = 30; // Short duration - we only queue the job

const logger = etlLogger.child({ module: 'cron' });

export async function GET(request: Request) {
    try {
        // Validate cron secret
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            throw new AuthenticationError('Invalid or missing CRON_SECRET');
        }

        const supabase = createServiceRoleClient();
        logger.info('ETL cron job triggered');

        // Check for active jobs to prevent concurrent processing
        const { data: activeJobs, error: activeJobsError } = await supabase
            .from('etl_jobs_active')
            .select('id, job_type, status, created_at, runtime_seconds')
            .order('created_at', { ascending: false });

        if (activeJobsError) {
            throw new DatabaseError('Failed to check active jobs', 'select', {
                error: activeJobsError.message
            });
        }

        // Skip if there's already an active job
        if (activeJobs && activeJobs.length > 0) {
            const activeJob = activeJobs[0];
            logger.info('Skipping job creation - active job exists', { 
                jobId: activeJob.id,
                jobType: activeJob.job_type 
            });
            
            return NextResponse.json({
                message: `Skipping job creation - there's already an active ${activeJob.job_type} job (ID: ${activeJob.id})`,
                activeJob,
                timestamp: new Date().toISOString(),
            });
        }

        // Determine if we need a seed job (every 6 months)
        const { data: lastSeedJob } = await supabase
            .from('etl_jobs')
            .select('created_at')
            .eq('job_type', 'SEED')
            .order('created_at', { ascending: false })
            .limit(1);

        const seedInterval = subMonths(new Date(), SEED_JOB_INTERVAL_MONTHS);
        const shouldRunSeed = !lastSeedJob || 
            !lastSeedJob[0] || 
            new Date(lastSeedJob[0].created_at) < seedInterval;

        if (shouldRunSeed) {
            return await queueSeedJob(supabase);
        }

        return await queueDailyUpdateJob(supabase);

    } catch (error) {
        if (isAppError(error)) {
            logger.warn('Cron job failed', { code: error.code, message: error.message });
        } else {
            logger.logError('Unexpected error in ETL cron', error);
        }
        return createErrorResponse(error);
    }
}

/**
 * Queue a seed job for full historical data processing
 */
async function queueSeedJob(supabase: ReturnType<typeof createServiceRoleClient>) {
    const { data: seedJob, error: seedError } = await supabase
        .from('etl_jobs')
        .insert({
            job_type: 'SEED',
            status: 'PENDING',
            parameters: {
                startDate: format(subMonths(new Date(), SEED_JOB_INTERVAL_MONTHS), 'yyyy-MM-dd'),
                endDate: format(new Date(), 'yyyy-MM-dd')
            },
            priority: 2, // Higher priority than daily updates
            max_runtime_seconds: SEED_JOB_MAX_RUNTIME_SECONDS
        })
        .select();

    if (seedError) {
        throw new DatabaseError('Failed to queue seed job', 'insert', {
            error: seedError.message
        });
    }

    logger.info('Seed job queued', { jobId: seedJob[0].id });

    return NextResponse.json({
        message: 'Seed job queued successfully',
        jobId: seedJob[0].id,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Queue a daily update job for recent tournament data
 */
async function queueDailyUpdateJob(supabase: ReturnType<typeof createServiceRoleClient>) {
    const { data: dailyJob, error: dailyError } = await supabase
        .from('etl_jobs')
        .insert({
            job_type: 'DAILY_UPDATE',
            status: 'PENDING',
            parameters: {
                endDate: format(new Date(), 'yyyy-MM-dd')
            },
            priority: 1,
            max_runtime_seconds: WORKER_DEFAULT_MAX_RUNTIME_SECONDS
        })
        .select();

    if (dailyError) {
        throw new DatabaseError('Failed to queue daily job', 'insert', {
            error: dailyError.message
        });
    }

    logger.info('Daily update job queued', { jobId: dailyJob[0].id });

    return NextResponse.json({
        message: 'Daily update job queued successfully',
        jobId: dailyJob[0].id,
        timestamp: new Date().toISOString(),
    });
}
