'use client';

import { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/utils/format';

interface DonutDataPoint {
  label: string;
  amount: number;
  color: string;
}

interface DonutChartProps {
  data: DonutDataPoint[];
  centerLabel?: string;
  centerValue?: string;
  activeIndex?: number | null;
  onActiveChange?: (index: number | null) => void;
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  activeIndex,
  onActiveChange,
}: DonutChartProps): React.ReactElement {
  const [internalActive, setInternalActive] = useState<number | null>(null);
  const active = activeIndex ?? internalActive;
  const setActive = onActiveChange ?? setInternalActive;

  const activeItem = active !== null ? data[active] : null;

  return (
    <div className="relative h-[200px] w-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={2}
            onMouseEnter={(_, index) => setActive(index)}
            onMouseLeave={() => setActive(null)}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.label}
                fill={entry.color}
                stroke="var(--color-surface)"
                strokeWidth={2}
                opacity={active !== null && active !== index ? 0.35 : 1}
                style={{
                  transform: active === index ? 'scale(1.05)' : 'scale(1)',
                  transformOrigin: 'center',
                  transition: 'opacity 0.15s, transform 0.15s',
                }}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center text */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        {activeItem ? (
          <>
            <span className="text-xs text-ink-muted">{activeItem.label}</span>
            <span className="font-display text-lg text-foreground tabular-nums">
              ¥{formatCurrency(activeItem.amount)}
            </span>
          </>
        ) : (
          <>
            {centerLabel && <span className="text-xs text-ink-muted">{centerLabel}</span>}
            {centerValue && (
              <span className="font-display text-lg text-foreground tabular-nums">{centerValue}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
