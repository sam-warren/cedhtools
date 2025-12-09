-- Add RPC function for efficient seat position stats aggregation
-- This runs the aggregation in the database instead of fetching all rows

CREATE OR REPLACE FUNCTION get_commander_seat_stats(commander_id_param INTEGER)
RETURNS TABLE (
  seat_position INTEGER,
  games BIGINT,
  wins BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gp.seat_position,
    COUNT(*)::BIGINT as games,
    COUNT(*) FILTER (
      WHERE g.is_draw = false 
      AND g.winner_player_id = gp.player_id
    )::BIGINT as wins
  FROM game_players gp
  INNER JOIN games g ON g.id = gp.game_id
  INNER JOIN entries e ON e.id = gp.entry_id
  WHERE e.commander_id = commander_id_param
  GROUP BY gp.seat_position
  ORDER BY gp.seat_position;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add index to speed up the join on entry_id
CREATE INDEX IF NOT EXISTS idx_game_players_entry_id ON game_players(entry_id);

-- Add index for commander_id lookups on entries
CREATE INDEX IF NOT EXISTS idx_entries_commander_id ON entries(commander_id);

COMMENT ON FUNCTION get_commander_seat_stats IS 'Efficiently aggregates seat position win rates for a commander';


