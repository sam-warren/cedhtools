-- RPC function for efficient commander detail stats aggregation
-- Returns weekly breakdown with total meta entries per week for meta share calculation

CREATE OR REPLACE FUNCTION get_commander_detail_stats(
  commander_id_param INTEGER,
  date_filter DATE DEFAULT NULL
) RETURNS TABLE (
  week_start DATE,
  entries BIGINT,
  top_cuts BIGINT,
  expected_top_cuts DOUBLE PRECISION,
  wins BIGINT,
  draws BIGINT,
  losses BIGINT,
  week_total_entries BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH commander_weekly AS (
    SELECT
      cws.week_start,
      cws.entries,
      cws.top_cuts,
      cws.expected_top_cuts,
      cws.wins,
      cws.draws,
      cws.losses
    FROM commander_weekly_stats cws
    WHERE cws.commander_id = commander_id_param
      AND (date_filter IS NULL OR cws.week_start >= date_filter)
  ),
  weekly_totals AS (
    SELECT
      cws.week_start,
      SUM(cws.entries)::BIGINT AS total_entries
    FROM commander_weekly_stats cws
    WHERE (date_filter IS NULL OR cws.week_start >= date_filter)
    GROUP BY cws.week_start
  )
  SELECT
    cw.week_start,
    cw.entries::BIGINT,
    cw.top_cuts::BIGINT,
    cw.expected_top_cuts::DOUBLE PRECISION,
    cw.wins::BIGINT,
    cw.draws::BIGINT,
    cw.losses::BIGINT,
    COALESCE(wt.total_entries, 0)::BIGINT AS week_total_entries
  FROM commander_weekly cw
  LEFT JOIN weekly_totals wt ON wt.week_start = cw.week_start
  ORDER BY cw.week_start;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_commander_detail_stats IS 'Efficiently aggregates weekly commander stats with meta share data';


