'use client';

import Link from 'next/link';
import { useI18n } from '../../hooks/useI18n';

/**
 * Mobile-first FAB — always reachable from the bottom-right on small
 * screens. Hidden on `md+` because the topbar already exposes "New".
 */
export function FloatingActionButton({ href = '/handover/new' }: { href?: string }) {
  const { t } = useI18n();
  return (
    <Link
      href={href}
      className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-pill bg-accent px-4 py-3 text-sm font-semibold text-accent-fg shadow-elev md:hidden"
      aria-label={t('nav.newHandover')}
    >
      <span aria-hidden="true">＋</span>
      <span className="sr-only">{t('nav.newHandover')}</span>
    </Link>
  );
}
