'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils/cn';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps): React.ReactElement {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogPrimitive.Root>
  );
}

export function DialogTrigger({
  children,
  ...props
}: DialogPrimitive.DialogTriggerProps): React.ReactElement {
  return (
    <DialogPrimitive.Trigger asChild {...props}>
      {children}
    </DialogPrimitive.Trigger>
  );
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  title: string;
  description?: string;
}

export function DialogContent({
  children,
  className,
  title,
  description,
}: DialogContentProps): React.ReactElement {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          'fixed inset-0 z-50 bg-black/40',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          'fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
          'rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-lg',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'focus:outline-none',
          className,
        )}
      >
        <DialogPrimitive.Title className="text-lg font-medium text-foreground">
          {title}
        </DialogPrimitive.Title>
        {description && (
          <DialogPrimitive.Description className="mt-1 text-sm text-ink-muted">
            {description}
          </DialogPrimitive.Description>
        )}
        <div className="mt-4">{children}</div>
        <DialogPrimitive.Close
          className={cn(
            'absolute top-4 right-4 inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)]',
            'text-ink-muted hover:bg-[var(--color-surface-hover)] hover:text-foreground',
            'transition-colors focus:outline-2 focus:outline-primary',
          )}
          aria-label="閉じる"
        >
          <CloseIcon />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function CloseIcon(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
