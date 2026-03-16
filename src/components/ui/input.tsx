'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, hint, id, ...props },
  ref,
): React.ReactElement {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'h-10 w-full rounded-[var(--radius-md)] border bg-surface px-3 text-sm text-foreground',
          'placeholder:text-ink-subtle',
          'transition-colors',
          'focus:outline-2 focus:outline-offset-0 focus:outline-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-negative' : 'border-border hover:border-border-strong',
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-negative" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-sm text-ink-subtle">
          {hint}
        </p>
      )}
    </div>
  );
});
