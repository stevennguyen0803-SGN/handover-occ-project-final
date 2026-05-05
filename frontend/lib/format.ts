import type { Shift } from './types';

const PAD = (n: number) => n.toString().padStart(2, '0');

/** Stable `dd/MM/yyyy` formatter that does not depend on locale. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return `${PAD(d.getDate())}/${PAD(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** `HH:mm` 24-hour formatter. */
export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return `${PAD(d.getHours())}:${PAD(d.getMinutes())}`;
}

/** `HH:mm:ss dd/MM/yyyy` for audit timestamps. */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return `${PAD(d.getHours())}:${PAD(d.getMinutes())}:${PAD(d.getSeconds())} ${formatDate(d)}`;
}

/** Pick the active shift for a Date based on local time. */
export function shiftForTime(value: Date = new Date()): Shift {
  const h = value.getHours();
  if (h >= 5 && h < 13) return 'Morning';
  if (h >= 13 && h < 21) return 'Afternoon';
  return 'Night';
}

/** Whole-day delta between two dates (positive when `b` is after `a`). */
export function dayDiff(a: string | Date, b: string | Date): number {
  const da = typeof a === 'string' ? new Date(a) : a;
  const db = typeof b === 'string' ? new Date(b) : b;
  const ms = db.getTime() - da.getTime();
  return Math.round(ms / 86_400_000);
}
