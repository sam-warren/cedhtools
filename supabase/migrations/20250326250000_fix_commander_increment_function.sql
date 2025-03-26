-- Fix the commander increment function by adding search_path
-- This addresses the "Function Search Path Mutable" security warning

BEGIN;

-- Drop and recreate the increment function with proper security settings
DROP FUNCTION IF EXISTS public.increment(int, int, int, int);

CREATE OR REPLACE FUNCTION public.increment(
  row_wins int DEFAULT 0, 
  row_losses int DEFAULT 0, 
  row_draws int DEFAULT 0, 
  row_entries int DEFAULT 0
)
RETURNS TABLE (
  wins int,
  losses int,
  draws int,
  entries int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY SELECT
    COALESCE(public.commanders.wins, 0) + row_wins,
    COALESCE(public.commanders.losses, 0) + row_losses,
    COALESCE(public.commanders.draws, 0) + row_draws,
    COALESCE(public.commanders.entries, 0) + row_entries
  FROM public.commanders;
END;
$$;

COMMIT; 