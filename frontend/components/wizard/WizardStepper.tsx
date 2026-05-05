'use client';

import { cn } from '../../lib/cn';

export interface WizardStep {
  id: string;
  label: string;
}

export interface WizardStepperProps {
  steps: WizardStep[];
  currentIndex: number;
  onStepClick?: (index: number) => void;
}

export function WizardStepper({ steps, currentIndex, onStepClick }: WizardStepperProps) {
  return (
    <ol className="flex items-center gap-3 text-sm">
      {steps.map((step, idx) => {
        const reached = idx <= currentIndex;
        const isCurrent = idx === currentIndex;
        return (
          <li key={step.id} className="flex items-center gap-3">
            <button
              type="button"
              disabled={!onStepClick || idx > currentIndex}
              onClick={() => onStepClick?.(idx)}
              className={cn(
                'inline-flex items-center gap-2 rounded-pill border px-3 py-1 transition',
                isCurrent && 'border-accent bg-accent text-accent-fg',
                !isCurrent && reached && 'border-accent text-accent',
                !reached && 'border-line text-fg-mute'
              )}
            >
              <span
                className={cn(
                  'inline-grid h-5 w-5 place-items-center rounded-full text-xs font-bold',
                  isCurrent || reached ? 'bg-accent-fg text-accent' : 'bg-bg-row text-fg-mute'
                )}
              >
                {idx + 1}
              </span>
              <span>{step.label}</span>
            </button>
            {idx < steps.length - 1 && <span className="text-fg-faint" aria-hidden="true">→</span>}
          </li>
        );
      })}
    </ol>
  );
}
