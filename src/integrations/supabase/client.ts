
import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
const supabaseUrl = 'https://whdugcvcrjhjogstrcak.supabase.co';
// Use the environment variable, with a fallback to the hardcoded key for development
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZHVnY3Zjcmpoam9nc3RyY2FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjkzMTEsImV4cCI6MjA1NzkwNTMxMX0.zXvflX0ifzHkHPLNyjtA_ncogII7UxVnYXPx6f_rQ4c';

// Initialize the Supabase client with auth configuration
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: localStorage
  }
});
