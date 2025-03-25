import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { format, subMonths } from 'date-fns';

// Verify API key from request headers
async function verifyApiKey(request: Request) {
  // Get API key from Authorization header
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const apiKey = authHeader.slice(7);
  const expectedApiKey = process.env.ETL_API_KEY;
  
  if (!expectedApiKey || apiKey !== expectedApiKey) {
    return false;
  }
  
  return true;
}

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

// API status and job status endpoint
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check if we're requesting job status (requires auth)
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const listJobs = searchParams.get('list') === 'true';
    
    if (jobId || listJobs) {
      // For job status requests, verify API key
      const isAuthorized = await verifyApiKey(request);
      
      if (!isAuthorized) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      if (jobId) {
        // Get status of specific job
        const { data, error } = await supabase
          .from('etl_jobs')
          .select('*')
          .eq('id', jobId)
          .single();
          
        if (error) throw error;
        
        return NextResponse.json({
          job: data,
          timestamp: new Date().toISOString()
        });
      } else if (listJobs) {
        // Get recent jobs
        const { data, error } = await supabase
          .from('etl_jobs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (error) throw error;
        
        return NextResponse.json({
          jobs: data,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Default: simple status endpoint, no auth required
    return NextResponse.json({
      status: 'ETL API is running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in ETL GET handler:', error);
    return NextResponse.json(
      {
        error: 'API error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Queue ETL job endpoint
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verify API key
    const isAuthorized = await verifyApiKey(request);
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { 
      jobType = 'BATCH_PROCESS',
      startDate,
      endDate, 
      batchSize = 50,
      priority = 0,
      maxRuntimeSeconds = 600
    } = body;
    
    // Validate job type
    if (!['SEED', 'DAILY_UPDATE', 'BATCH_PROCESS'].includes(jobType)) {
      return NextResponse.json(
        { error: 'Invalid job type. Must be one of: SEED, DAILY_UPDATE, BATCH_PROCESS' },
        { status: 400 }
      );
    }
    
    // Queue the job
    const { data, error } = await supabase
      .from('etl_jobs')
      .insert({
        job_type: jobType,
        status: 'PENDING',
        parameters: {
          startDate: startDate || format(subMonths(new Date(), jobType === 'SEED' ? 6 : 1), 'yyyy-MM-dd'),
          endDate: endDate || format(new Date(), 'yyyy-MM-dd'),
          batchSize
        },
        priority,
        max_runtime_seconds: maxRuntimeSeconds
      })
      .select();
      
    if (error) throw error;
    
    return NextResponse.json({
      message: `ETL ${jobType} job queued successfully`,
      jobId: data[0].id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error queueing ETL job:', error);
    return NextResponse.json(
      {
        error: 'Failed to queue ETL job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 