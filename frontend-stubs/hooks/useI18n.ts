'use client';

import { createContext, createElement, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { translate, type TranslationKey } from '../lib/i18n';
import type { Locale } from '../lib/types';

interface I18nValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  toggle: () => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export interface I18nProviderProps {
  initialLocale?: Locale;
  children: ReactNode;
}

export function I18nProvider({ initialLocale = 'vi', children }: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale]
  );
  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      toggle: () => setLocale((prev) => (prev === 'vi' ? 'en' : 'vi')),
      t,
    }),
    [locale, t]
  );
  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used inside <I18nProvider>.');
  }
  return ctx;
}
