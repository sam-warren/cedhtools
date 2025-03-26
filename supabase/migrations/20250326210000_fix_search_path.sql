-- Fix search_path parameter in SECURITY DEFINER functions
-- This addresses the "Function Search Path Mutable" security warnings

BEGIN;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, analyses_used, created_at, updated_at)
  VALUES (NEW.id, NEW.email, 0, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix increment function
CREATE OR REPLACE FUNCTION public.increment(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.users 
  SET analyses_used = analyses_used + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix clear_etl_data function
CREATE OR REPLACE FUNCTION public.clear_etl_data()
RETURNS void AS $$
BEGIN
  TRUNCATE TABLE public.etl_status;
  TRUNCATE TABLE public.etl_jobs;
  TRUNCATE TABLE public.processed_tournaments;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix reset_stuck_jobs function
CREATE OR REPLACE FUNCTION public.reset_stuck_jobs()
RETURNS INTEGER AS $$
DECLARE
  reset_count INTEGER := 0;
BEGIN
  -- Find and reset jobs that have been running too long
  UPDATE public.etl_jobs
  SET 
    status = 'PENDING',
    started_at = NULL,
    error = CONCAT(error, ' | Automatically reset due to exceeding max runtime.')
  WHERE
    status = 'RUNNING'
    AND started_at IS NOT NULL
    AND EXTRACT(EPOCH FROM (NOW() - started_at)) > max_runtime_seconds;
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix batch_upsert_deck_data function with correct implementation
CREATE OR REPLACE FUNCTION public.batch_upsert_deck_data(
  commander_data jsonb,
  cards_data jsonb,
  stats_data jsonb
) RETURNS void AS $$
BEGIN
  -- Upsert commander
  INSERT INTO public.commanders (id, name, wins, losses, draws, entries, updated_at)
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
  INSERT INTO public.cards (unique_card_id, name, scryfall_id, type, type_line, updated_at)
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
  INSERT INTO public.statistics (commander_id, card_id, wins, losses, draws, entries, updated_at)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMIT; 