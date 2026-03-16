'use client';

import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils/cn';

const VARIANT_STYLES = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'border border-border bg-transparent text-foreground hover:bg-[var(--color-surface-hover)]',
  ghost: 'bg-transparent text-foreground hover:bg-[var(--color-surface-hover)]',
  danger: 'bg-negative text-white hover:opacity-90',
} as const;

const SIZE_STYLES = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
} as const;

type ButtonVariant = keyof typeof VARIANT_STYLES;
type ButtonSize = keyof typeof SIZE_STYLES;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  asChild = false,
  ...props
}: ButtonProps): React.ReactElement {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors',
        'rounded-[var(--radius-md)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className,
      )}
      {...props}
    />
  );
}
