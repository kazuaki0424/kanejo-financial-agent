'use client';

import * as ToastPrimitive from '@radix-ui/react-toast';
import { createContext, useCallback, useContext, useState } from 'react';
import { cn } from '@/lib/utils/cn';

const VARIANT_STYLES = {
  default: 'border-border bg-surface',
  success: 'border-[var(--color-positive)] bg-positive-bg',
  error: 'border-[var(--color-negative)] bg-negative-bg',
  warning: 'border-[var(--color-warning)] bg-warning-bg',
} as const;

type ToastVariant = keyof typeof VARIANT_STYLES;

interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (data: Omit<ToastData, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps): React.ReactElement {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const toast = useCallback((data: Omit<ToastData, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...data, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right" duration={4000}>
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            open
            onOpenChange={(open) => {
              if (!open) removeToast(t.id);
            }}
            className={cn(
              'flex items-start gap-3 rounded-[var(--radius-md)] border p-4 shadow-md',
              'data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full data-[state=open]:fade-in-0',
              'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full data-[state=closed]:fade-out-0',
              'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
              'data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform',
              'data-[swipe=end]:animate-out data-[swipe=end]:slide-out-to-right-full',
              VARIANT_STYLES[t.variant ?? 'default'],
            )}
          >
            <div className="flex-1">
              <ToastPrimitive.Title className="text-sm font-medium text-foreground">
                {t.title}
              </ToastPrimitive.Title>
              {t.description && (
                <ToastPrimitive.Description className="mt-1 text-sm text-ink-muted">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close
              className={cn(
                'inline-flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)]',
                'text-ink-muted hover:text-foreground transition-colors',
              )}
              aria-label="閉じる"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex w-[380px] max-w-[calc(100vw-2rem)] flex-col gap-2" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
