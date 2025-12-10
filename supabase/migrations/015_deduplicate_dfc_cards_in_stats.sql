-- Migration: Deduplicate double-faced cards in card stats
--
-- Some cards exist in the database both as "Front Face" and "Front Face // Back Face"
-- due to inconsistent naming in source decklists. This migration updates the RPC
-- function to deduplicate by front face name, aggregating stats from both variants.

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
  -- First, get all card stats with front face extracted
  card_stats_raw AS (
    SELECT
      c.id AS card_id,
      c.name AS card_name,
      -- Extract front face for deduplication
      SPLIT_PART(c.name, ' // ', 1) AS front_face,
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
  ),
  -- Aggregate stats by front face (combines both "Front" and "Front // Back" variants)
  card_stats_by_front_face AS (
    SELECT
      raw.front_face AS ff,
      SUM(raw.entries)::BIGINT AS total_entries,
      SUM(raw.top_cuts)::BIGINT AS total_top_cuts,
      SUM(raw.expected_top_cuts)::DOUBLE PRECISION AS total_expected_top_cuts,
      SUM(raw.wins)::BIGINT AS total_wins,
      SUM(raw.draws)::BIGINT AS total_draws,
      SUM(raw.losses)::BIGINT AS total_losses
    FROM card_stats_raw raw
    GROUP BY raw.front_face
  ),
  -- Pick one representative card per front face (prefer more entries, then full DFC name)
  card_stats_ranked AS (
    SELECT
      csr.card_id,
      csr.card_name,
      csr.front_face,
      csr.oracle_id,
      csr.type_line,
      csr.mana_cost,
      csr.cmc,
      ROW_NUMBER() OVER (
        PARTITION BY csr.front_face
        ORDER BY csr.entries DESC, (csr.card_name LIKE '% // %') DESC, csr.card_id
      ) AS rn
    FROM card_stats_raw csr
  ),
  -- Join representative card info with aggregated stats
  card_stats AS (
    SELECT
      csr.card_id,
      csr.card_name,
      csr.oracle_id,
      csr.type_line,
      csr.mana_cost,
      csr.cmc,
      agg.total_entries AS entries,
      agg.total_top_cuts AS top_cuts,
      agg.total_expected_top_cuts AS expected_top_cuts,
      agg.total_wins AS wins,
      agg.total_draws AS draws,
      agg.total_losses AS losses
    FROM card_stats_ranked csr
    INNER JOIN card_stats_by_front_face agg ON agg.ff = csr.front_face
    WHERE csr.rn = 1
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

COMMENT ON FUNCTION get_commander_card_stats IS 'Efficiently aggregates card stats for a commander with optional date filter. Deduplicates DFC variants by front face name.';

