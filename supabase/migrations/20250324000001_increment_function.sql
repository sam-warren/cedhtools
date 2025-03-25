-- Create function to increment values in a single query
CREATE OR REPLACE FUNCTION increment(row_wins int DEFAULT 0, row_losses int DEFAULT 0, row_draws int DEFAULT 0, row_entries int DEFAULT 0)
RETURNS TABLE (
  wins int,
  losses int,
  draws int,
  entries int
) AS $$
BEGIN
  RETURN QUERY SELECT
    COALESCE(commanders.wins, 0) + row_wins,
    COALESCE(commanders.losses, 0) + row_losses,
    COALESCE(commanders.draws, 0) + row_draws,
    COALESCE(commanders.entries, 0) + row_entries
  FROM commanders;
END;
$$ LANGUAGE plpgsql; 