-- RPC function for efficient commander list stats aggregation
-- This runs the aggregation in the database instead of fetching all rows and aggregating in JS

CREATE OR REPLACE FUNCTION get_commander_list_stats(
  date_filter DATE DEFAULT NULL,
  search_pattern TEXT DEFAULT NULL
) RETURNS TABLE (
  commander_id INTEGER,
  name TEXT,
  color_id TEXT,
  entries BIGINT,
  top_cuts BIGINT,
  expected_top_cuts DOUBLE PRECISION,
  wins BIGINT,
  draws BIGINT,
  losses BIGINT,
  total_meta_entries BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH commander_stats AS (
    SELECT
      c.id AS commander_id,
      c.name,
      c.color_id,
      COALESCE(SUM(cws.entries), 0)::BIGINT AS entries,
      COALESCE(SUM(cws.top_cuts), 0)::BIGINT AS top_cuts,
      COALESCE(SUM(cws.expected_top_cuts), 0)::DOUBLE PRECISION AS expected_top_cuts,
      COALESCE(SUM(cws.wins), 0)::BIGINT AS wins,
      COALESCE(SUM(cws.draws), 0)::BIGINT AS draws,
      COALESCE(SUM(cws.losses), 0)::BIGINT AS losses
    FROM commanders c
    INNER JOIN commander_weekly_stats cws ON cws.commander_id = c.id
    WHERE (date_filter IS NULL OR cws.week_start >= date_filter)
      AND (search_pattern IS NULL OR c.name ILIKE '%' || search_pattern || '%')
    GROUP BY c.id, c.name, c.color_id
  ),
  total_entries AS (
    SELECT COALESCE(SUM(cws.entries), 0)::BIGINT AS total
    FROM commander_weekly_stats cws
    WHERE (date_filter IS NULL OR cws.week_start >= date_filter)
  )
  SELECT
    cs.commander_id,
    cs.name,
    cs.color_id,
    cs.entries,
    cs.top_cuts,
    cs.expected_top_cuts,
    cs.wins,
    cs.draws,
    cs.losses,
    te.total AS total_meta_entries
  FROM commander_stats cs
  CROSS JOIN total_entries te;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add composite index to speed up the aggregation query
CREATE INDEX IF NOT EXISTS idx_commander_weekly_stats_commander_week 
  ON commander_weekly_stats(commander_id, week_start);

COMMENT ON FUNCTION get_commander_list_stats IS 'Efficiently aggregates commander stats for the list view with optional date and search filters';

