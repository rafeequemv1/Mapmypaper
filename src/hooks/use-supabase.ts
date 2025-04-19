
import { useContext, createContext } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Context for Supabase
const SupabaseContext = createContext<{
  client: typeof supabase;
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

export { SupabaseContext, supabase };
