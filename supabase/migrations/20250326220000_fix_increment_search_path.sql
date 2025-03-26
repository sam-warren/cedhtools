-- Fix search_path for public.increment function
-- This ensures the function always uses fully qualified table names

BEGIN;

-- Re-create increment function with search_path set to empty
CREATE OR REPLACE FUNCTION public.increment(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.users 
  SET analyses_used = analyses_used + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMIT; 