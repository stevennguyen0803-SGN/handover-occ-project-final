'use client';

/**
 * Example showing how to register **page-scoped** commands inside the
 * command palette. Drop this snippet inside any client component that
 * lives below `<AppShell>` (or any other `<CommandPaletteProvider>`).
 *
 * In a real handover-detail page the same pattern would register
 * "Acknowledge handover", "Carry forward", "Mark as resolved", etc.,
 * so an OCC user can hit `Cmd+K → ack` instead of scrolling.
 */

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../components/ui/Toast';
import { useRegisterCommands } from '../../hooks/useCommandPalette';
import type { Command } from '../../lib/commands';

interface DetailCommandsProps {
  handoverId: string;
  /** Wire to your real `acknowledgeHandover()` server action. */
  onAcknowledge?: () => Promise<void>;
  /** Wire to your real `carryForward()` server action. */
  onCarryForward?: () => Promise<void>;
}

/**
 * Mounts handover-detail commands. Unmounts → commands disappear from
 * the palette. Pass STABLE callback references (the demo uses
 * `useToast()` from PR #2 to keep the stub self-contained).
 */
export function HandoverDetailCommands({ handoverId, onAcknowledge, onCarryForward }: DetailCommandsProps) {
  const router = useRouter();
  const { push } = useToast();

  const commands = useMemo<ReadonlyArray<Command>>(() => {
    return [
      {
        id: `handover.${handoverId}.acknowledge`,
        titleKey: 'detail.acknowledge',
        group: 'actions',
        keywords: ['ack', 'sign off'],
        kbd: { key: 'A' },
        icon: '✓',
        run: async () => {
          if (!onAcknowledge) {
            push({ tone: 'default', title: 'No acknowledge handler wired.' });
            return;
          }
          await onAcknowledge();
        },
      },
      {
        id: `handover.${handoverId}.carryForward`,
        titleKey: 'detail.carryForward',
        group: 'actions',
        keywords: ['carry', 'next shift'],
        icon: '↪',
        run: async () => {
          if (!onCarryForward) {
            push({ tone: 'default', title: 'No carry-forward handler wired.' });
            return;
          }
          await onCarryForward();
        },
      },
      {
        id: `handover.${handoverId}.exportCsv`,
        titleKey: 'detail.exportCsv',
        group: 'actions',
        keywords: ['download'],
        icon: '⬇',
        run: () => router.push(`/api/v1/handovers/${handoverId}/export.csv`),
      },
    ];
  }, [handoverId, onAcknowledge, onCarryForward, push, router]);

  useRegisterCommands(commands);
  return null;
}
