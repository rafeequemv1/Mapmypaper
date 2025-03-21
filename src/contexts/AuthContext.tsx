
import { createContext, useContext } from 'react';

// Simple context with no authentication
type AuthContextType = {
  user: null;
  loading: false;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: null, loading: false }}>
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
