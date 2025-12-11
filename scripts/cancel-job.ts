#!/usr/bin/env npx tsx
/**
 * Cancel Job Script
 * 
 * Cancels pending or running jobs. Running jobs will stop at their next checkpoint.
 * 
 * Usage:
 *   npx tsx scripts/cancel-job.ts <job_id>     # Cancel specific job by ID
 *   npx tsx scripts/cancel-job.ts --running    # Cancel all running jobs
 *   npx tsx scripts/cancel-job.ts --pending    # Cancel all pending jobs
 *   npx tsx scripts/cancel-job.ts --all        # Cancel all pending and running jobs
 *   npx tsx scripts/cancel-job.ts --list       # List cancellable jobs
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createSupabaseAdmin } from '../lib/jobs';

// ============================================
// Types
// ============================================

interface JobRecord {
  id: number;
  job_type: string;
  status: string;
  priority: number;
  config: Record<string, unknown>;
  started_at: string | null;
  completed_at: string | null;
  worker_id: string | null;
  created_at: string;
  error: string | null;
}

// ============================================
// Main Functions
// ============================================

async function listCancellableJobs(): Promise<void> {
  const supabase = createSupabaseAdmin();
  
  console.log('📋 Cancellable Jobs (pending or running):\n');
  
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .in('status', ['pending', 'running'])
    .order('created_at', { ascending: false }) as { data: JobRecord[] | null; error: { message: string } | null };
  
  if (error) {
    console.error('Error fetching jobs:', error.message);
    process.exit(1);
  }
  
  if (!jobs || jobs.length === 0) {
    console.log('No cancellable jobs found.');
    return;
  }
  
  const pendingJobs = jobs.filter(j => j.status === 'pending');
  const runningJobs = jobs.filter(j => j.status === 'running');
  
  if (runningJobs.length > 0) {
    console.log('🔄 Running Jobs:');
    console.log('-'.repeat(80));
    for (const job of runningJobs) {
      const runningFor = job.started_at 
        ? `${Math.round((Date.now() - new Date(job.started_at).getTime()) / 1000 / 60)}m`
        : '?';
      console.log(`  #${job.id}\t${(job.job_type || '').padEnd(16)}\tworker: ${job.worker_id || '?'}\trunning: ${runningFor}`);
    }
    console.log('');
  }
  
  if (pendingJobs.length > 0) {
    console.log('⏳ Pending Jobs:');
    console.log('-'.repeat(80));
    for (const job of pendingJobs) {
      const created = new Date(job.created_at).toISOString().slice(0, 19);
      console.log(`  #${job.id}\t${(job.job_type || '').padEnd(16)}\tpriority: ${job.priority}\tcreated: ${created}`);
    }
    console.log('');
  }
  
  console.log(`\nTotal: ${runningJobs.length} running, ${pendingJobs.length} pending`);
  console.log('\nTo cancel:');
  console.log('  npm run job:cancel <id>       # Cancel specific job');
  console.log('  npm run job:cancel -- --running   # Cancel all running jobs');
  console.log('  npm run job:cancel -- --pending   # Cancel all pending jobs');
  console.log('  npm run job:cancel -- --all       # Cancel all');
}

async function cancelJob(jobId: number): Promise<boolean> {
  const supabase = createSupabaseAdmin();
  
  console.log(`Cancelling job #${jobId}...`);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('cancel_job', {
    p_job_id: jobId,
  }) as { data: JobRecord | null; error: { message: string } | null };
  
  if (error) {
    console.error(`  ❌ Failed to cancel job #${jobId}: ${error.message}`);
    return false;
  }
  
  if (data) {
    const wasRunning = data.started_at !== null;
    if (wasRunning) {
      console.log(`  ✅ Job #${jobId} (${data.job_type}) marked for cancellation`);
      console.log(`     Worker ${data.worker_id} will stop at next checkpoint`);
    } else {
      console.log(`  ✅ Job #${jobId} (${data.job_type}) cancelled immediately`);
    }
  }
  
  return true;
}

async function cancelJobsByStatus(status: 'running' | 'pending' | 'all'): Promise<void> {
  const supabase = createSupabaseAdmin();
  
  const statuses: ('pending' | 'running')[] = status === 'all' ? ['pending', 'running'] : [status];
  
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, job_type, status, worker_id')
    .in('status', statuses)
    .order('id', { ascending: true }) as { data: JobRecord[] | null; error: { message: string } | null };
  
  if (error) {
    console.error('Error fetching jobs:', error.message);
    process.exit(1);
  }
  
  if (!jobs || jobs.length === 0) {
    console.log(`No ${status} jobs to cancel.`);
    return;
  }
  
  console.log(`\n🚫 Cancelling ${jobs.length} ${status === 'all' ? 'pending/running' : status} job(s)...\n`);
  
  let cancelled = 0;
  let failed = 0;
  
  for (const job of jobs) {
    const success = await cancelJob(job.id);
    if (success) cancelled++;
    else failed++;
  }
  
  console.log(`\n📊 Results: ${cancelled} cancelled, ${failed} failed`);
  
  const runningJobs = jobs.filter(j => j.status === 'running');
  if (runningJobs.length > 0) {
    console.log('\n⚠️  Running jobs will stop at their next checkpoint.');
    console.log('   This may take a few seconds to a few minutes depending on the operation.');
    console.log('   Monitor with: npm run job:status');
  }
}

function printUsage(): void {
  console.log(`
cedhtools Cancel Job CLI

Usage: npx tsx scripts/cancel-job.ts <command>

Commands:
  <job_id>    Cancel a specific job by ID
  --list      List all cancellable jobs (pending or running)
  --running   Cancel all running jobs
  --pending   Cancel all pending jobs
  --all       Cancel all pending and running jobs

Examples:
  npx tsx scripts/cancel-job.ts 42          # Cancel job #42
  npx tsx scripts/cancel-job.ts --list      # List cancellable jobs
  npx tsx scripts/cancel-job.ts --running   # Cancel all running jobs

Notes:
  - Pending jobs are cancelled immediately
  - Running jobs are marked for cancellation and will stop at the next checkpoint
  - The worker checks for cancellation between batches during long operations
  - Use 'npm run job:status' to monitor job status
`);
}

// ============================================
// Main
// ============================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    return;
  }
  
  if (args[0] === '--list') {
    await listCancellableJobs();
    return;
  }
  
  if (args[0] === '--running') {
    await cancelJobsByStatus('running');
    return;
  }
  
  if (args[0] === '--pending') {
    await cancelJobsByStatus('pending');
    return;
  }
  
  if (args[0] === '--all') {
    await cancelJobsByStatus('all');
    return;
  }
  
  // Try to parse as job ID
  const jobId = parseInt(args[0], 10);
  if (isNaN(jobId)) {
    console.error(`Invalid job ID: ${args[0]}`);
    printUsage();
    process.exit(1);
  }
  
  const success = await cancelJob(jobId);
  if (!success) {
    process.exit(1);
  }
  
  console.log('\n💡 Monitor with: npm run job:status');
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});

