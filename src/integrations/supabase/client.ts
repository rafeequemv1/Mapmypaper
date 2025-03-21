
import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
const supabaseUrl = 'https://whdugcvcrjhjogstrcak.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);
