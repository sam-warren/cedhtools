/**
 * Browser Supabase Client
 * 
 * For client-side React components.
 * Uses the public anon key and persists sessions in cookies.
 */

import { createBrowserClient as supabaseBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/database';

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL');
  }
  return url;
}

function getAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return key;
}

/**
 * Create a Supabase client for browser/client-side usage.
 * 
 * This client:
 * - Uses the public anon key (safe to expose)
 * - Persists sessions in cookies
 * - Is subject to Row Level Security (RLS)
 * 
 * @example
 * ```typescript
 * 'use client';
 * import { createBrowserClient } from '@/lib/api/supabase';
 * 
 * export function MyComponent() {
 *   const supabase = createBrowserClient();
 *   // Use supabase...
 * }
 * ```
 */
export function createBrowserClient() {
  return supabaseBrowserClient<Database>(
    getSupabaseUrl(),
    getAnonKey()
  );
}

export type BrowserClient = ReturnType<typeof createBrowserClient>;

