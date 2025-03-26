import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

/**
 * Gets an existing user record from the database
 * This was previously ensureUserRecord, but we now handle user record creation with a database trigger
 * @param supabase Supabase client
 * @param userId User ID
 * @param email User email
 * @returns Object containing the user record and any error
 */
export async function getUserRecord(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  // Check if user record exists
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  return { user: existingUser, error: fetchError };
}

/**
 * Get user record
 * @param supabase Supabase client
 * @returns The user record or null if not authenticated
 */
export async function getCurrentUserRecord(supabase: SupabaseClient<Database>) {
  // Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user record
  const { user: userRecord, error } = await getUserRecord(
    supabase,
    user.id,
  );

  if (error) {
    console.error('Error getting user record:', error);
    return null;
  }

  return userRecord;
} 