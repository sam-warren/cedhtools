-- Migration: Add retry_count to jobs table
-- 
-- Adds a retry_count column to track how many times a job has been
-- retried after crashes. This allows the worker to re-queue crashed
-- jobs up to a maximum number of retries before marking them as failed.

-- Add retry_count column with default of 0
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;

-- Comment
COMMENT ON COLUMN public.jobs.retry_count IS 'Number of times this job has been retried after crashes';

