import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

/**
 * Ensures a user record exists in the database
 * @param supabase Supabase client
 * @param userId User ID
 * @param email User email
 * @returns Object containing the user record and any error
 */
export async function ensureUserRecord(
  supabase: SupabaseClient<Database>,
  userId: string,
  email: string
) {
  // Check if user record exists
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  // If user exists, return it
  if (existingUser) {
    return { user: existingUser, error: null };
  }

  // If error is not a "not found" error, return the error
  if (fetchError && fetchError.code !== 'PGRST116') {
    return { user: null, error: fetchError };
  }

  // Create user record
  console.log('Creating new user record for:', email);
  
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      id: userId,
      email: email || '',
      subscription_tier: 'FREE',
      analyses_used: 0,
      analyses_limit: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  return { user: newUser, error: insertError };
}

/**
 * Get or create a user record
 * @param supabase Supabase client
 * @returns The user record or null if not authenticated
 */
export async function getCurrentUserRecord(supabase: SupabaseClient<Database>) {
  // Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }
  
  // Ensure user record exists
  const { user: userRecord, error } = await ensureUserRecord(
    supabase,
    user.id,
    user.email || ''
  );
  
  if (error) {
    console.error('Error getting/creating user record:', error);
    return null;
  }
  
  return userRecord;
} 