
import { useContext, createContext } from 'react';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Create a Supabase client singleton
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Context for Supabase
const SupabaseContext = createContext<{
  client: SupabaseClient;
  user: User | null;
  loading: boolean;
}>({
  client: supabase,
  user: null,
  loading: true,
});

// Custom hooks to use the context
export const useSupabaseClient = () => {
  const context = useContext(SupabaseContext);
  return context.client;
};

export const useUser = () => {
  const context = useContext(SupabaseContext);
  return context.user;
};

export const useSupabaseLoading = () => {
  const context = useContext(SupabaseContext);
  return context.loading;
};

export { SupabaseContext };
