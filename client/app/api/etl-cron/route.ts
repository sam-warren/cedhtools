import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { format, subMonths } from 'date-fns';

// This endpoint will be called by Vercel Cron
export const runtime = 'nodejs';
export const maxDuration = 30; // We only need a short duration to queue the job

// Create Supabase client with cookie handling
async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          return [...cookieStore.getAll()];
        },
        setAll: (cookies) => {
          cookies.map((cookie) => {
            cookieStore.set(cookie.name, cookie.value, cookie.options);
          });
        }
      },
    }
  );
}

export async function GET() {
  try {
    const supabase = await createClient();
    console.log('ETL cron job triggered at', new Date().toISOString());
    
    // Check for any running jobs before queueing a new one
    const { data: activeJobs, error: activeJobsError } = await supabase
      .from('etl_jobs_active')
      .select('id, job_type, status, created_at, runtime_seconds')
      .order('created_at', { ascending: false });
      
    if (activeJobsError) throw activeJobsError;
    
    // If there are already active jobs, don't create a new one
    if (activeJobs && activeJobs.length > 0) {
      const activeJob = activeJobs[0];
      return NextResponse.json({
        message: `Skipping job creation - there's already an active ${activeJob.job_type} job (ID: ${activeJob.id})`,
        activeJob,
        timestamp: new Date().toISOString(),
      });
    }

    // Check if we need to run a seed job (every 6 months)
    const { data: lastSeedJob } = await supabase
      .from('etl_jobs')
      .select('created_at')
      .eq('job_type', 'SEED')
      .order('created_at', { ascending: false })
      .limit(1);

    const sixMonthsAgo = subMonths(new Date(), 6);
    const shouldRunSeed = !lastSeedJob || !lastSeedJob[0] || new Date(lastSeedJob[0].created_at) < sixMonthsAgo;

    if (shouldRunSeed) {
      // Queue a seed job
      const { data: seedJob, error: seedError } = await supabase
        .from('etl_jobs')
        .insert({
          job_type: 'SEED',
          status: 'PENDING',
          parameters: {
            startDate: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
            endDate: format(new Date(), 'yyyy-MM-dd')
          },
          priority: 2, // Higher priority than daily updates
          max_runtime_seconds: 28800 // 8 hours max runtime for seed job
        })
        .select();
        
      if (seedError) throw seedError;
      
      return NextResponse.json({
        message: 'Seed job queued successfully',
        jobId: seedJob[0].id,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Queue a daily update job
    const { data: dailyJob, error: dailyError } = await supabase
      .from('etl_jobs')
      .insert({
        job_type: 'DAILY_UPDATE',
        status: 'PENDING',
        parameters: {
          endDate: format(new Date(), 'yyyy-MM-dd')
        },
        priority: 1,
        max_runtime_seconds: 3600 // 1 hour max runtime for daily update
      })
      .select();
      
    if (dailyError) throw dailyError;
    
    return NextResponse.json({
      message: 'Daily update job queued successfully',
      jobId: dailyJob[0].id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in ETL cron job:', error);
    return NextResponse.json(
      {
        error: 'Failed to queue ETL job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 