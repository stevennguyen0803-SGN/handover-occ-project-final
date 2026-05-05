/**
 * Drop this into the Next.js app's `tailwind.config.ts`. It mirrors the
 * design tokens from `prototype/styles.css` (priority + status palette,
 * shift accents, typography, radii).
 *
 * Usage:
 *   1. Copy this file into your frontend repo as `tailwind.config.ts`.
 *   2. Add `@layer base { :root { ... } [data-theme="dark"] { ... } }` to
 *      your global CSS (see `frontend-stubs/styles.global.example.css`).
 *   3. Tailwind utilities like `bg-priority-critical/10` and
 *      `text-shift` will then resolve to the right tokens.
 */
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './pages/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-elev': 'var(--bg-elev)',
        'bg-side': 'var(--bg-side)',
        'bg-row': 'var(--bg-row)',
        line: 'var(--line)',
        'line-soft': 'var(--line-soft)',
        fg: 'var(--fg)',
        'fg-soft': 'var(--fg-soft)',
        'fg-mute': 'var(--fg-mute)',
        'fg-faint': 'var(--fg-faint)',
        accent: 'var(--accent)',
        'accent-strong': 'var(--accent-strong)',
        'accent-soft': 'var(--accent-soft)',
        'accent-fg': 'var(--accent-fg)',
        shift: 'var(--shift-color)',
        'shift-bg': 'var(--shift-color-bg)',
        'shift-fg': 'var(--shift-color-fg)',
        priority: {
          critical: 'var(--p-critical)',
          'critical-bg': 'var(--p-critical-bg)',
          'critical-fg': 'var(--p-critical-fg)',
          high: 'var(--p-high)',
          'high-bg': 'var(--p-high-bg)',
          'high-fg': 'var(--p-high-fg)',
          normal: 'var(--p-normal)',
          'normal-bg': 'var(--p-normal-bg)',
          'normal-fg': 'var(--p-normal-fg)',
          low: 'var(--p-low)',
          'low-bg': 'var(--p-low-bg)',
          'low-fg': 'var(--p-low-fg)',
        },
        status: {
          open: 'var(--s-open)',
          'open-bg': 'var(--s-open-bg)',
          monitoring: 'var(--s-monitoring)',
          'monitoring-bg': 'var(--s-monitoring-bg)',
          resolved: 'var(--s-resolved)',
          'resolved-bg': 'var(--s-resolved-bg)',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        pill: '9999px',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(16 24 40 / 0.06)',
        elev: '0 4px 16px rgb(16 24 40 / 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        content: '1440px',
      },
      transitionTimingFunction: {
        ease: 'cubic-bezier(.2,.8,.2,1)',
      },
    },
  },
  plugins: [],
};

export default config;
