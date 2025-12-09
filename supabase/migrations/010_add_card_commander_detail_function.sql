-- RPC function for efficient card/commander detail stats aggregation
-- Returns weekly card stats with commander baseline for comparison
-- Includes weekly commander entries for play rate calculation

DROP FUNCTION IF EXISTS get_card_commander_detail_stats(INTEGER, INTEGER, DATE);

CREATE OR REPLACE FUNCTION get_card_commander_detail_stats(
  card_id_param INTEGER,
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
  week_commander_entries BIGINT,
  week_commander_entries_with_decklists BIGINT,
  commander_total_entries BIGINT,
  commander_total_entries_with_decklists BIGINT,
  commander_total_wins BIGINT,
  commander_total_draws BIGINT,
  commander_total_losses BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH card_weekly AS (
    SELECT
      ccws.week_start,
      ccws.entries,
      ccws.top_cuts,
      ccws.expected_top_cuts,
      ccws.wins,
      ccws.draws,
      ccws.losses
    FROM card_commander_weekly_stats ccws
    WHERE ccws.card_id = card_id_param
      AND ccws.commander_id = commander_id_param
      AND (date_filter IS NULL OR ccws.week_start >= date_filter)
  ),
  commander_weekly AS (
    SELECT
      cws.week_start,
      cws.entries AS week_entries,
      COALESCE(cws.entries_with_decklists, cws.entries) AS week_entries_with_decklists
    FROM commander_weekly_stats cws
    WHERE cws.commander_id = commander_id_param
      AND (date_filter IS NULL OR cws.week_start >= date_filter)
  ),
  commander_totals AS (
    SELECT
      COALESCE(SUM(cws.entries), 0)::BIGINT AS total_entries,
      COALESCE(SUM(COALESCE(cws.entries_with_decklists, cws.entries)), 0)::BIGINT AS total_entries_with_decklists,
      COALESCE(SUM(cws.wins), 0)::BIGINT AS total_wins,
      COALESCE(SUM(cws.draws), 0)::BIGINT AS total_draws,
      COALESCE(SUM(cws.losses), 0)::BIGINT AS total_losses
    FROM commander_weekly_stats cws
    WHERE cws.commander_id = commander_id_param
      AND (date_filter IS NULL OR cws.week_start >= date_filter)
  )
  SELECT
    cw.week_start,
    cw.entries::BIGINT,
    cw.top_cuts::BIGINT,
    cw.expected_top_cuts::DOUBLE PRECISION,
    cw.wins::BIGINT,
    cw.draws::BIGINT,
    cw.losses::BIGINT,
    COALESCE(cmw.week_entries, 0)::BIGINT AS week_commander_entries,
    COALESCE(cmw.week_entries_with_decklists, 0)::BIGINT AS week_commander_entries_with_decklists,
    ct.total_entries AS commander_total_entries,
    ct.total_entries_with_decklists AS commander_total_entries_with_decklists,
    ct.total_wins AS commander_total_wins,
    ct.total_draws AS commander_total_draws,
    ct.total_losses AS commander_total_losses
  FROM card_weekly cw
  LEFT JOIN commander_weekly cmw ON cmw.week_start = cw.week_start
  CROSS JOIN commander_totals ct
  ORDER BY cw.week_start;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_card_commander_detail_stats IS 'Efficiently aggregates weekly card stats for a specific commander with weekly and total commander baseline data';
