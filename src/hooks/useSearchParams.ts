
import { useMemo } from 'react';

export function useSearchParams() {
  const searchParams = useMemo(() => {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);

  return searchParams;
}
