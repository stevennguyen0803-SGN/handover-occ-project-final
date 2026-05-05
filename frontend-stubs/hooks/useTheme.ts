'use client';

import { useEffect, useState } from 'react';
import type { ThemeMode } from '../lib/types';

/**
 * Lightweight theme controller. Persists to a cookie (NOT localStorage —
 * AGENTS.md rule). Reads/writes `data-theme` on `<html>` so Tailwind's
 * `data-theme="dark"` selectors match.
 *
 * Replace `defaultTheme` with the value resolved on the server (e.g. via
 * cookies in Next.js App Router) to avoid a client-side flash.
 */
export function useTheme(defaultTheme: ThemeMode = 'light') {
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
    document.cookie = `occ_theme=${theme}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  }, [theme]);

  return {
    theme,
    setTheme: setThemeState,
    toggleTheme: () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark')),
  };
}
