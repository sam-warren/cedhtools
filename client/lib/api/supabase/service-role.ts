/**
 * Service Role Supabase Client
 * 
 * For admin operations like ETL jobs and backend processes.
 * Bypasses Row Level Security - use with caution!
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

function getSupabaseUrl(): string {
  // Service role can use SUPABASE_URL or fall back to public URL
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('Missing required environment variable: SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  }
  return url;
}

function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
  }
  return key;
}

/**
 * Create a Supabase client with service role privileges.
 * 
 * WARNING: This client bypasses Row Level Security (RLS).
 * Only use for trusted backend operations like ETL jobs.
 * 
 * This client:
 * - Uses the service role key (never expose to browser!)
 * - Bypasses all RLS policies
 * - Has full database access
 * - Does not persist sessions
 * 
 * @returns Supabase client with admin privileges
 */
export function createServiceRoleClient() {
  return createClient<Database>(
    getSupabaseUrl(),
    getServiceRoleKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export type ServiceRoleClient = ReturnType<typeof createServiceRoleClient>;

