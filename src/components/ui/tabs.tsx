'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils/cn';

interface TabsProps extends TabsPrimitive.TabsProps {
  children: React.ReactNode;
}

export function Tabs({ className, children, ...props }: TabsProps): React.ReactElement {
  return (
    <TabsPrimitive.Root className={cn(className)} {...props}>
      {children}
    </TabsPrimitive.Root>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ className, children }: TabsListProps): React.ReactElement {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex items-center gap-1 border-b border-border',
        className,
      )}
    >
      {children}
    </TabsPrimitive.List>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function TabsTrigger({ value, children, className, disabled }: TabsTriggerProps): React.ReactElement {
  return (
    <TabsPrimitive.Trigger
      value={value}
      disabled={disabled}
      className={cn(
        'relative px-4 pb-3 pt-2 text-sm font-medium text-ink-muted transition-colors',
        'hover:text-foreground',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:text-foreground',
        'data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:bottom-0',
        'data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary',
        className,
      )}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps): React.ReactElement {
  return (
    <TabsPrimitive.Content
      value={value}
      className={cn('mt-4 focus:outline-none', className)}
    >
      {children}
    </TabsPrimitive.Content>
  );
}
