'use client';

import { useEffect } from 'react';

export interface ShortcutMap {
  /** N → create new handover */
  onNew?: () => void;
  /** / → focus search input */
  onSearch?: () => void;
  /** D → go to dashboard */
  onDashboard?: () => void;
  /** L → go to handover log */
  onLog?: () => void;
  /** A → acknowledge current handover (only fires on detail pages) */
  onAck?: () => void;
  /** T → toggle light/dark theme */
  onToggleTheme?: () => void;
  /** ? → open the shortcut help modal */
  onHelp?: () => void;
  /** Cmd+K / Ctrl+K → open the command palette */
  onPalette?: () => void;
  /** Esc → close modal / blur search */
  onEscape?: () => void;
}

/**
 * Wires single-keystroke shortcuts. Skips when the user is typing in an
 * input/textarea so we never hijack form input.
 */
export function useKeyboardShortcuts(map: ShortcutMap): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const inEditable = tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable === true;

      if (event.key === 'Escape') {
        map.onEscape?.();
        return;
      }
      // Cmd+K / Ctrl+K is intentionally allowed inside editable
      // elements so users can summon the palette from a search input.
      if ((event.metaKey || event.ctrlKey) && (event.key === 'k' || event.key === 'K')) {
        if (map.onPalette) {
          event.preventDefault();
          map.onPalette();
        }
        return;
      }
      if (inEditable) return;

      switch (event.key) {
        case '/':
          if (map.onSearch) {
            event.preventDefault();
            map.onSearch();
          }
          break;
        case '?':
          map.onHelp?.();
          break;
        case 'n':
        case 'N':
          map.onNew?.();
          break;
        case 'd':
        case 'D':
          map.onDashboard?.();
          break;
        case 'l':
        case 'L':
          map.onLog?.();
          break;
        case 'a':
        case 'A':
          map.onAck?.();
          break;
        case 't':
        case 'T':
          map.onToggleTheme?.();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [map]);
}
