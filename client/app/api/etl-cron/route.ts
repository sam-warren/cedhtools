import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { format } from 'date-fns';

// This endpoint will be called by Vercel Cron
export const runtime = 'nodejs';
export const maxDuration = 30; // We only need a short duration to queue the job

export async function GET() {
  try {
    console.log('ETL cron job triggered at', new Date().toISOString());
    
    // Check for any running jobs before queueing a new one
    const { data: activeJobs, error: activeJobsError } = await supabaseServer
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
    
    // Queue a new daily update job
    const { data, error } = await supabaseServer
      .from('etl_jobs')
      .insert({
        job_type: 'DAILY_UPDATE',
        status: 'PENDING',
        parameters: {
          // Today's date as the end date
          endDate: format(new Date(), 'yyyy-MM-dd')
        },
        priority: 1, // Higher priority than seed jobs
        max_runtime_seconds: 600 // 10 minutes max runtime per job
      })
      .select();
      
    if (error) throw error;
    
    return NextResponse.json({
      message: 'ETL job queued successfully',
      jobId: data[0].id,
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