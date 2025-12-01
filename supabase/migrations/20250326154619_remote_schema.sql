-- This migration was auto-generated from remote schema diff
-- It attempted to modify internal Supabase storage functions which have
-- different dependencies in local vs hosted environments.
-- 
-- Skipping these storage schema changes as they are managed by Supabase internally.
-- The original migration attempted to:
-- - Drop storage triggers and functions
-- - Drop the storage.prefixes table
-- - Modify storage.objects table
--
-- These changes are not needed for the application to function.

SELECT 1; -- No-op migration
