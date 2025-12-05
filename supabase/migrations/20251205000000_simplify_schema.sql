-- Migration: Simplify Schema for MVP
-- 
-- Changes:
-- 1. Drop type and type_line columns from cards table
-- 2. Add seat position tracking columns to commanders table

BEGIN;

-- ============================================================================
-- 1. DROP TYPE COLUMNS FROM CARDS TABLE
-- ============================================================================

-- Remove the type column (numeric card type)
ALTER TABLE cards DROP COLUMN IF EXISTS type;

-- Remove the type_line column (full type line text)
ALTER TABLE cards DROP COLUMN IF EXISTS type_line;

-- ============================================================================
-- 2. ADD SEAT POSITION COLUMNS TO COMMANDERS TABLE
-- ============================================================================

-- Add seat position win/entry tracking for seats 1-4
-- In cEDH, seat position can significantly impact win rates
ALTER TABLE commanders 
ADD COLUMN IF NOT EXISTS seat1_wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS seat1_entries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS seat2_wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS seat2_entries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS seat3_wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS seat3_entries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS seat4_wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS seat4_entries INTEGER DEFAULT 0;

-- Add comments to explain the columns
COMMENT ON COLUMN commanders.seat1_wins IS 'Number of wins when seated in position 1 (first to act)';
COMMENT ON COLUMN commanders.seat1_entries IS 'Number of games played from seat position 1';
COMMENT ON COLUMN commanders.seat2_wins IS 'Number of wins when seated in position 2';
COMMENT ON COLUMN commanders.seat2_entries IS 'Number of games played from seat position 2';
COMMENT ON COLUMN commanders.seat3_wins IS 'Number of wins when seated in position 3';
COMMENT ON COLUMN commanders.seat3_entries IS 'Number of games played from seat position 3';
COMMENT ON COLUMN commanders.seat4_wins IS 'Number of wins when seated in position 4 (last to act)';
COMMENT ON COLUMN commanders.seat4_entries IS 'Number of games played from seat position 4';

COMMIT;

