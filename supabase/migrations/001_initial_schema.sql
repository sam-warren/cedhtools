-- cEDH Tools Database Schema
-- Initial migration for tournament data pipeline

-- ============================================
-- CORE TABLES
-- ============================================

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id SERIAL PRIMARY KEY,
  tid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tournament_date TIMESTAMPTZ NOT NULL,
  size INTEGER NOT NULL,
  swiss_rounds INTEGER NOT NULL DEFAULT 0,
  top_cut INTEGER NOT NULL DEFAULT 0,
  bracket_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  topdeck_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Commanders table (names sorted alphabetically, joined with " / ")
CREATE TABLE IF NOT EXISTS commanders (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color_id TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  oracle_id TEXT,
  type_line TEXT,
  mana_cost TEXT,
  cmc NUMERIC(4,2),
  scryfall_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Entries table (one per player per tournament)
CREATE TABLE IF NOT EXISTS entries (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  commander_id INTEGER REFERENCES commanders(id) ON DELETE SET NULL,
  standing INTEGER,
  wins_swiss INTEGER NOT NULL DEFAULT 0,
  wins_bracket INTEGER NOT NULL DEFAULT 0,
  losses_swiss INTEGER NOT NULL DEFAULT 0,
  losses_bracket INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  decklist_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tournament_id, player_id)
);

-- Decklist items table
CREATE TABLE IF NOT EXISTS decklist_items (
  id SERIAL PRIMARY KEY,
  entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  UNIQUE(entry_id, card_id)
);

-- ============================================
-- GAME-LEVEL TABLES (Seat Position Tracking)
-- ============================================

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round TEXT NOT NULL,
  table_number INTEGER NOT NULL,
  winner_player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
  is_draw BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tournament_id, round, table_number)
);

-- Game players table (seat_position = array index + 1)
CREATE TABLE IF NOT EXISTS game_players (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  entry_id INTEGER REFERENCES entries(id) ON DELETE SET NULL,
  seat_position INTEGER NOT NULL CHECK (seat_position BETWEEN 1 AND 4),
  UNIQUE(game_id, player_id),
  UNIQUE(game_id, seat_position)
);

-- ============================================
-- WEEKLY STATS TABLES (Temporal Data)
-- ============================================

-- Commander weekly stats
CREATE TABLE IF NOT EXISTS commander_weekly_stats (
  id SERIAL PRIMARY KEY,
  commander_id INTEGER NOT NULL REFERENCES commanders(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  entries INTEGER NOT NULL DEFAULT 0,
  top_cuts INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(commander_id, week_start)
);

-- Card-commander weekly stats
CREATE TABLE IF NOT EXISTS card_commander_weekly_stats (
  id SERIAL PRIMARY KEY,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  commander_id INTEGER NOT NULL REFERENCES commanders(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  entries INTEGER NOT NULL DEFAULT 0,
  top_cuts INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(card_id, commander_id, week_start)
);

-- Seat position weekly stats
CREATE TABLE IF NOT EXISTS seat_position_weekly_stats (
  id SERIAL PRIMARY KEY,
  commander_id INTEGER NOT NULL REFERENCES commanders(id) ON DELETE CASCADE,
  seat_position INTEGER NOT NULL CHECK (seat_position BETWEEN 1 AND 4),
  week_start DATE NOT NULL,
  games INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(commander_id, seat_position, week_start)
);

-- ============================================
-- INDEXES
-- ============================================

-- Tournament indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_date ON tournaments(tournament_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_tid ON tournaments(tid);

-- Player indexes
CREATE INDEX IF NOT EXISTS idx_players_topdeck_id ON players(topdeck_id);
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);

-- Commander indexes
CREATE INDEX IF NOT EXISTS idx_commanders_name ON commanders(name);
CREATE INDEX IF NOT EXISTS idx_commanders_color_id ON commanders(color_id);

-- Card indexes
CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name);
CREATE INDEX IF NOT EXISTS idx_cards_oracle_id ON cards(oracle_id);

-- Entry indexes
CREATE INDEX IF NOT EXISTS idx_entries_tournament_id ON entries(tournament_id);
CREATE INDEX IF NOT EXISTS idx_entries_player_id ON entries(player_id);
CREATE INDEX IF NOT EXISTS idx_entries_commander_id ON entries(commander_id);
CREATE INDEX IF NOT EXISTS idx_entries_standing ON entries(standing);

-- Decklist item indexes
CREATE INDEX IF NOT EXISTS idx_decklist_items_entry_id ON decklist_items(entry_id);
CREATE INDEX IF NOT EXISTS idx_decklist_items_card_id ON decklist_items(card_id);

-- Game indexes
CREATE INDEX IF NOT EXISTS idx_games_tournament_id ON games(tournament_id);
CREATE INDEX IF NOT EXISTS idx_games_round ON games(round);

-- Game player indexes
CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_game_players_player_id ON game_players(player_id);
CREATE INDEX IF NOT EXISTS idx_game_players_entry_id ON game_players(entry_id);

-- Weekly stats indexes
CREATE INDEX IF NOT EXISTS idx_commander_weekly_stats_commander_id ON commander_weekly_stats(commander_id);
CREATE INDEX IF NOT EXISTS idx_commander_weekly_stats_week_start ON commander_weekly_stats(week_start);

CREATE INDEX IF NOT EXISTS idx_card_commander_weekly_stats_card_id ON card_commander_weekly_stats(card_id);
CREATE INDEX IF NOT EXISTS idx_card_commander_weekly_stats_commander_id ON card_commander_weekly_stats(commander_id);
CREATE INDEX IF NOT EXISTS idx_card_commander_weekly_stats_week_start ON card_commander_weekly_stats(week_start);

CREATE INDEX IF NOT EXISTS idx_seat_position_weekly_stats_commander_id ON seat_position_weekly_stats(commander_id);
CREATE INDEX IF NOT EXISTS idx_seat_position_weekly_stats_week_start ON seat_position_weekly_stats(week_start);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commanders_updated_at
  BEFORE UPDATE ON commanders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commander_weekly_stats_updated_at
  BEFORE UPDATE ON commander_weekly_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_commander_weekly_stats_updated_at
  BEFORE UPDATE ON card_commander_weekly_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seat_position_weekly_stats_updated_at
  BEFORE UPDATE ON seat_position_weekly_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

