'use client';

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Command } from '../lib/commands';

interface CommandPaletteValue {
  /** Whether the Cmd+K palette is currently open. */
  open: boolean;
  /** Whether the "?" shortcuts overlay is currently open. */
  shortcutsOpen: boolean;
  /** Show / hide the palette. */
  setOpen: (next: boolean) => void;
  /** Show / hide the shortcuts overlay. */
  setShortcutsOpen: (next: boolean) => void;
  /** Active commands (built-ins + ones registered via `useRegisterCommands`). */
  commands: ReadonlyArray<Command>;
  /** Internal: append commands to the registry. Returns an unregister fn. */
  register: (cmds: ReadonlyArray<Command>) => () => void;
}

const Ctx = createContext<CommandPaletteValue | null>(null);

/**
 * Provider. Wrap your app once (typically inside `<AppShell>` so
 * `useRouter()` is available downstream). `defaultCommands` are the
 * always-present built-ins from `buildDefaultCommands()`.
 */
export function CommandPaletteProvider({
  defaultCommands,
  children,
}: {
  defaultCommands: ReadonlyArray<Command>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [extraGroups, setExtraGroups] = useState<ReadonlyArray<ReadonlyArray<Command>>>([]);

  const register = useCallback((cmds: ReadonlyArray<Command>): (() => void) => {
    setExtraGroups((prev) => [...prev, cmds]);
    return () => {
      setExtraGroups((prev) => prev.filter((g) => g !== cmds));
    };
  }, []);

  const commands = useMemo<ReadonlyArray<Command>>(() => {
    // De-duplicate by id; later registrations win so a page can
    // override a default command if it really needs to.
    const seen = new Map<string, Command>();
    for (const c of defaultCommands) seen.set(c.id, c);
    for (const group of extraGroups) for (const c of group) seen.set(c.id, c);
    return Array.from(seen.values());
  }, [defaultCommands, extraGroups]);

  const value = useMemo<CommandPaletteValue>(
    () => ({ open, shortcutsOpen, setOpen, setShortcutsOpen, commands, register }),
    [open, shortcutsOpen, commands, register]
  );

  return createElement(Ctx.Provider, { value }, children);
}

/** Read the palette context. Throws if used outside a provider. */
export function useCommandPalette(): CommandPaletteValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCommandPalette must be used inside <CommandPaletteProvider>.');
  return ctx;
}

/**
 * Register commands for the lifetime of the calling component. Pass a
 * STABLE reference (e.g. `useMemo`) — re-registering on every render
 * causes flicker.
 */
export function useRegisterCommands(commands: ReadonlyArray<Command>): void {
  const { register } = useCommandPalette();
  useEffect(() => {
    return register(commands);
  }, [register, commands]);
}
