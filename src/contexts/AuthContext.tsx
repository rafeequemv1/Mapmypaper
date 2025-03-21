
import { createContext, useContext, useState } from 'react';

type AuthContextType = {
  user: null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);

  // Mock authentication functions
  const signIn = async (email: string, password: string) => {
    console.log("Mock sign in with:", email, password);
    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    console.log("Mock sign up with:", email, password);
    return { error: null };
  };

  const signOut = async () => {
    console.log("Mock sign out");
  };

  return (
    <AuthContext.Provider value={{ user: null, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
