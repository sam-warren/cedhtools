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
 *    - Use: `createServiceRoleClient()` (server-only)
 * 
 * ## Usage
 * ```typescript
 * // In a client component
 * 'use client';
 * import { createBrowserClient } from '@/lib/api/supabase';
 * const supabase = createBrowserClient();
 * 
 * // In a server component or API route
 * import { createServerClient } from '@/lib/api/supabase';
 * import { cookies } from 'next/headers';
 * const cookieStore = await cookies();
 * const supabase = createServerClient(cookieStore);
 * 
 * // In ETL or admin operations (server-only)
 * import { createServiceRoleClient } from '@/lib/api/supabase';
 * const supabase = createServiceRoleClient();
 * ```
 */

// Browser client
export { createBrowserClient } from './browser';
export type { BrowserClient } from './browser';

// Server client
export { createServerClient } from './server';
export type { CookieStore, ServerClient } from './server';

// Service role client (server-only)
export { createServiceRoleClient } from './service-role';
export type { ServiceRoleClient } from './service-role';

// Re-export database types for convenience
export type { Database } from '@/lib/types/database';

