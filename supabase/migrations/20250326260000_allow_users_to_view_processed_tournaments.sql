-- Allow users to view processed tournaments
-- This allows users to see which tournaments have been processed by the ETL system

BEGIN;

-- Create policy for both authenticated and anonymous users to view processed tournaments
CREATE POLICY "Processed tournaments are publicly readable" ON processed_tournaments
  FOR SELECT
  TO authenticated, anon
  USING (true);

COMMIT; 