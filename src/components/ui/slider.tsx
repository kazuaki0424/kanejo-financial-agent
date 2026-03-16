'use client';

import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils/cn';

interface SliderProps {
  label?: string;
  value?: number[];
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
  disabled?: boolean;
  className?: string;
  formatValue?: (value: number) => string;
}

export function Slider({
  label,
  value,
  defaultValue = [0],
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  onValueCommit,
  disabled,
  className,
  formatValue,
}: SliderProps): React.ReactElement {
  const displayValue = value ?? defaultValue;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {(label || formatValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-sm font-medium text-foreground">{label}</span>
          )}
          {formatValue && (
            <span className="text-sm font-medium text-foreground tabular-nums">
              {formatValue(displayValue[0])}
            </span>
          )}
        </div>
      )}
      <SliderPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        min={min}
        max={max}
        step={step}
        onValueChange={onValueChange}
        onValueCommit={onValueCommit}
        disabled={disabled}
        className={cn(
          'relative flex h-5 w-full touch-none select-none items-center',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      >
        <SliderPrimitive.Track
          className="relative h-1.5 w-full grow overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-surface-hover)]"
        >
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            'block h-5 w-5 rounded-[var(--radius-full)] border-2 border-primary bg-surface',
            'transition-shadow',
            'hover:shadow-md',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          )}
          aria-label={label}
        />
      </SliderPrimitive.Root>
    </div>
  );
}
