-- Enable the Realtime extension
BEGIN;

-- Enable row level security on deck_analyses
ALTER TABLE deck_analyses ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow users to see only their own deck analyses
CREATE POLICY "Users can see their own deck analyses" ON deck_analyses
  FOR SELECT
  USING (user_id = auth.uid());

-- Enable replication on the deck_analyses table for realtime functionality
ALTER PUBLICATION supabase_realtime ADD TABLE deck_analyses;

COMMIT; 