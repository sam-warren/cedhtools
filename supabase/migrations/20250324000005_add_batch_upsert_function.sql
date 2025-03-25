-- Create or replace the batch upsert function
CREATE OR REPLACE FUNCTION batch_upsert_deck_data(
  commander_data jsonb,
  cards_data jsonb,
  stats_data jsonb
) RETURNS void AS $$
BEGIN
  -- Upsert commander
  INSERT INTO commanders (id, name, wins, losses, draws, entries, updated_at)
  VALUES (
    commander_data->>'id',
    commander_data->>'name',
    (commander_data->>'wins')::int,
    (commander_data->>'losses')::int,
    (commander_data->>'draws')::int,
    (commander_data->>'entries')::int,
    (commander_data->>'updated_at')::timestamp
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    wins = EXCLUDED.wins,
    losses = EXCLUDED.losses,
    draws = EXCLUDED.draws,
    entries = EXCLUDED.entries,
    updated_at = EXCLUDED.updated_at;

  -- Batch upsert cards
  WITH cards_json AS (
    SELECT jsonb_array_elements(cards_data) as card_data
  )
  INSERT INTO cards (unique_card_id, name, scryfall_id, type, type_line, updated_at)
  SELECT
    card_data->>'unique_card_id',
    card_data->>'name',
    card_data->>'scryfall_id',
    COALESCE((card_data->>'type')::int, 0),
    card_data->>'type_line',
    (card_data->>'updated_at')::timestamp
  FROM cards_json
  ON CONFLICT (unique_card_id) DO UPDATE SET
    name = EXCLUDED.name,
    scryfall_id = EXCLUDED.scryfall_id,
    type = EXCLUDED.type,
    type_line = EXCLUDED.type_line,
    updated_at = EXCLUDED.updated_at;

  -- Batch upsert statistics
  WITH stats_json AS (
    SELECT jsonb_array_elements(stats_data) as stat_data
  )
  INSERT INTO statistics (commander_id, card_id, wins, losses, draws, entries, updated_at)
  SELECT
    stat_data->>'commander_id',
    stat_data->>'card_id',
    (stat_data->>'wins')::int,
    (stat_data->>'losses')::int,
    (stat_data->>'draws')::int,
    (stat_data->>'entries')::int,
    (stat_data->>'updated_at')::timestamp
  FROM stats_json
  ON CONFLICT (commander_id, card_id) DO UPDATE SET
    wins = EXCLUDED.wins,
    losses = EXCLUDED.losses,
    draws = EXCLUDED.draws,
    entries = EXCLUDED.entries,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql; 