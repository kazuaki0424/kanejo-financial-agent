'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

interface AnimatedMetricCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change?: number;
  format?: 'currency' | 'percent' | 'score';
}

function formatAnimatedValue(value: number, format: 'currency' | 'percent' | 'score'): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('ja-JP').format(Math.round(value));
    case 'percent':
      return Math.round(value).toString();
    case 'score':
      return Math.round(value).toString();
  }
}

export function AnimatedMetricCard({
  label,
  value,
  prefix = '',
  suffix = '',
  change,
  format = 'currency',
}: AnimatedMetricCardProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    if (!isInView) return;

    const controls = animate(0, value, {
      duration: 0.8,
      ease: [0.32, 0.72, 0, 1],
      onUpdate(latest) {
        setDisplayValue(formatAnimatedValue(latest, format));
      },
    });

    return () => controls.stop();
  }, [isInView, value, format]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden">
        <p className="text-[13px] text-ink-muted">{label}</p>
        <p className="mt-1 font-display text-[32px] leading-tight text-foreground tabular-nums">
          {prefix}{displayValue}
          {suffix && <span className="text-lg text-ink-muted">{suffix}</span>}
        </p>
        {change !== undefined && change !== 0 && (
          <div className="mt-2 flex items-center gap-1">
            <ChangeArrow positive={change > 0} />
            <span
              className={cn(
                'text-sm font-medium',
                change > 0 ? 'text-positive' : 'text-negative',
              )}
            >
              {Math.abs(change)}%
            </span>
            <span className="text-xs text-ink-subtle">前月比</span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function ChangeArrow({ positive }: { positive: boolean }): React.ReactElement {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={positive ? 'text-positive' : 'text-negative'}
      aria-hidden="true"
    >
      <path
        d={positive ? 'M6 9V3M6 3L3 6M6 3L9 6' : 'M6 3V9M6 9L3 6M6 9L9 6'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
