
import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
const supabaseUrl = 'https://whdugcvcrjhjogstrcak.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize the Supabase client with auth configuration
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: localStorage
  }
});
