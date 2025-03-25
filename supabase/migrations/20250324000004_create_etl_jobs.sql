-- Create the etl_jobs table for the asynchronous job queue system
CREATE TABLE etl_jobs (
  id SERIAL PRIMARY KEY,
  job_type TEXT NOT NULL CHECK (job_type IN ('SEED', 'DAILY_UPDATE', 'BATCH_PROCESS')),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  parameters JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  next_cursor TEXT,  -- To track progress for resumable jobs
  records_processed INTEGER DEFAULT 0,
  error TEXT,
  priority INTEGER DEFAULT 0,  -- Higher number = higher priority
  max_runtime_seconds INTEGER DEFAULT 600  -- Default max runtime (10 minutes)
);

-- Add indexes for common query patterns
CREATE INDEX etl_jobs_status_idx ON etl_jobs (status);
CREATE INDEX etl_jobs_job_type_idx ON etl_jobs (job_type);
CREATE INDEX etl_jobs_created_at_idx ON etl_jobs (created_at);

-- Create a view to show active jobs with runtime
CREATE VIEW etl_jobs_active AS
SELECT 
  id,
  job_type,
  status,
  parameters,
  created_at,
  started_at,
  CASE 
    WHEN status = 'RUNNING' AND started_at IS NOT NULL THEN 
      EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
    ELSE NULL 
  END AS runtime_seconds,
  max_runtime_seconds,
  records_processed
FROM 
  etl_jobs
WHERE 
  status IN ('PENDING', 'RUNNING');

-- Add function to reset stuck jobs
CREATE OR REPLACE FUNCTION reset_stuck_jobs() RETURNS INTEGER AS $$
DECLARE
  reset_count INTEGER := 0;
BEGIN
  -- Find and reset jobs that have been running too long
  UPDATE etl_jobs
  SET 
    status = 'PENDING',
    started_at = NULL,
    error = CONCAT(error, ' | Automatically reset due to exceeding max runtime.')
  WHERE
    status = 'RUNNING'
    AND started_at IS NOT NULL
    AND EXTRACT(EPOCH FROM (NOW() - started_at)) > max_runtime_seconds;
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RETURN reset_count;
END;
$$ LANGUAGE plpgsql; 