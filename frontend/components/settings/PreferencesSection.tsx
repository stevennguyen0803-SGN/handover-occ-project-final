'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../ui/Toast';
import { SHIFT_ORDER } from '../../lib/constants';
import { cn } from '../../lib/cn';
import type { Density, PreferenceState, ThemeMode, Locale, Shift } from '../../lib/types';

export interface PreferencesSectionProps {
  initial: PreferenceState;
  /**
   * Callback fired with the FULL new state on every change. Persistence
   * happens here — the integrator writes cookies / server-side
   * preferences. The component never reads/writes cookies directly so
   * SSR stays consistent.
   */
  onChange: (next: PreferenceState) => void;
}

const THEME_OPTIONS: ReadonlyArray<{
  id: ThemeMode | 'system';
  key: 'settings.preferences.theme.light' | 'settings.preferences.theme.dark' | 'settings.preferences.theme.system';
  icon: string;
}> = [
  { id: 'light', key: 'settings.preferences.theme.light', icon: '☀' },
  { id: 'dark', key: 'settings.preferences.theme.dark', icon: '☾' },
  { id: 'system', key: 'settings.preferences.theme.system', icon: '◐' },
];

const DENSITY_OPTIONS: ReadonlyArray<{
  id: Density;
  key: 'settings.preferences.density.comfortable' | 'settings.preferences.density.compact';
}> = [
  { id: 'comfortable', key: 'settings.preferences.density.comfortable' },
  { id: 'compact', key: 'settings.preferences.density.compact' },
];

const LOCALE_OPTIONS: ReadonlyArray<{ id: Locale; label: string }> = [
  { id: 'vi', label: 'Tiếng Việt' },
  { id: 'en', label: 'English' },
];

export function PreferencesSection({ initial, onChange }: PreferencesSectionProps) {
  const { t, toggle: toggleLocale, locale } = useI18n();
  const { theme: currentTheme, setTheme } = useTheme();
  const { push } = useToast();
  const [state, setState] = useState<PreferenceState>(initial);

  useEffect(() => {
    setState(initial);
  }, [initial]);

  const apply = (patch: Partial<PreferenceState>) => {
    const next = { ...state, ...patch };
    setState(next);
    onChange(next);
    push({ tone: 'success', title: t('settings.toast.saved') });
  };

  const handleTheme = (theme: ThemeMode | 'system') => {
    apply({ theme });
    if (theme === 'light' || theme === 'dark') {
      // Reuse the friendly-redesign theme cookie machinery so the rest of
      // the app picks the change up immediately.
      if (theme !== currentTheme) setTheme(theme);
    }
  };

  const handleLocale = (next: Locale) => {
    apply({ locale: next });
    if (next !== locale) toggleLocale();
  };

  return (
    <div className="flex flex-col gap-4 rounded-md border border-line bg-bg-elev p-4">
      <header>
        <h2 className="text-base font-semibold text-fg">{t('settings.preferences.section')}</h2>
      </header>

      <Field label={t('settings.preferences.theme')}>
        <div className="flex flex-wrap gap-2">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleTheme(opt.id)}
              aria-pressed={state.theme === opt.id}
              className={cn(
                'flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm text-fg-soft hover:border-accent hover:text-fg',
                state.theme === opt.id && 'border-accent bg-accent-soft text-fg'
              )}
            >
              <span aria-hidden>{opt.icon}</span>
              <span>{t(opt.key)}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label={t('settings.preferences.locale')}>
        <div className="flex flex-wrap gap-2">
          {LOCALE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleLocale(opt.id)}
              aria-pressed={state.locale === opt.id}
              className={cn(
                'rounded-md border border-line px-3 py-1.5 text-sm text-fg-soft hover:border-accent hover:text-fg',
                state.locale === opt.id && 'border-accent bg-accent-soft text-fg'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label={t('settings.preferences.density')}>
        <div className="flex flex-wrap gap-2">
          {DENSITY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => apply({ density: opt.id })}
              aria-pressed={state.density === opt.id}
              className={cn(
                'rounded-md border border-line px-3 py-1.5 text-sm text-fg-soft hover:border-accent hover:text-fg',
                state.density === opt.id && 'border-accent bg-accent-soft text-fg'
              )}
            >
              {t(opt.key)}
            </button>
          ))}
        </div>
      </Field>

      <Field label={t('settings.preferences.defaultShift')}>
        <select
          value={state.defaultShift}
          onChange={(e) => apply({ defaultShift: e.target.value as Shift | '' })}
          className="rounded-md border border-line bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
        >
          <option value="">{t('settings.preferences.defaultShift.current')}</option>
          {SHIFT_ORDER.map((s) => (
            <option key={s} value={s}>
              {t(`shift.${s.toLowerCase() as Lowercase<Shift>}`)}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-fg-mute">{label}</span>
      {children}
    </div>
  );
}
