/**
 * Supabase Client
 * Single shared instance for the entire app.
 * Auth session is managed automatically by the SDK (storage, refresh, etc.)
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Store session in localStorage (default). Supabase auto-refreshes the JWT.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
