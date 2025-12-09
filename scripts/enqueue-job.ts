#!/usr/bin/env npx tsx
/**
 * Job Queue CLI
 * 
 * Enqueue jobs for the worker to process.
 * 
 * Usage:
 *   npx tsx scripts/enqueue-job.ts daily_update
 *   npx tsx scripts/enqueue-job.ts full_seed --start-date 2025-05-19
 *   npx tsx scripts/enqueue-job.ts sync --days-back 14
 *   npx tsx scripts/enqueue-job.ts enrich --incremental
 *   npx tsx scripts/enqueue-job.ts aggregate
 *   npx tsx scripts/enqueue-job.ts status
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createSupabaseAdmin } from '../lib/jobs';

// ============================================
// Types
// ============================================

type JobType = 'daily_update' | 'full_seed' | 'sync' | 'enrich' | 'aggregate';

interface JobConfig {
  start_date?: string;
  days_back?: number;
  incremental?: boolean;
  skip_validation?: boolean;
}

// ============================================
// CLI Argument Parsing
// ============================================

function parseArgs(): { command: string; config: JobConfig } {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const config: JobConfig = {};
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--start-date' && args[i + 1]) {
      config.start_date = args[++i];
    } else if (arg === '--days-back' && args[i + 1]) {
      config.days_back = parseInt(args[++i], 10);
    } else if (arg === '--incremental') {
      config.incremental = true;
    } else if (arg === '--full') {
      config.incremental = false;
    } else if (arg === '--skip-validation') {
      config.skip_validation = true;
    }
  }
  
  return { command, config };
}

function printUsage(): void {
  console.log(`
cedhtools Job Queue CLI

Usage: npx tsx scripts/enqueue-job.ts <command> [options]

Commands:
  daily_update    Enqueue a daily update job (sync + enrich + aggregate)
  full_seed       Enqueue a full seed job from a start date
  sync            Enqueue a sync-only job
  enrich          Enqueue an enrich-only job
  aggregate       Enqueue an aggregate-only job
  status          Show recent job status

Options:
  --start-date    Start date for sync (YYYY-MM-DD)
  --days-back     Number of days back to sync (default: 7)
  --incremental   Use incremental mode for enrich (default)
  --full          Use full mode for enrich (clears existing data)
  --skip-validation  Skip decklist validation during enrich

Examples:
  npx tsx scripts/enqueue-job.ts daily_update
  npx tsx scripts/enqueue-job.ts full_seed --start-date 2025-05-19 --skip-validation
  npx tsx scripts/enqueue-job.ts sync --days-back 14
  npx tsx scripts/enqueue-job.ts enrich --full
  npx tsx scripts/enqueue-job.ts status
`);
}

// ============================================
// Commands
// ============================================

async function enqueueJob(jobType: JobType, config: JobConfig): Promise<void> {
  const supabase = createSupabaseAdmin();
  
  console.log(`Enqueueing ${jobType} job...`);
  console.log('Config:', JSON.stringify(config, null, 2));
  
  const { data, error } = await supabase.rpc('enqueue_job', {
    p_job_type: jobType,
    p_config: config,
    p_priority: jobType === 'full_seed' ? 1 : 5,
  });
  
  if (error) {
    console.error('Error enqueueing job:', error.message);
    process.exit(1);
  }
  
  console.log('✅ Job enqueued successfully!');
  console.log('Job ID:', data.id);
  console.log('Status:', data.status);
  console.log('\nMonitor with: npx tsx scripts/enqueue-job.ts status');
}

async function showStatus(): Promise<void> {
  const supabase = createSupabaseAdmin();
  
  console.log('Recent Jobs:\n');
  
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (error) {
    console.error('Error fetching jobs:', error.message);
    process.exit(1);
  }
  
  if (!jobs || jobs.length === 0) {
    console.log('No jobs found.');
    return;
  }
  
  // Print table header
  console.log('ID\t| Type\t\t\t| Status\t| Created\t\t\t| Duration');
  console.log('-'.repeat(90));
  
  for (const job of jobs) {
    const duration = job.completed_at && job.started_at
      ? `${Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000)}s`
      : '-';
    
    const type = job.job_type.padEnd(16);
    const status = job.status.padEnd(10);
    const created = new Date(job.created_at).toISOString().slice(0, 19);
    
    console.log(`${job.id}\t| ${type}| ${status}| ${created}\t| ${duration}`);
    
    if (job.error) {
      console.log(`\t  └─ Error: ${job.error.slice(0, 60)}...`);
    }
  }
  
  // Show summary
  const pending = jobs.filter(j => j.status === 'pending').length;
  const running = jobs.filter(j => j.status === 'running').length;
  const completed = jobs.filter(j => j.status === 'completed').length;
  const failed = jobs.filter(j => j.status === 'failed').length;
  
  console.log('\nSummary (last 20):');
  console.log(`  Pending: ${pending} | Running: ${running} | Completed: ${completed} | Failed: ${failed}`);
}

// ============================================
// Main
// ============================================

async function main(): Promise<void> {
  const { command, config } = parseArgs();
  
  const validJobTypes: JobType[] = ['daily_update', 'full_seed', 'sync', 'enrich', 'aggregate'];
  
  if (command === 'help' || command === '--help' || command === '-h') {
    printUsage();
    return;
  }
  
  if (command === 'status') {
    await showStatus();
    return;
  }
  
  if (!validJobTypes.includes(command as JobType)) {
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
  }
  
  await enqueueJob(command as JobType, config);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});

