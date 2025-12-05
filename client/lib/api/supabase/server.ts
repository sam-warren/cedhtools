/**
 * Server Supabase Client
 * 
 * For server components, API routes, and middleware.
 * Uses anon key with cookie handling for session management.
 */

import { createServerClient as supabaseServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
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
 * Cookie store interface for server client
 */
export interface CookieStore {
  getAll(): Array<{ name: string; value: string }>;
  set(name: string, value: string, options?: CookieOptions): void;
}

/**
 * Create a Supabase client for server-side usage (API routes, server components).
 * 
 * This client:
 * - Uses the public anon key
 * - Manages session through cookies
 * - Is subject to Row Level Security (RLS)
 * - Requires a cookie store from Next.js
 * 
 * @param cookieStore - Next.js cookie store from `await cookies()`
 * @returns Supabase client for server usage
 * 
 * @example
 * ```typescript
 * import { createServerClient } from '@/lib/api/supabase';
 * import { cookies } from 'next/headers';
 * 
 * export async function GET() {
 *   const cookieStore = await cookies();
 *   const supabase = createServerClient(cookieStore);
 *   const { data: { user } } = await supabase.auth.getUser();
 * }
 * ```
 */
export function createServerClient(cookieStore: CookieStore) {
  return supabaseServerClient<Database>(
    getSupabaseUrl(),
    getAnonKey(),
    {
      cookies: {
        getAll: () => {
          return cookieStore.getAll();
        },
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Handle cases where cookies can't be set (e.g., in Server Components)
            // This is expected behavior in some contexts
          }
        },
      },
    }
  );
}

export type ServerClient = ReturnType<typeof createServerClient>;

