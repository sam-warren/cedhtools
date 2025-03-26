-- Add INSERT policy for deck_analyses table
BEGIN;

-- Create a policy to allow users to insert their own deck analyses
CREATE POLICY "Users can insert their own deck analyses" ON deck_analyses
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Create policies for server-side operations (used by our API routes)
CREATE POLICY "Service role can do all operations" ON deck_analyses
  FOR ALL
  TO service_role
  USING (true);

COMMIT; 