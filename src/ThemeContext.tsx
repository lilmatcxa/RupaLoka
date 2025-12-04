// app/ThemeContext.tsx
import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import { AppTheme, getAppTheme } from '../constants/theme';

export const ThemeContext = createContext<AppTheme | null>(null);

export function ThemeProvider({ children, now }: { children: ReactNode; now?: Date }) {
  // compute once on mount (or with provided `now` for testing)
  const theme = useMemo(() => getAppTheme(now), [now]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): AppTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // fallback to computed default
    return getAppTheme();
  }
  return ctx;
}
