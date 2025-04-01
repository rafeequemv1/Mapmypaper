
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * A custom hook to mimic Next.js's useSearchParams functionality
 * in a React Router environment
 */
export function useSearchParams() {
  const location = useLocation();
  
  const searchParams = useMemo(() => {
    return new URLSearchParams(location.search);
  }, [location.search]);
  
  return searchParams;
}
