'use client';

import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { formatCurrency, parseCurrencyString } from '@/lib/utils/format';

interface CurrencyInputProps {
  label?: string;
  name: string;
  defaultValue?: number;
  error?: string;
  hint?: string;
  min?: number;
  max?: number;
  required?: boolean;
  onChange?: (value: number) => void;
}

export function CurrencyInput({
  label,
  name,
  defaultValue = 0,
  error,
  hint,
  min,
  max,
  required,
  onChange,
}: CurrencyInputProps): React.ReactElement {
  const [displayValue, setDisplayValue] = useState(
    defaultValue > 0 ? formatCurrency(defaultValue) : '',
  );
  const [numericValue, setNumericValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = label?.toLowerCase().replace(/\s+/g, '-');

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const raw = e.target.value;

      // Allow only digits and commas
      const cleaned = raw.replace(/[^\d,，]/g, '');
      const numeric = parseCurrencyString(cleaned);

      if (max !== undefined && numeric > max) return;

      setNumericValue(numeric);
      setDisplayValue(numeric > 0 ? formatCurrency(numeric) : cleaned);
      onChange?.(numeric);
    },
    [max, onChange],
  );

  const handleBlur = useCallback((): void => {
    if (numericValue > 0) {
      setDisplayValue(formatCurrency(numericValue));
    } else {
      setDisplayValue('');
    }
  }, [numericValue]);

  const handleFocus = useCallback((): void => {
    if (numericValue > 0) {
      setDisplayValue(numericValue.toString());
    }
  }, [numericValue]);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">¥</span>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder="0"
          required={required}
          className={cn(
            'h-10 w-full rounded-[var(--radius-md)] border bg-surface pl-7 pr-3 text-sm text-foreground tabular-nums',
            'placeholder:text-ink-subtle',
            'transition-colors',
            'focus:outline-2 focus:outline-offset-0 focus:outline-primary',
            error ? 'border-negative' : 'border-border hover:border-border-strong',
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
        />
      </div>
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={numericValue} />
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
}
