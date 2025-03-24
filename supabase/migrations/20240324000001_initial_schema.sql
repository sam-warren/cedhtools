-- Create commanders table
CREATE TABLE IF NOT EXISTS commanders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    entries INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
    unique_card_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    scryfall_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create statistics table
CREATE TABLE IF NOT EXISTS statistics (
    id SERIAL PRIMARY KEY,
    commander_id TEXT NOT NULL REFERENCES commanders(id),
    card_id TEXT NOT NULL REFERENCES cards(unique_card_id),
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    entries INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(commander_id, card_id)
);

-- Create users table with subscription info
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL,
    subscription_tier TEXT DEFAULT 'FREE',
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    analyses_used INTEGER DEFAULT 0,
    analyses_limit INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deck_analyses table to track user analyses
CREATE TABLE IF NOT EXISTS deck_analyses (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    moxfield_url TEXT NOT NULL,
    commander_id TEXT NOT NULL REFERENCES commanders(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create etl_status table to track ETL runs
CREATE TABLE IF NOT EXISTS etl_status (
    id SERIAL PRIMARY KEY,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT,
    records_processed INTEGER DEFAULT 0,
    last_processed_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_statistics_commander_id ON statistics(commander_id);
CREATE INDEX idx_statistics_card_id ON statistics(card_id);
CREATE INDEX idx_deck_analyses_user_id ON deck_analyses(user_id);
CREATE INDEX idx_deck_analyses_commander_id ON deck_analyses(commander_id); 