import type { TranslationKey } from './i18n';
import type { UserRole } from './types';

/**
 * A keyboard chord rendered in the palette + shortcuts overlay. Use
 * `mod` for the platform-aware modifier (Cmd on macOS, Ctrl elsewhere).
 */
export interface Kbd {
  /** Modifier flags. */
  mod?: boolean;
  alt?: boolean;
  shift?: boolean;
  /** The literal key — single characters are uppercased for display. */
  key: string;
}

/**
 * Group used by both the command palette (when grouping suggestions)
 * and the shortcuts overlay (section headers).
 */
export type CommandGroup = 'navigation' | 'actions' | 'preferences' | 'help';

/**
 * A registered command.
 *
 * `id` should be stable (used for React keys + dedup). `titleKey` and
 * optional `descriptionKey` go through `t()`. `keywords` is a free-form
 * array of extra aliases the fuzzy matcher will search against (e.g.
 * "settings" for the Preferences command). `availableWhen` lets a
 * command opt-out per role; absent ⇒ always available.
 */
export interface Command {
  id: string;
  titleKey: TranslationKey;
  descriptionKey?: TranslationKey;
  group: CommandGroup;
  keywords?: string[];
  kbd?: Kbd;
  /** Triggered when the user hits Enter on the highlighted row. */
  run: () => void | Promise<void>;
  /** When provided, the command is filtered out for users whose role isn't in the list. */
  availableWhen?: ReadonlyArray<UserRole>;
  /** Override icon rendering (single emoji is fine). */
  icon?: string;
}

/**
 * Build the default command set. Caller passes navigation + theme +
 * locale toggles so this module stays free of hooks/router imports.
 */
export interface DefaultCommandsDeps {
  navigate: (href: string) => void;
  toggleTheme: () => void;
  toggleLocale: () => void;
  signOut?: () => void | Promise<void>;
  openShortcutsOverlay: () => void;
}

export function buildDefaultCommands(deps: DefaultCommandsDeps): Command[] {
  return [
    {
      id: 'nav.dashboard',
      titleKey: 'cmdk.command.dashboard',
      group: 'navigation',
      keywords: ['home', 'kpi'],
      kbd: { key: 'D' },
      icon: '🏠',
      run: () => deps.navigate('/dashboard'),
    },
    {
      id: 'nav.log',
      titleKey: 'cmdk.command.log',
      group: 'navigation',
      keywords: ['handovers', 'history'],
      kbd: { key: 'L' },
      icon: '📋',
      run: () => deps.navigate('/log'),
    },
    {
      id: 'nav.newHandover',
      titleKey: 'cmdk.command.newHandover',
      group: 'actions',
      keywords: ['create', 'add'],
      kbd: { key: 'N' },
      icon: '➕',
      run: () => deps.navigate('/handover/new'),
    },
    {
      id: 'nav.reports',
      titleKey: 'cmdk.command.reports',
      group: 'navigation',
      keywords: ['export', 'csv', 'pdf'],
      icon: '📊',
      availableWhen: ['ADMIN', 'SUPERVISOR', 'MANAGEMENT_VIEWER'],
      run: () => deps.navigate('/reports'),
    },
    {
      id: 'nav.admin',
      titleKey: 'cmdk.command.admin',
      group: 'navigation',
      keywords: ['users', 'manage'],
      icon: '👥',
      availableWhen: ['ADMIN'],
      run: () => deps.navigate('/admin/users'),
    },
    {
      id: 'nav.settings',
      titleKey: 'cmdk.command.settings',
      group: 'preferences',
      keywords: ['profile', 'preferences', 'security', 'password'],
      icon: '⚙',
      run: () => deps.navigate('/settings'),
    },
    {
      id: 'pref.toggleTheme',
      titleKey: 'cmdk.command.toggleTheme',
      group: 'preferences',
      keywords: ['dark', 'light', 'mode'],
      kbd: { key: 'T' },
      icon: '◐',
      run: deps.toggleTheme,
    },
    {
      id: 'pref.toggleLocale',
      titleKey: 'cmdk.command.toggleLocale',
      group: 'preferences',
      keywords: ['vi', 'en', 'language'],
      icon: '🌐',
      run: deps.toggleLocale,
    },
    {
      id: 'help.shortcuts',
      titleKey: 'cmdk.command.shortcuts',
      group: 'help',
      keywords: ['keys', 'cheat sheet', 'help'],
      kbd: { key: '?' },
      icon: '⌨',
      run: deps.openShortcutsOverlay,
    },
    ...(deps.signOut
      ? [
          {
            id: 'auth.signOut',
            titleKey: 'cmdk.command.signOut' as TranslationKey,
            group: 'actions' as CommandGroup,
            keywords: ['logout', 'log out'],
            icon: '⏻',
            run: deps.signOut,
          },
        ]
      : []),
  ];
}

/** Pretty-print a `Kbd` for display. */
export function formatKbd(kbd: Kbd, isMac: boolean): string {
  const parts: string[] = [];
  if (kbd.mod) parts.push(isMac ? '⌘' : 'Ctrl');
  if (kbd.alt) parts.push(isMac ? '⌥' : 'Alt');
  if (kbd.shift) parts.push(isMac ? '⇧' : 'Shift');
  parts.push(kbd.key.length === 1 ? kbd.key.toUpperCase() : kbd.key);
  return parts.join(isMac ? '' : '+');
}
