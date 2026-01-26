import { useState, useEffect, useCallback } from 'react';

interface UseSessionFiltersOptions<T> {
  key: string;
  defaultValue: T;
}

export function useSessionFilters<T>({ key, defaultValue }: UseSessionFiltersOptions<T>) {
  const storageKey = `session_filters_${key}`;

  // Initialize state from sessionStorage or use default
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Handle date ranges specially - convert strings back to Date objects
        if (parsed && typeof parsed === 'object') {
          if ('from' in parsed && parsed.from) {
            parsed.from = new Date(parsed.from);
          }
          if ('to' in parsed && parsed.to) {
            parsed.to = new Date(parsed.to);
          }
        }
        return parsed;
      }
      return defaultValue;
    } catch (error) {
      console.error(`Error loading session filter ${key}:`, error);
      return defaultValue;
    }
  });

  // Persist to sessionStorage whenever value changes
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving session filter ${key}:`, error);
    }
  }, [value, storageKey, key]);

  // Clear the stored value
  const clear = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
      setValue(defaultValue);
    } catch (error) {
      console.error(`Error clearing session filter ${key}:`, error);
    }
  }, [storageKey, defaultValue, key]);

  return [value, setValue, clear] as const;
}
