-- Add entries_with_decklists column to commander_weekly_stats
ALTER TABLE commander_weekly_stats 
ADD COLUMN IF NOT EXISTS entries_with_decklists INTEGER DEFAULT 0;

-- Update comment
COMMENT ON COLUMN commander_weekly_stats.entries_with_decklists IS 'Number of entries that have submitted decklists';
