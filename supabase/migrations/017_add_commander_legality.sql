-- Add is_legal column to commanders table
-- This marks whether a commander pairing is legal under MTG rules
-- Illegal pairings (like two non-partner commanders) came from special events
-- with custom rules (e.g., Pride Month events allowing any two commanders)

-- Add the column with default NULL (will be populated during enrichment)
ALTER TABLE commanders ADD COLUMN IF NOT EXISTS is_legal BOOLEAN;

-- Create index for filtering by legality
CREATE INDEX IF NOT EXISTS idx_commanders_is_legal ON commanders(is_legal);

-- Update the get_commander_list_stats function to filter by is_legal
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
      AND (c.is_legal IS NULL OR c.is_legal = TRUE)  -- Filter out illegal commanders
    GROUP BY c.id, c.name, c.color_id
  ),
  total_entries AS (
    SELECT COALESCE(SUM(cws.entries), 0)::BIGINT AS total
    FROM commander_weekly_stats cws
    INNER JOIN commanders c ON c.id = cws.commander_id
    WHERE (date_filter IS NULL OR cws.week_start >= date_filter)
      AND (c.is_legal IS NULL OR c.is_legal = TRUE)  -- Also filter total
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

COMMENT ON FUNCTION get_commander_list_stats IS 'Efficiently aggregates commander stats for the list view with optional date and search filters. Excludes illegal commander pairings.';

