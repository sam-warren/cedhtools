import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Create a single supabase client for the entire app
export const createServerClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables');
    }

    return createClient<Database>(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: true,
        }
    });
};

// Create a client for server components
export const supabaseServer = createServerClient(); 