-- Add decklist validation column to entries table
-- NULL = not validated (no decklist available)
-- TRUE = validated successfully for commander format
-- FALSE = validation failed (illegal cards, etc.)

ALTER TABLE entries ADD COLUMN IF NOT EXISTS decklist_valid BOOLEAN DEFAULT NULL;

-- Index for filtering by validation status
CREATE INDEX IF NOT EXISTS idx_entries_decklist_valid ON entries(decklist_valid);

