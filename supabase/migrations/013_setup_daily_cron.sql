-- Migration: Setup pg_cron for daily job scheduling
-- 
-- This migration sets up pg_cron to enqueue daily update jobs.
-- A separate worker process will pick up and execute these jobs.
--
-- This migration is IDEMPOTENT - safe to re-run.

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Grant usage on cron schema
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Remove existing jobs first (makes this idempotent)
-- cron.unschedule() returns false if job doesn't exist, so this is safe
SELECT cron.unschedule('nightly-data-update');
SELECT cron.unschedule('reset-stuck-jobs');
SELECT cron.unschedule('cleanup-old-jobs');

-- Create the cron job for nightly updates
-- This simply inserts a job into the queue - the worker handles execution
SELECT cron.schedule(
  'nightly-data-update',     -- Job name
  '0 4 * * *',               -- Schedule: 4:00 AM UTC daily
  $$SELECT public.enqueue_job('daily_update', '{}', 5)$$
);

-- Create a cron job to reset stuck jobs (every 6 hours)
-- Timeout is 6 hours (360 minutes) to allow for long-running seed jobs
SELECT cron.schedule(
  'reset-stuck-jobs',
  '0 */6 * * *',             -- Every 6 hours
  $$SELECT public.reset_stuck_jobs(360)$$  -- Jobs stuck for 6+ hours
);

-- Create a cron job to clean up old jobs (weekly)
SELECT cron.schedule(
  'cleanup-old-jobs',
  '0 3 * * 0',               -- Sunday at 3:00 AM UTC
  $$SELECT public.cleanup_old_jobs(30)$$   -- Keep 30 days
);

-- Instructions for manual job creation:
-- 
-- Enqueue a daily update job:
-- SELECT public.enqueue_job('daily_update', '{}', 5);
--
-- Enqueue a full seed job:
-- SELECT public.enqueue_job('full_seed', '{"start_date": "2025-05-19"}', 1);
--
-- Enqueue individual pipeline steps:
-- SELECT public.enqueue_job('sync', '{"days_back": 7}', 5);
-- SELECT public.enqueue_job('enrich', '{"incremental": true}', 5);
-- SELECT public.enqueue_job('aggregate', '{}', 5);
--
-- Check job status:
-- SELECT * FROM public.jobs ORDER BY created_at DESC LIMIT 20;
--
-- Check cron job history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

