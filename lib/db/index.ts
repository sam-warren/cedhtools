/**
 * Database Module
 *
 * Re-exports database client creation and types.
 */

// Client-side (browser) Supabase client
export { createClient } from "./client";

// Server-side (Next.js) Supabase client
export { createClient as createServerClient } from "./server";

// Admin client (service role) for jobs
export { createSupabaseAdmin, type SupabaseAdmin } from "./admin";

// Database types
export type { Database } from "./types";

