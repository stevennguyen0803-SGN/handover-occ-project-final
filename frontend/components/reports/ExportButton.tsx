'use client';

import { useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { useToast } from '../ui/Toast';
import type { ExportFormat, ReportFiltersValue } from '../../lib/types';

export interface ExportButtonProps {
  filters: ReportFiltersValue;
  /**
   * Async export action. Should call the appropriate API endpoint and
   * trigger a download. The simplest implementation builds a URL with
   * the filters and sets `window.location.href` (the server returns the
   * file with `Content-Disposition: attachment`).
   *
   * - PDF: `GET /api/v1/handovers/:id/export/pdf` (per-handover; filters
   *        not used at this level, see ExportButton on detail page)
   * - CSV: `GET /api/v1/handovers/export/csv?{filters}`
   */
  exportTo: (format: ExportFormat, filters: ReportFiltersValue) => Promise<void>;
  /** Disable the PDF option when this button is used at list level. Default: PDF disabled. */
  allowPdf?: boolean;
  /** Optional print-the-current-view action (uses `window.print()` typically). */
  onPrint?: () => void;
  className?: string;
}

/**
 * Split-button for exporting reports. The dropdown lets the operator pick
 * a format; PDF is hidden at list level (PDF is per-handover only — see
 * `shared/API_SPEC.md` Export section).
 */
export function ExportButton({
  filters,
  exportTo,
  allowPdf = false,
  onPrint,
  className,
}: ExportButtonProps) {
  const { t } = useI18n();
  const { push } = useToast();
  const [pending, setPending] = useState<ExportFormat | 'print' | null>(null);

  const run = async (format: ExportFormat) => {
    if (pending) return;
    setPending(format);
    push({ tone: 'default', title: t('toast.exportStarted') });
    try {
      await exportTo(format, filters);
      push({ tone: 'success', title: t('toast.exportReady') });
    } catch (err) {
      push({
        tone: 'error',
        title: t('toast.exportFailed'),
        body: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setPending(null);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => run('csv')}
        disabled={pending !== null}
        className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:bg-accent-strong disabled:opacity-50"
      >
        {pending === 'csv' ? '…' : t('reports.export.csv')}
      </button>

      {allowPdf && (
        <button
          type="button"
          onClick={() => run('pdf')}
          disabled={pending !== null}
          className="rounded-md border border-line px-3 py-1.5 text-sm text-fg-soft hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {pending === 'pdf' ? '…' : t('reports.export.pdf')}
        </button>
      )}

      {onPrint && (
        <button
          type="button"
          onClick={() => {
            setPending('print');
            try {
              onPrint();
            } finally {
              setPending(null);
            }
          }}
          className="rounded-md border border-line px-3 py-1.5 text-sm text-fg-soft hover:border-accent hover:text-accent"
        >
          {t('reports.print')}
        </button>
      )}
    </div>
  );
}
