-- Migration: Job Cancellation Support
-- 
-- Adds 'cancelled' status to jobs and functions for cancellation.
-- Allows graceful stopping of running jobs.

-- Drop the existing status check constraint and recreate with 'cancelled'
ALTER TABLE public.jobs 
DROP CONSTRAINT IF EXISTS jobs_status_check;

ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_status_check 
CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'));

-- Function to cancel a job
-- Can cancel pending jobs immediately, or signal running jobs to stop
CREATE OR REPLACE FUNCTION public.cancel_job(
  p_job_id INTEGER
)
RETURNS public.jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job public.jobs;
  v_current_status TEXT;
BEGIN
  -- Get current status
  SELECT status INTO v_current_status
  FROM public.jobs
  WHERE id = p_job_id;
  
  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Job % not found', p_job_id;
  END IF;
  
  -- Can only cancel pending or running jobs
  IF v_current_status NOT IN ('pending', 'running') THEN
    RAISE EXCEPTION 'Cannot cancel job with status %', v_current_status;
  END IF;
  
  -- Update the job status
  UPDATE public.jobs
  SET 
    status = 'cancelled',
    completed_at = NOW(),
    error = CASE 
      WHEN v_current_status = 'pending' THEN 'Cancelled before starting'
      ELSE 'Cancellation requested - worker will stop at next checkpoint'
    END,
    updated_at = NOW()
  WHERE id = p_job_id
  RETURNING * INTO v_job;
  
  RETURN v_job;
END;
$$;

-- Function to check if a job should be cancelled
-- Workers should call this periodically during long operations
CREATE OR REPLACE FUNCTION public.should_cancel_job(
  p_job_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status TEXT;
BEGIN
  SELECT status INTO v_status
  FROM public.jobs
  WHERE id = p_job_id;
  
  -- Return true if job is marked as cancelled
  RETURN v_status = 'cancelled';
END;
$$;

-- Update cleanup function to include cancelled jobs
CREATE OR REPLACE FUNCTION public.cleanup_old_jobs(
  p_days_to_keep INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM public.jobs
  WHERE status IN ('completed', 'failed', 'cancelled')
    AND completed_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Add index for cancelled jobs cleanup
CREATE INDEX IF NOT EXISTS idx_jobs_cancelled_at 
ON public.jobs (completed_at) 
WHERE status = 'cancelled';

COMMENT ON FUNCTION public.cancel_job IS 'Cancel a pending or running job. Running jobs will stop at their next checkpoint.';
COMMENT ON FUNCTION public.should_cancel_job IS 'Check if a job has been cancelled. Workers should call this periodically.';

