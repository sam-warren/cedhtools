import { supabaseServer } from '../lib/supabase';
import { format, subMonths } from 'date-fns';

async function simulateCronJob() {
  console.log('Simulating ETL cron job...');
  
  try {
    // Check for any running jobs
    const { data: activeJobs, error: activeJobsError } = await supabaseServer
      .from('etl_jobs_active')
      .select('id, job_type, status, created_at, runtime_seconds')
      .order('created_at', { ascending: false });
      
    if (activeJobsError) throw activeJobsError;
    
    if (activeJobs && activeJobs.length > 0) {
      const activeJob = activeJobs[0];
      console.log(`Skipping job creation - there's already an active ${activeJob.job_type} job (ID: ${activeJob.id})`);
      return;
    }

    // Check if we need to run a seed job
    const { data: lastSeedJob } = await supabaseServer
      .from('etl_jobs')
      .select('created_at')
      .eq('job_type', 'SEED')
      .order('created_at', { ascending: false })
      .limit(1);

    const sixMonthsAgo = subMonths(new Date(), 6);
    const shouldRunSeed = !lastSeedJob || !lastSeedJob[0] || new Date(lastSeedJob[0].created_at) < sixMonthsAgo;

    if (shouldRunSeed) {
      console.log('Creating seed job...');
      const { data: seedJob, error: seedError } = await supabaseServer
        .from('etl_jobs')
        .insert({
          job_type: 'SEED',
          status: 'PENDING',
          parameters: {
            startDate: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
            endDate: format(new Date(), 'yyyy-MM-dd')
          },
          priority: 2,
          max_runtime_seconds: 28800
        })
        .select();
        
      if (seedError) throw seedError;
      console.log(`Created seed job with ID: ${seedJob[0].id}`);
    } else {
      console.log('Creating daily update job...');
      const { data: dailyJob, error: dailyError } = await supabaseServer
        .from('etl_jobs')
        .insert({
          job_type: 'DAILY_UPDATE',
          status: 'PENDING',
          parameters: {
            endDate: format(new Date(), 'yyyy-MM-dd')
          },
          priority: 1,
          max_runtime_seconds: 3600
        })
        .select();
        
      if (dailyError) throw dailyError;
      console.log(`Created daily update job with ID: ${dailyJob[0].id}`);
    }

    // Show current jobs in the queue
    const { data: jobs } = await supabaseServer
      .from('etl_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('\nCurrent jobs in queue:');
    jobs?.forEach(job => {
      console.log(`- ${job.job_type} (ID: ${job.id}, Status: ${job.status}, Priority: ${job.priority})`);
    });

    // Monitor job status for a few minutes
    console.log('\nMonitoring job status for 5 minutes...');
    console.log('Press Ctrl+C to stop monitoring');
    
    let lastStatus = '';
    for (let i = 0; i < 60; i++) { // Check every 5 seconds for 5 minutes
      const { data: updatedJobs } = await supabaseServer
        .from('etl_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const status = updatedJobs?.map(job => 
        `${job.job_type} (ID: ${job.id}): ${job.status}`
      ).join('\n') || 'No jobs found';

      if (status !== lastStatus) {
        console.clear();
        console.log('Current job status:');
        console.log(status);
        lastStatus = status;
      }

      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    }

  } catch (error) {
    console.error('Error in cron simulation:', error);
  }
}

// Run the test
simulateCronJob().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 