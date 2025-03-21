
import { createContext, useContext } from 'react';

// Empty context with no authentication
type AuthContextType = {
  user: null;
  loading: false;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Simply render children without any auth checks
  return (
    <AuthContext.Provider value={{ user: null, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return { user: null, loading: false };
}
