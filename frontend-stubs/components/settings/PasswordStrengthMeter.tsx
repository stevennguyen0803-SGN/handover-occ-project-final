'use client';

import { useI18n } from '../../hooks/useI18n';
import { cn } from '../../lib/cn';

export type PasswordStrength = 'weak' | 'fair' | 'strong';

/**
 * Pure scoring function — no external libs (no zxcvbn). Conservative
 * heuristic suitable for the OCC pilot:
 *   - +1 length ≥ 8
 *   - +1 length ≥ 12
 *   - +1 mix of letters + digits
 *   - +1 contains a symbol
 *
 * Server-side enforcement is still required (BR-12). This is just to
 * give the user a visual hint while typing.
 */
export function scorePassword(pw: string): { score: number; strength: PasswordStrength } {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[a-zA-Z]/.test(pw) && /\d/.test(pw)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pw)) score += 1;

  const strength: PasswordStrength = score <= 1 ? 'weak' : score <= 2 ? 'fair' : 'strong';
  return { score, strength };
}

const TONE: Record<PasswordStrength, string> = {
  weak: 'bg-priority-critical-fg',
  fair: 'bg-priority-high-fg',
  strong: 'bg-priority-low-fg',
};

const STRENGTH_KEY: Record<PasswordStrength, 'settings.security.strength.weak' | 'settings.security.strength.fair' | 'settings.security.strength.strong'> = {
  weak: 'settings.security.strength.weak',
  fair: 'settings.security.strength.fair',
  strong: 'settings.security.strength.strong',
};

export interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { t } = useI18n();
  if (!password) return null;
  const { score, strength } = scorePassword(password);
  const filled = Math.max(1, score);
  return (
    <div className="flex items-center gap-2 text-xs" aria-live="polite">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn('h-1 flex-1 rounded-full bg-line', i < filled && TONE[strength])}
          />
        ))}
      </div>
      <span className="w-12 text-right text-fg-mute">{t(STRENGTH_KEY[strength])}</span>
    </div>
  );
}
