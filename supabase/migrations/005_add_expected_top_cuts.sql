-- Add expected_top_cuts column to commander_weekly_stats
-- This column stores the sum of (topCut / tournamentSize) for each entry
-- Used to calculate conversion score = (top_cuts / expected_top_cuts) * 100
ALTER TABLE commander_weekly_stats 
ADD COLUMN IF NOT EXISTS expected_top_cuts REAL DEFAULT 0;

COMMENT ON COLUMN commander_weekly_stats.expected_top_cuts IS 'Sum of (topCut/tournamentSize) for each entry - used for conversion score calculation';

-- Add expected_top_cuts column to card_commander_weekly_stats
ALTER TABLE card_commander_weekly_stats 
ADD COLUMN IF NOT EXISTS expected_top_cuts REAL DEFAULT 0;

COMMENT ON COLUMN card_commander_weekly_stats.expected_top_cuts IS 'Sum of (topCut/tournamentSize) for each entry - used for conversion score calculation';
