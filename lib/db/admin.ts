/**
 * Supabase Admin Client
 *
 * Creates a Supabase client with service role key for admin operations.
 * Works in both Node.js (scripts) and Deno (Edge Functions) environments.
 */

import {
  createClient as createSupabaseClient,
  SupabaseClient,
} from "@supabase/supabase-js";
import type { Database } from "./types";

export type SupabaseAdmin = SupabaseClient<Database>;

// Type guard for Deno environment
declare const Deno:
  | {
      env: {
        get(key: string): string | undefined;
      };
    }
  | undefined;

/**
 * Create a Supabase client with service role key for admin operations.
 * Works in both Node.js (scripts) and Deno (Edge Functions) environments.
 */
export function createSupabaseAdmin(): SupabaseAdmin {
  // Support both Node.js and Deno environments
  const supabaseUrl =
    typeof Deno !== "undefined"
      ? Deno.env.get("SUPABASE_URL")
      : process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    typeof Deno !== "undefined"
      ? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      : process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables (SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)"
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseKey);
}

