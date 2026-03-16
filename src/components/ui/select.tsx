'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '@/lib/utils/cn';

interface SelectProps {
  label?: string;
  placeholder?: string;
  error?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Select({
  label,
  placeholder = '選択してください',
  error,
  value,
  defaultValue,
  onValueChange,
  children,
  disabled,
}: SelectProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-sm font-medium text-foreground">{label}</span>
      )}
      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          className={cn(
            'inline-flex h-10 w-full items-center justify-between rounded-[var(--radius-md)] border bg-surface px-3 text-sm text-foreground',
            'placeholder:text-ink-subtle',
            'transition-colors',
            'focus:outline-2 focus:outline-offset-0 focus:outline-primary',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[placeholder]:text-ink-subtle',
            error ? 'border-negative' : 'border-border hover:border-border-strong',
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDownIcon />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className={cn(
              'z-50 overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface shadow-md',
              'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            )}
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className="p-1">
              {children}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error && (
        <p className="text-sm text-negative" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function SelectItem({ value, children, disabled }: SelectItemProps): React.ReactElement {
  return (
    <SelectPrimitive.Item
      value={value}
      disabled={disabled}
      className={cn(
        'relative flex h-9 cursor-pointer select-none items-center rounded-[var(--radius-sm)] px-3 pr-8 text-sm text-foreground outline-none',
        'data-[highlighted]:bg-[var(--color-surface-hover)]',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      )}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2">
        <CheckIcon />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function ChevronDownIcon(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
