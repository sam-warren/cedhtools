-- Update RPC function for seat position stats to support date filtering
-- Now queries from seat_position_weekly_stats table instead of raw game_players

-- Drop the old function with single parameter signature
DROP FUNCTION IF EXISTS get_commander_seat_stats(INTEGER);

CREATE OR REPLACE FUNCTION get_commander_seat_stats(
  commander_id_param INTEGER,
  date_filter DATE DEFAULT NULL
)
RETURNS TABLE (
  seat_position INTEGER,
  games BIGINT,
  wins BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    spws.seat_position,
    SUM(spws.games)::BIGINT as games,
    SUM(spws.wins)::BIGINT as wins
  FROM seat_position_weekly_stats spws
  WHERE spws.commander_id = commander_id_param
    AND (date_filter IS NULL OR spws.week_start >= date_filter)
  GROUP BY spws.seat_position
  ORDER BY spws.seat_position;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_commander_seat_stats(INTEGER, DATE) IS 'Aggregates seat position win rates for a commander with optional date filtering';

