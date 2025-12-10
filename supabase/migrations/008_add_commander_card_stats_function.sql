-- RPC function for efficient commander card stats aggregation
-- This runs the aggregation in the database instead of fetching all rows and aggregating in JS

CREATE OR REPLACE FUNCTION get_commander_card_stats(
  commander_id_param INTEGER,
  date_filter DATE DEFAULT NULL
) RETURNS TABLE (
  card_id INTEGER,
  card_name TEXT,
  oracle_id TEXT,
  type_line TEXT,
  mana_cost TEXT,
  cmc NUMERIC,
  entries BIGINT,
  top_cuts BIGINT,
  expected_top_cuts DOUBLE PRECISION,
  wins BIGINT,
  draws BIGINT,
  losses BIGINT,
  commander_entries BIGINT,
  commander_entries_with_decklists BIGINT,
  commander_top_cuts BIGINT,
  commander_expected_top_cuts DOUBLE PRECISION,
  commander_wins BIGINT,
  commander_draws BIGINT,
  commander_losses BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH commander_totals AS (
    SELECT
      COALESCE(SUM(cws.entries), 0)::BIGINT AS total_entries,
      COALESCE(SUM(cws.entries_with_decklists), 0)::BIGINT AS total_entries_with_decklists,
      COALESCE(SUM(cws.top_cuts), 0)::BIGINT AS total_top_cuts,
      COALESCE(SUM(cws.expected_top_cuts), 0)::DOUBLE PRECISION AS total_expected_top_cuts,
      COALESCE(SUM(cws.wins), 0)::BIGINT AS total_wins,
      COALESCE(SUM(cws.draws), 0)::BIGINT AS total_draws,
      COALESCE(SUM(cws.losses), 0)::BIGINT AS total_losses
    FROM commander_weekly_stats cws
    WHERE cws.commander_id = commander_id_param
      AND (date_filter IS NULL OR cws.week_start >= date_filter)
  ),
  card_stats AS (
    SELECT
      c.id AS card_id,
      c.name AS card_name,
      c.oracle_id,
      c.type_line,
      c.mana_cost,
      c.cmc,
      COALESCE(SUM(ccws.entries), 0)::BIGINT AS entries,
      COALESCE(SUM(ccws.top_cuts), 0)::BIGINT AS top_cuts,
      COALESCE(SUM(ccws.expected_top_cuts), 0)::DOUBLE PRECISION AS expected_top_cuts,
      COALESCE(SUM(ccws.wins), 0)::BIGINT AS wins,
      COALESCE(SUM(ccws.draws), 0)::BIGINT AS draws,
      COALESCE(SUM(ccws.losses), 0)::BIGINT AS losses
    FROM card_commander_weekly_stats ccws
    INNER JOIN cards c ON c.id = ccws.card_id
    WHERE ccws.commander_id = commander_id_param
      AND (date_filter IS NULL OR ccws.week_start >= date_filter)
    GROUP BY c.id, c.name, c.oracle_id, c.type_line, c.mana_cost, c.cmc
  )
  SELECT
    cs.card_id,
    cs.card_name,
    cs.oracle_id,
    cs.type_line,
    cs.mana_cost,
    cs.cmc,
    cs.entries,
    cs.top_cuts,
    cs.expected_top_cuts,
    cs.wins,
    cs.draws,
    cs.losses,
    ct.total_entries AS commander_entries,
    ct.total_entries_with_decklists AS commander_entries_with_decklists,
    ct.total_top_cuts AS commander_top_cuts,
    ct.total_expected_top_cuts AS commander_expected_top_cuts,
    ct.total_wins AS commander_wins,
    ct.total_draws AS commander_draws,
    ct.total_losses AS commander_losses
  FROM card_stats cs
  CROSS JOIN commander_totals ct;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add composite indexes to speed up the aggregation queries
CREATE INDEX IF NOT EXISTS idx_card_commander_weekly_stats_commander_week 
  ON card_commander_weekly_stats(commander_id, week_start);

CREATE INDEX IF NOT EXISTS idx_card_commander_weekly_stats_card_commander 
  ON card_commander_weekly_stats(card_id, commander_id);

COMMENT ON FUNCTION get_commander_card_stats IS 'Efficiently aggregates card stats for a commander with optional date filter';






