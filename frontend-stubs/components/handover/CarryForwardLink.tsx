import Link from 'next/link';

/**
 * Small back-link card shown at the top of a detail page when this
 * handover inherited items from a previous shift (BR-07).
 */
export function CarryForwardLink({ sourceId, sourceReference }: { sourceId: string; sourceReference: string }) {
  return (
    <Link
      href={`/handover/${sourceId}`}
      className="inline-flex items-center gap-2 rounded-md border border-shift bg-shift-bg px-3 py-2 text-sm text-shift-fg hover:opacity-90"
    >
      <span aria-hidden="true">↺</span>
      <span>
        Carried from previous shift —{' '}
        <span className="font-mono font-semibold">{sourceReference}</span>
      </span>
    </Link>
  );
}
