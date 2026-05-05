'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useI18n } from '../../hooks/useI18n';

/**
 * Persistent banner shown when 1+ Critical handovers are unacknowledged
 * (BR-08 / BR-10). Pass `count` from the dashboard summary; render
 * conditionally so this banner is removed entirely when count=0 (the
 * dashboard test asserts the banner element is gone, not just hidden).
 */
export interface CriticalBannerProps {
  count: number;
  reviewHref?: string;
}

export function CriticalBanner({ count, reviewHref = '/log?priority=Critical&unack=1' }: CriticalBannerProps) {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(false);
  if (count <= 0 || dismissed) return null;
  return (
    <div className="flex items-start justify-between gap-3 border-b border-priority-critical/30 bg-priority-critical-bg px-4 py-3 text-priority-critical-fg">
      <div className="flex items-start gap-2">
        <span aria-hidden="true">⚠</span>
        <div>
          <div className="text-sm font-semibold">{t('banner.criticalCount', { n: count })}</div>
          <div className="text-xs opacity-80">{t('banner.criticalSub')}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={reviewHref}
          className="rounded-pill bg-priority-critical px-3 py-1.5 text-xs font-semibold text-white shadow-soft hover:opacity-90"
        >
          {t('banner.reviewCta')}
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="rounded-pill px-2 text-priority-critical-fg/70 hover:bg-priority-critical/10"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
