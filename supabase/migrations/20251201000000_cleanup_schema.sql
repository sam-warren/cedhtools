-- Migration: Schema Cleanup
-- Removes deprecated tables and columns as part of the app refresh
-- 
-- Changes:
-- 1. Drop deck_analyses table (no longer storing user analysis history)
-- 2. Drop scryfall_id column from cards (redundant with unique_card_id)
-- 3. Drop etl_status table (replaced by etl_jobs)

BEGIN;

-- ============================================================================
-- 1. DROP DECK_ANALYSES TABLE
-- ============================================================================

-- First drop policies
DROP POLICY IF EXISTS "Users can see their own deck analyses" ON deck_analyses;
DROP POLICY IF EXISTS "Users can insert their own deck analyses" ON deck_analyses;
DROP POLICY IF EXISTS "Users can delete their own deck analyses" ON deck_analyses;
DROP POLICY IF EXISTS "Service role can do all operations" ON deck_analyses;

-- Remove from realtime publication (if it exists)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE deck_analyses;
EXCEPTION
    WHEN undefined_object THEN
        -- Table not in publication, ignore
        NULL;
END $$;

-- Drop indexes
DROP INDEX IF EXISTS idx_deck_analyses_user_id;
DROP INDEX IF EXISTS idx_deck_analyses_commander_id;

-- Drop the table
DROP TABLE IF EXISTS deck_analyses;

-- ============================================================================
-- 2. DROP SCRYFALL_ID COLUMN FROM CARDS
-- ============================================================================

-- The unique_card_id column already stores the Scryfall UUID
-- scryfall_id is redundant
ALTER TABLE cards DROP COLUMN IF EXISTS scryfall_id;

-- ============================================================================
-- 3. DROP ETL_STATUS TABLE
-- ============================================================================

-- etl_jobs provides a more robust job queue system
-- etl_status was the legacy simple tracking table

-- Drop policies first
DROP POLICY IF EXISTS "Public can view etl_status" ON etl_status;
DROP POLICY IF EXISTS "Service role can manage etl_status" ON etl_status;

-- Drop the table
DROP TABLE IF EXISTS etl_status;

COMMIT;

