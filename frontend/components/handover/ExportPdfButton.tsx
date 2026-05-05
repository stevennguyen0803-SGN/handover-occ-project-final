'use client'

import { cn } from '@/lib/cn'

interface ExportPdfButtonProps {
  /** Handover id used to compose the export URL. */
  handoverId: string
  /** Optional className for layout overrides. */
  className?: string
}

/**
 * Opens the per-handover printable HTML in a new tab. The frontend
 * proxy at `/api/v1/handovers/[id]/export/pdf?autoPrint=1` injects a
 * `window.print()` so the user can immediately Save-as-PDF without an
 * extra Ctrl/Cmd+P keystroke.
 *
 * Per BR-14 we never expose a list-level PDF — exports are always
 * scoped to a single handover.
 */
export function ExportPdfButton({
  handoverId,
  className,
}: ExportPdfButtonProps) {
  return (
    <a
      href={`/api/v1/handovers/${encodeURIComponent(handoverId)}/export/pdf?autoPrint=1`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-line bg-bg-elev px-3 py-1.5 text-xs font-medium text-fg hover:bg-bg-row',
        className
      )}
    >
      Export PDF
    </a>
  )
}
