'use client';

import { createContext, createElement, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface ToastItem {
  id: number;
  title: ReactNode;
  body?: ReactNode;
  tone?: 'default' | 'success' | 'warn' | 'error';
}

interface ToastValue {
  push: (item: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

const TONE_CLASSES: Record<NonNullable<ToastItem['tone']>, string> = {
  default: 'border-line bg-bg-elev text-fg',
  success: 'border-status-resolved bg-status-resolved-bg text-priority-low-fg',
  warn: 'border-status-open bg-status-open-bg text-priority-high-fg',
  error: 'border-priority-critical bg-priority-critical-bg text-priority-critical-fg',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const push = useCallback<ToastValue['push']>((item) => {
    counter.current += 1;
    const id = counter.current;
    setItems((prev) => [...prev, { ...item, id }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }, 3500);
  }, []);

  const value = useMemo<ToastValue>(() => ({ push }), [push]);

  return createElement(
    ToastContext.Provider,
    { value },
    children,
    createElement(
      'div',
      {
        key: 'toast-region',
        className: 'pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2',
        role: 'status',
        'aria-live': 'polite',
      },
      ...items.map((item) =>
        createElement(
          'div',
          {
            key: item.id,
            className: cn(
              'pointer-events-auto min-w-[240px] rounded-md border px-4 py-3 shadow-elev',
              TONE_CLASSES[item.tone ?? 'default']
            ),
          },
          createElement('div', { className: 'text-sm font-semibold' }, item.title),
          item.body ? createElement('div', { className: 'mt-0.5 text-xs opacity-80' }, item.body) : null
        )
      )
    )
  );
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>.');
  return ctx;
}
