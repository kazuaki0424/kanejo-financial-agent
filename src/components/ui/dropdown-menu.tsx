'use client';

import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils/cn';

interface DropdownMenuProps {
  children: React.ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps): React.ReactElement {
  return <DropdownPrimitive.Root>{children}</DropdownPrimitive.Root>;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
}

export function DropdownMenuTrigger({ children }: DropdownMenuTriggerProps): React.ReactElement {
  return (
    <DropdownPrimitive.Trigger asChild>
      {children}
    </DropdownPrimitive.Trigger>
  );
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

export function DropdownMenuContent({
  children,
  className,
  align = 'end',
  sideOffset = 4,
}: DropdownMenuContentProps): React.ReactElement {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[180px] overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface p-1 shadow-md',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          className,
        )}
      >
        {children}
      </DropdownPrimitive.Content>
    </DropdownPrimitive.Portal>
  );
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  onSelect?: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

export function DropdownMenuItem({
  children,
  className,
  onSelect,
  disabled,
  destructive,
}: DropdownMenuItemProps): React.ReactElement {
  return (
    <DropdownPrimitive.Item
      onSelect={onSelect}
      disabled={disabled}
      className={cn(
        'flex h-9 cursor-pointer select-none items-center rounded-[var(--radius-sm)] px-3 text-sm outline-none transition-colors',
        'data-[highlighted]:bg-[var(--color-surface-hover)]',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        destructive ? 'text-negative data-[highlighted]:text-negative' : 'text-foreground',
        className,
      )}
    >
      {children}
    </DropdownPrimitive.Item>
  );
}

interface DropdownMenuSeparatorProps {
  className?: string;
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps): React.ReactElement {
  return (
    <DropdownPrimitive.Separator
      className={cn('my-1 h-px bg-border', className)}
    />
  );
}

interface DropdownMenuLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownMenuLabel({ children, className }: DropdownMenuLabelProps): React.ReactElement {
  return (
    <DropdownPrimitive.Label
      className={cn('px-3 py-1.5 text-xs font-medium text-ink-subtle', className)}
    >
      {children}
    </DropdownPrimitive.Label>
  );
}
