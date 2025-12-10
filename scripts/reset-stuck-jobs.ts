#!/usr/bin/env npx tsx
/**
 * Reset Stuck Jobs Script
 * 
 * Resets jobs that are stuck in 'running' status.
 * Use this after a worker crash to allow jobs to be retried.
 * 
 * Usage:
 *   npx tsx scripts/reset-stuck-jobs.ts         # Reset all stuck jobs to pending
 *   npx tsx scripts/reset-stuck-jobs.ts --fail  # Mark stuck jobs as failed instead
 *   npx tsx scripts/reset-stuck-jobs.ts --list  # Just list stuck jobs without changing
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createSupabaseAdmin } from '../lib/jobs';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const listOnly = args.includes('--list');
  const markFailed = args.includes('--fail');
  
  const supabase = createSupabaseAdmin();
  
  console.log('🔍 Checking for stuck jobs...\n');
  
  // Find all running jobs
  const { data: stuckJobs, error } = await supabase
    .from('jobs')
    .select('id, job_type, status, worker_id, started_at, config')
    .eq('status', 'running')
    .order('started_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching jobs:', error.message);
    process.exit(1);
  }
  
  if (!stuckJobs || stuckJobs.length === 0) {
    console.log('✅ No stuck jobs found!');
    return;
  }
  
  console.log(`Found ${stuckJobs.length} job(s) in 'running' status:\n`);
  
  for (const job of stuckJobs) {
    const startedAt = job.started_at ? new Date(job.started_at) : null;
    const runningFor = startedAt 
      ? `${Math.round((Date.now() - startedAt.getTime()) / 1000 / 60)} minutes`
      : 'unknown duration';
    
    console.log(`  Job #${job.id}:`);
    console.log(`    Type: ${job.job_type}`);
    console.log(`    Worker: ${job.worker_id || 'unknown'}`);
    console.log(`    Started: ${job.started_at || 'unknown'}`);
    console.log(`    Running for: ${runningFor}`);
    console.log(`    Config: ${JSON.stringify(job.config)}`);
    console.log('');
  }
  
  if (listOnly) {
    console.log('Use --fail to mark as failed, or run without args to reset to pending.');
    return;
  }
  
  const newStatus = markFailed ? 'failed' : 'pending';
  const errorMsg = markFailed 
    ? 'Manually marked as failed via reset-stuck-jobs script'
    : null;
  
  console.log(`\n📝 ${markFailed ? 'Marking jobs as failed' : 'Resetting jobs to pending'}...\n`);
  
  for (const job of stuckJobs) {
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    
    if (markFailed) {
      updateData.error = errorMsg;
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.started_at = null;
      updateData.worker_id = null;
    }
    
    const { error: updateError } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', job.id);
    
    if (updateError) {
      console.error(`  ❌ Failed to update job #${job.id}: ${updateError.message}`);
    } else {
      console.log(`  ✅ Job #${job.id} (${job.job_type}) → ${newStatus}`);
    }
  }
  
  console.log('\n🎉 Done!');
  
  if (!markFailed) {
    console.log('\nJobs have been reset to pending and will be picked up by the next worker.');
    console.log('Make sure your worker is running: pm2 start ecosystem.config.js');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});

