import { cn } from '@/lib/utils/cn';

const VARIANT_STYLES = {
  default: 'bg-[var(--color-surface-hover)] text-foreground',
  primary: 'bg-primary-light text-primary',
  positive: 'bg-positive-bg text-positive',
  negative: 'bg-negative-bg text-negative',
  warning: 'bg-warning-bg text-warning',
  info: 'bg-info-bg text-info',
} as const;

type BadgeVariant = keyof typeof VARIANT_STYLES;

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  className,
}: BadgeProps): React.ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-medium',
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
