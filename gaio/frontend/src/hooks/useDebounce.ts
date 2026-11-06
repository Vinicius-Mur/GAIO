import { useEffect, useState } from 'react';

export const useDebounce = <T,>(value: T, delay = 350): T => {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
};
