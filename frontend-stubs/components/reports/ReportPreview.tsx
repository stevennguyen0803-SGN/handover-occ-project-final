'use client';

import { useI18n } from '../../hooks/useI18n';
import { Badge } from '../ui/Badge';
import { PriorityBadge } from '../ui/PriorityBadge';
import { StatusBadge } from '../ui/StatusBadge';
import { EmptyState } from '../ui/EmptyState';
import { formatDate, formatDateTime } from '../../lib/format';
import type { ReportDataset } from '../../lib/types';

export interface ReportPreviewProps {
  dataset: ReportDataset | null;
  /** When true, the preview area renders without page chrome and is print-optimized. */
  printMode?: boolean;
}

/**
 * Print-ready summary of the filtered handover dataset. Wrap the
 * `print-region` class so the print rules in `styles.global.example.css`
 * strip surrounding chrome cleanly.
 */
export function ReportPreview({ dataset, printMode = false }: ReportPreviewProps) {
  const { t } = useI18n();

  if (!dataset || dataset.totalHandovers === 0) {
    return <EmptyState title={t('reports.preview.title')} body={t('reports.preview.empty')} />;
  }

  const range =
    dataset.filters.dateFrom && dataset.filters.dateTo
      ? `${formatDate(dataset.filters.dateFrom)} – ${formatDate(dataset.filters.dateTo)}`
      : dataset.filters.dateFrom
        ? `${formatDate(dataset.filters.dateFrom)} – …`
        : dataset.filters.dateTo
          ? `… – ${formatDate(dataset.filters.dateTo)}`
          : t('common.all');

  return (
    <div
      className={`print-region rounded-md border border-line bg-bg-elev p-5 ${
        printMode ? 'shadow-none' : 'shadow-soft'
      }`}
    >
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
        <div>
          <h2 className="text-xl font-semibold text-fg">{t('reports.title')}</h2>
          <p className="text-xs text-fg-mute">
            {t('reports.preview.generatedAt')}: {formatDateTime(dataset.generatedAt)}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-fg-soft">
          <dt className="text-fg-mute">{t('reports.preview.rangeLabel')}</dt>
          <dd className="font-mono">{range}</dd>
          <dt className="text-fg-mute">{t('reports.preview.totalLabel')}</dt>
          <dd className="font-mono">{dataset.totalHandovers}</dd>
        </dl>
      </header>

      {dataset.totals && (
        <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryCard title={t('reports.preview.coverByShift')} entries={dataset.totals.byShift} />
          <SummaryCard title={t('reports.preview.coverByPriority')} entries={dataset.totals.byPriority} />
          <SummaryCard title={t('reports.preview.coverByStatus')} entries={dataset.totals.byStatus} />
        </section>
      )}

      <section className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase text-fg-mute">
            <tr>
              <th className="px-2 py-1.5">Date</th>
              <th className="px-2 py-1.5">Reference</th>
              <th className="px-2 py-1.5">Shift</th>
              <th className="px-2 py-1.5">Prepared by</th>
              <th className="px-2 py-1.5">Priority</th>
              <th className="px-2 py-1.5">Status</th>
              <th className="px-2 py-1.5">Items O / M / R</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {dataset.rows.map((row) => (
              <tr key={row.id}>
                <td className="px-2 py-1.5 font-mono text-xs">{formatDate(row.handoverDate)}</td>
                <td className="px-2 py-1.5 font-mono text-xs text-fg">{row.referenceId}</td>
                <td className="px-2 py-1.5">
                  <Badge tone="shift">{row.shift}</Badge>
                </td>
                <td className="px-2 py-1.5">{row.preparedBy.name}</td>
                <td className="px-2 py-1.5">
                  <PriorityBadge priority={row.overallPriority} />
                </td>
                <td className="px-2 py-1.5">
                  <StatusBadge status={row.overallStatus} />
                </td>
                <td className="px-2 py-1.5 font-mono text-xs">
                  {row.itemCounts.open} / {row.itemCounts.monitoring} / {row.itemCounts.resolved}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function SummaryCard({ title, entries }: { title: string; entries: Record<string, number> }) {
  const total = Object.values(entries).reduce((a, b) => a + b, 0);
  return (
    <div className="rounded-md border border-line-soft bg-bg-row p-3">
      <div className="mb-1 text-xs uppercase text-fg-mute">{title}</div>
      <ul className="text-sm">
        {Object.entries(entries).map(([k, v]) => (
          <li key={k} className="flex items-baseline justify-between">
            <span className="text-fg-soft">{k}</span>
            <span className="font-mono text-fg">{v}</span>
          </li>
        ))}
        <li className="mt-1 flex items-baseline justify-between border-t border-line-soft pt-1">
          <span className="text-fg-mute">Total</span>
          <span className="font-mono font-semibold text-fg">{total}</span>
        </li>
      </ul>
    </div>
  );
}
