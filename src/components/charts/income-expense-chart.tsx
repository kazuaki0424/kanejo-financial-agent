'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatCurrency } from '@/lib/utils/format';

interface ChartDataPoint {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

interface IncomeExpenseChartProps {
  data: ChartDataPoint[];
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps): React.ReactElement {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          barGap={2}
          onMouseMove={(state) => {
            if (state?.activeTooltipIndex !== undefined && typeof state.activeTooltipIndex === 'number') {
              setActiveIndex(state.activeTooltipIndex);
            }
          }}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: 'var(--color-ink-subtle)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickFormatter={(value: string) => {
              const parts = value.split('/');
              return `${Number(parts[1])}月`;
            }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-ink-subtle)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => {
              if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
              if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
              return String(value);
            }}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-hover)', opacity: 0.5 }} />
          <ReferenceLine y={0} stroke="var(--color-border)" />
          <Bar
            dataKey="income"
            name="収入"
            fill="var(--color-positive)"
            radius={[3, 3, 0, 0]}
            opacity={activeIndex !== null ? 0.4 : 1}
          />
          <Bar
            dataKey="expenses"
            name="支出"
            fill="var(--color-negative)"
            radius={[3, 3, 0, 0]}
            opacity={activeIndex !== null ? 0.4 : 1}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  dataKey: string;
  color: string;
  payload: {
    month: string;
    income: number;
    expenses: number;
    savings: number;
  };
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}): React.ReactElement | null {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  const parts = (label ?? '').split('/');
  const displayMonth = parts.length === 2 ? `${parts[0]}年${Number(parts[1])}月` : label;

  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 shadow-md">
      <p className="mb-2 text-xs font-medium text-ink-muted">{displayMonth}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-positive" />
            <span className="text-xs text-ink-muted">収入</span>
          </div>
          <span className="text-xs font-medium tabular-nums text-foreground">
            ¥{formatCurrency(data.income)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-negative" />
            <span className="text-xs text-ink-muted">支出</span>
          </div>
          <span className="text-xs font-medium tabular-nums text-foreground">
            ¥{formatCurrency(data.expenses)}
          </span>
        </div>
        <div className="mt-1 border-t border-border pt-1">
          <div className="flex items-center justify-between gap-6">
            <span className="text-xs text-ink-muted">差額</span>
            <span
              className={`text-xs font-medium tabular-nums ${data.savings >= 0 ? 'text-positive' : 'text-negative'}`}
            >
              {data.savings >= 0 ? '+' : ''}¥{formatCurrency(data.savings)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
