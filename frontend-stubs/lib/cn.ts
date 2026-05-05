/**
 * Lightweight `clsx` clone — joins truthy class strings.
 * Replace with `clsx` (or `tailwind-merge`) once you add the dep to your app.
 */
export type ClassValue = string | number | null | false | undefined | ClassValue[];

export function cn(...args: ClassValue[]): string {
  const out: string[] = [];
  for (const a of args) {
    if (!a) continue;
    if (typeof a === 'string' || typeof a === 'number') {
      out.push(String(a));
    } else if (Array.isArray(a)) {
      const inner = cn(...a);
      if (inner) out.push(inner);
    }
  }
  return out.join(' ');
}
