'use client';

import { useRouter } from 'next/navigation';
import { useI18n } from '../../hooks/useI18n';
import { KpiCard } from '../ui/KpiCard';
import type { DashboardSummary } from '../../lib/types';

export interface DashboardKpisProps {
  summary: DashboardSummary;
}

/**
 * Top-of-dashboard KPI grid. Each card is clickable and deep-links to
 * the appropriate filtered Handover Log query, mirroring the prototype's
 * behaviour. Numbers come straight from the server-side
 * `GET /api/v1/dashboard/summary` response.
 */
export function DashboardKpis({ summary }: DashboardKpisProps) {
  const router = useRouter();
  const { t } = useI18n();

  const go = (qs: string) => router.push(`/log?${qs}`);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
      <KpiCard
        kind="active"
        label={t('kpi.totalHandovers')}
        value={summary.totalHandovers}
        hint={`${summary.openHandovers} open`}
        onClick={() => go('')}
      />
      <KpiCard
        kind="alert"
        label={t('kpi.highPriority')}
        value={summary.highOrCritical}
        hint={`/ ${summary.totalHandovers}`}
        onClick={() => go('priority=High,Critical')}
      />
      <KpiCard
        kind="issues"
        label={t('kpi.aircraftIssues')}
        value={summary.aircraftIssues}
        hint="Aircraft items"
        onClick={() => go('category=aircraft')}
      />
      <KpiCard
        kind="active"
        label={t('kpi.openMonitoring')}
        value={summary.openHandovers}
        hint="Not yet resolved"
        onClick={() => go('status=Open,Monitoring')}
      />
      <KpiCard
        kind="opsImpact"
        label={t('kpi.flightsAffected')}
        value={summary.flightsAffected}
        hint="Operational impact"
        onClick={() => go('hasFlightsAffected=1')}
      />
      <KpiCard
        kind={summary.awaitingAcknowledgment > 0 ? 'opsImpact' : 'ok'}
        label={t('kpi.awaitingAck')}
        value={summary.awaitingAcknowledgment}
        hint="Needs immediate attention"
        onClick={() => go('priority=Critical&unack=1')}
      />
      <KpiCard
        kind="trace"
        label={t('kpi.carryForward')}
        value={summary.carriedForwardCount}
        hint="Has inherited items"
        onClick={() => go('carriedForwardOnly=true')}
      />
    </div>
  );
}
