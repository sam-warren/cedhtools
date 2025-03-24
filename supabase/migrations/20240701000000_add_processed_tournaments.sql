-- Create processed_tournaments table to track which tournaments have been processed
CREATE TABLE IF NOT EXISTS processed_tournaments (
    tournament_id TEXT PRIMARY KEY,
    tournament_date TIMESTAMP WITH TIME ZONE NOT NULL,
    name TEXT NOT NULL,
    record_count INTEGER DEFAULT 0,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add an index for date queries
CREATE INDEX idx_processed_tournaments_date ON processed_tournaments(tournament_date);

-- Update the clear_etl_data function to include this table
CREATE OR REPLACE FUNCTION clear_etl_data()
RETURNS void AS $$
BEGIN
    -- Clear data from all ETL-related tables
    DELETE FROM statistics;
    DELETE FROM commanders;
    DELETE FROM cards;
    DELETE FROM etl_status;
    DELETE FROM processed_tournaments;
END;
$$ LANGUAGE plpgsql; 