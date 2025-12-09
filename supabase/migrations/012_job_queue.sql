-- Migration: Job Queue System
-- 
-- Creates a simple job queue table for background processing.
-- A worker process polls this table and executes jobs.

-- Job queue table
CREATE TABLE IF NOT EXISTS public.jobs (
  id SERIAL PRIMARY KEY,
  
  -- Job type: 'daily_update', 'full_seed', 'sync', 'enrich', 'aggregate'
  job_type TEXT NOT NULL,
  
  -- Job status
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  
  -- Priority (lower = higher priority)
  priority INTEGER NOT NULL DEFAULT 10,
  
  -- Job configuration (JSON)
  config JSONB DEFAULT '{}',
  
  -- Execution details
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Results
  result JSONB,
  error TEXT,
  
  -- Worker that claimed this job
  worker_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding pending jobs efficiently
CREATE INDEX IF NOT EXISTS idx_jobs_status_priority 
ON public.jobs (status, priority, created_at) 
WHERE status = 'pending';

-- Index for finding jobs by type
CREATE INDEX IF NOT EXISTS idx_jobs_type_status 
ON public.jobs (job_type, status);

-- Index for cleanup of old completed jobs
CREATE INDEX IF NOT EXISTS idx_jobs_completed_at 
ON public.jobs (completed_at) 
WHERE status IN ('completed', 'failed');

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Only service role can access jobs
CREATE POLICY "Service role only" ON public.jobs
  FOR ALL USING (auth.role() = 'service_role');

-- Function to claim a job (atomic operation)
CREATE OR REPLACE FUNCTION public.claim_job(
  p_job_types TEXT[],
  p_worker_id TEXT
)
RETURNS public.jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job public.jobs;
BEGIN
  -- Find and claim the highest priority pending job
  UPDATE public.jobs
  SET 
    status = 'running',
    started_at = NOW(),
    worker_id = p_worker_id,
    updated_at = NOW()
  WHERE id = (
    SELECT id FROM public.jobs
    WHERE status = 'pending'
      AND job_type = ANY(p_job_types)
    ORDER BY priority ASC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING * INTO v_job;
  
  RETURN v_job;
END;
$$;

-- Function to complete a job
CREATE OR REPLACE FUNCTION public.complete_job(
  p_job_id INTEGER,
  p_result JSONB DEFAULT NULL
)
RETURNS public.jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job public.jobs;
BEGIN
  UPDATE public.jobs
  SET 
    status = 'completed',
    completed_at = NOW(),
    result = p_result,
    updated_at = NOW()
  WHERE id = p_job_id
  RETURNING * INTO v_job;
  
  RETURN v_job;
END;
$$;

-- Function to fail a job
CREATE OR REPLACE FUNCTION public.fail_job(
  p_job_id INTEGER,
  p_error TEXT
)
RETURNS public.jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job public.jobs;
BEGIN
  UPDATE public.jobs
  SET 
    status = 'failed',
    completed_at = NOW(),
    error = p_error,
    updated_at = NOW()
  WHERE id = p_job_id
  RETURNING * INTO v_job;
  
  RETURN v_job;
END;
$$;

-- Function to enqueue a job
CREATE OR REPLACE FUNCTION public.enqueue_job(
  p_job_type TEXT,
  p_config JSONB DEFAULT '{}',
  p_priority INTEGER DEFAULT 10
)
RETURNS public.jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job public.jobs;
BEGIN
  INSERT INTO public.jobs (job_type, config, priority)
  VALUES (p_job_type, p_config, p_priority)
  RETURNING * INTO v_job;
  
  RETURN v_job;
END;
$$;

-- Function to reset stuck jobs (jobs running for too long)
CREATE OR REPLACE FUNCTION public.reset_stuck_jobs(
  p_timeout_minutes INTEGER DEFAULT 60
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.jobs
  SET 
    status = 'pending',
    started_at = NULL,
    worker_id = NULL,
    updated_at = NOW()
  WHERE status = 'running'
    AND started_at < NOW() - (p_timeout_minutes || ' minutes')::INTERVAL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Function to clean up old completed jobs
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
  WHERE status IN ('completed', 'failed')
    AND completed_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Comment
COMMENT ON TABLE public.jobs IS 'Job queue for background processing by worker instances';

