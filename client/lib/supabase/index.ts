/**
 * Supabase Client Factory
 * 
 * Centralized Supabase client creation for the entire application.
 * This module provides the single source of truth for Supabase client instances.
 * 
 * ## Client Types
 * 
 * 1. **Browser Client**: For client-side React components
 *    - Uses anon key
 *    - Session persisted in cookies
 *    - Use: `createBrowserClient()`
 * 
 * 2. **Server Client**: For server components, API routes, middleware
 *    - Uses anon key with cookie handling
 *    - Session read from/written to cookies
 *    - Use: `createServerClient()` with cookie store
 * 
 * 3. **Service Role Client**: For admin operations (ETL, backend jobs)
 *    - Uses service role key
 *    - Bypasses RLS
 *    - Use: `createServiceRoleClient()`
 * 
 * ## Usage
 * ```typescript
 * // In a client component
 * 'use client';
 * import { createBrowserClient } from '@/lib/supabase';
 * const supabase = createBrowserClient();
 * 
 * // In a server component or API route
 * import { createServerClient } from '@/lib/supabase';
 * import { cookies } from 'next/headers';
 * const cookieStore = await cookies();
 * const supabase = createServerClient(cookieStore);
 * 
 * // In ETL or admin operations
 * import { serviceRoleClient } from '@/lib/supabase';
 * ```
 */

import { createBrowserClient as supabaseBrowserClient } from '@supabase/ssr';
import { createServerClient as supabaseServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';
import type { CookieOptions } from '@supabase/ssr';

// =============================================================================
// ENVIRONMENT VALIDATION
// =============================================================================

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getSupabaseUrl(): string {
  return getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL');
}

function getAnonKey(): string {
  return getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

function getServiceRoleKey(): string {
  return getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
}

// =============================================================================
// BROWSER CLIENT
// =============================================================================

/**
 * Create a Supabase client for browser/client-side usage.
 * 
 * This client:
 * - Uses the public anon key (safe to expose)
 * - Persists sessions in cookies
 * - Is subject to Row Level Security (RLS)
 * 
 * @returns Supabase client for browser usage
 * 
 * @example
 * ```typescript
 * 'use client';
 * import { createBrowserClient } from '@/lib/supabase';
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

// =============================================================================
// SERVER CLIENT
// =============================================================================

/**
 * Cookie store interface for server client
 */
interface CookieStore {
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
 * import { createServerClient } from '@/lib/supabase';
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

// =============================================================================
// SERVICE ROLE CLIENT
// =============================================================================

/**
 * Create a Supabase client with service role privileges.
 * 
 * ⚠️ WARNING: This client bypasses Row Level Security (RLS).
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
    process.env.SUPABASE_URL || getSupabaseUrl(),
    getServiceRoleKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Singleton service role client for ETL and admin operations.
 * 
 * Use this for operations that don't need per-request isolation.
 * For request-scoped operations, use `createServiceRoleClient()` instead.
 */
export const serviceRoleClient = createServiceRoleClient();

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type { Database };
export type SupabaseClient = ReturnType<typeof createBrowserClient>;
export type SupabaseServerClient = ReturnType<typeof createServerClient>;
export type SupabaseServiceRoleClient = ReturnType<typeof createServiceRoleClient>;

