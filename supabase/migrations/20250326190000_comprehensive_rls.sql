-- Comprehensive RLS Security Migration
-- This migration enables Row Level Security on all tables and defines appropriate policies

BEGIN;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can see their own deck analyses" ON deck_analyses;
DROP POLICY IF EXISTS "Users can insert their own deck analyses" ON deck_analyses;
DROP POLICY IF EXISTS "Service role can do all operations" ON deck_analyses;
-- Add other policies to drop as needed

--------------------------------------------------------------------------------
-- 1. Enable RLS on all tables
--------------------------------------------------------------------------------

-- Data tables
ALTER TABLE commanders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_analyses ENABLE ROW LEVEL SECURITY;

-- ETL tables
ALTER TABLE etl_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_tournaments ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- 2. Public Read-Only Tables
--------------------------------------------------------------------------------

-- Cards data (publicly readable)
CREATE POLICY "Cards are publicly readable" ON cards
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Commanders data (publicly readable)
CREATE POLICY "Commanders are publicly readable" ON commanders
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Statistics data (publicly readable)
CREATE POLICY "Statistics are publicly readable" ON statistics
  FOR SELECT
  TO authenticated, anon
  USING (true);

--------------------------------------------------------------------------------
-- 3. User Data Policies
--------------------------------------------------------------------------------

-- Users can read and modify their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins might need to see all users (optional, uncomment if needed)
-- CREATE POLICY "Service role can view all users" ON users
--   FOR SELECT
--   TO service_role
--   USING (true);

--------------------------------------------------------------------------------
-- 4. Deck Analyses Policies
--------------------------------------------------------------------------------

-- Users can see only their own deck analyses
CREATE POLICY "Users can see their own deck analyses" ON deck_analyses
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own deck analyses
CREATE POLICY "Users can insert their own deck analyses" ON deck_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own deck analyses (optional)
CREATE POLICY "Users can delete their own deck analyses" ON deck_analyses
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

--------------------------------------------------------------------------------
-- 5. ETL Job Policies (Service Role Only)
--------------------------------------------------------------------------------

-- ETL jobs should only be accessible to the service role
CREATE POLICY "Service role can manage ETL jobs" ON etl_jobs
  FOR ALL
  TO service_role
  USING (true);

-- ETL status should only be accessible to the service role 
CREATE POLICY "Service role can manage ETL status" ON etl_status
  FOR ALL
  TO service_role
  USING (true);

-- Processed tournaments should only be manageable by the service role
CREATE POLICY "Service role can manage processed tournaments" ON processed_tournaments
  FOR ALL
  TO service_role
  USING (true);

-- Public can read ETL status (optional, for monitoring)
CREATE POLICY "Public can read ETL status" ON etl_status
  FOR SELECT
  TO authenticated, anon
  USING (true);

--------------------------------------------------------------------------------
-- 6. Handle edge cases and special permissions
--------------------------------------------------------------------------------

-- Allow service role to bypass RLS for all tables
-- Note: This is implicit, as service role already bypasses RLS by default

-- If you need special handling for specific roles or use cases, add those policies here

COMMIT; 