'use client';

import { Badge } from './Badge';
import { useI18n } from '../../hooks/useI18n';

/** Renders the acknowledgement state of a handover. */
export function AckBadge({ acknowledgedAt }: { acknowledgedAt: string | null | undefined }) {
  const { t } = useI18n();
  return acknowledgedAt ? (
    <Badge tone="ack-done">● {t('ack.done')}</Badge>
  ) : (
    <Badge tone="ack-awaiting">● {t('ack.awaiting')}</Badge>
  );
}
