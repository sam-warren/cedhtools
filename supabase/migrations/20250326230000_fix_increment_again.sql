-- Comprehensive fix for public.increment function
-- Drop and recreate with explicit search_path

BEGIN;

-- First drop the function
DROP FUNCTION IF EXISTS public.increment(uuid);

-- Recreate with proper security settings
CREATE OR REPLACE FUNCTION public.increment(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.users 
  SET analyses_used = analyses_used + 1
  WHERE id = user_id;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.increment(uuid) IS 'Increments the analyses_used counter for a user';

COMMIT; 