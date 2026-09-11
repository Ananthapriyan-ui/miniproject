/**
 * Supabase Client (optional — not required for auth flow)
 * Auth is now handled directly by the Flask/FastAPI backend via JWT.
 * This file is kept for potential future Supabase integrations only.
 * It will NOT crash the app if Supabase env vars are not configured.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (e) {
    console.warn('Supabase client init failed:', e.message);
  }
}

export { supabase };
export default supabase;
