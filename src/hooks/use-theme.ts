'use client';

import { useCallback, useEffect, useState } from 'react';

const THEME_KEY = 'kanejo-theme';

type Theme = 'light' | 'dark' | 'system';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme): void {
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

export function useTheme(): {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
} {
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    const initial = stored ?? 'system';
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  useEffect(() => {
    if (theme !== 'system') return;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (): void => applyTheme('system');
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }, []);

  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;

  return { theme, resolvedTheme, setTheme };
}
