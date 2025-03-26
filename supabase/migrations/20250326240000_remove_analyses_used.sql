-- Remove the unused analyses_used feature
-- Drops both the function and column that are causing the security warning

BEGIN;

-- First drop the function that has the security warning
DROP FUNCTION IF EXISTS public.increment(uuid);

-- Now remove the analyses_used column from the users table
ALTER TABLE public.users DROP COLUMN IF EXISTS analyses_used;

-- If there are any references to analyses_limit, we should remove that too
-- since it's likely related to the analyses_used feature
ALTER TABLE public.users DROP COLUMN IF EXISTS analyses_limit;

COMMIT; 