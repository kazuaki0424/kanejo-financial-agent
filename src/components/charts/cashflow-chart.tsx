'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import { formatCurrency } from '@/lib/utils/format';
import type { YearlyProjection } from '@/lib/utils/cashflow-engine';

interface CashflowChartProps {
  projections: YearlyProjection[];
  mode: 'cashflow' | 'networth';
}

export function CashflowChart({ projections, mode }: CashflowChartProps): React.ReactElement {
  const eventYears = projections.filter((p) => p.events.length > 0);

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        {mode === 'cashflow' ? (
          <AreaChart data={projections} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-positive)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--color-positive)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-negative)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--color-negative)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="age"
              tick={{ fontSize: 11, fill: 'var(--color-ink-subtle)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickFormatter={(v: number) => `${v}歳`}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--color-ink-subtle)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxisValue}
              width={52}
            />
            <Tooltip content={<CashflowTooltip />} />
            <Area
              type="monotone"
              dataKey="income"
              name="収入"
              stroke="var(--color-positive)"
              fill="url(#gradIncome)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="支出"
              stroke="var(--color-negative)"
              fill="url(#gradExpense)"
              strokeWidth={2}
            />
            {/* Event markers */}
            {eventYears.map((p) => (
              <ReferenceLine
                key={p.age}
                x={p.age}
                stroke="var(--color-ink-subtle)"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            ))}
          </AreaChart>
        ) : (
          <AreaChart data={projections} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradNetWorth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradNegative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-negative)" stopOpacity={0} />
                <stop offset="100%" stopColor="var(--color-negative)" stopOpacity={0.15} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="age"
              tick={{ fontSize: 11, fill: 'var(--color-ink-subtle)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickFormatter={(v: number) => `${v}歳`}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--color-ink-subtle)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxisValue}
              width={52}
            />
            <Tooltip content={<NetWorthTooltip />} />
            <ReferenceLine y={0} stroke="var(--color-border)" strokeWidth={1.5} />
            <Area
              type="monotone"
              dataKey="netWorth"
              name="純資産"
              stroke="var(--color-primary)"
              fill="url(#gradNetWorth)"
              strokeWidth={2}
            />
            {/* Event markers as dots */}
            {eventYears.map((p) => (
              <ReferenceDot
                key={p.age}
                x={p.age}
                y={p.netWorth}
                r={4}
                fill="var(--color-surface)"
                stroke="var(--color-primary)"
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function formatYAxisValue(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(0)}億`;
  if (abs >= 10_000) return `${sign}${(abs / 10_000).toFixed(0)}万`;
  return `${sign}${abs}`;
}

interface TooltipPayload {
  age: number;
  year: number;
  income: number;
  expenses: number;
  savings: number;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  investmentReturn: number;
  events: string[];
}

function CashflowTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: TooltipPayload }>;
}): React.ReactElement | null {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 shadow-md">
      <p className="mb-2 text-xs font-medium text-ink-muted">
        {d.age}歳（{d.year}年）
        {d.events.length > 0 && (
          <span className="ml-1 text-primary">● {d.events.join(', ')}</span>
        )}
      </p>
      <div className="space-y-1">
        <TooltipRow label="収入" value={d.income} color="text-positive" />
        <TooltipRow label="支出" value={d.expenses} color="text-negative" />
        <div className="border-t border-border pt-1">
          <TooltipRow
            label="差額"
            value={d.savings}
            color={d.savings >= 0 ? 'text-positive' : 'text-negative'}
            signed
          />
        </div>
      </div>
    </div>
  );
}

function NetWorthTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: TooltipPayload }>;
}): React.ReactElement | null {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 shadow-md">
      <p className="mb-2 text-xs font-medium text-ink-muted">
        {d.age}歳（{d.year}年）
        {d.events.length > 0 && (
          <span className="ml-1 text-primary">● {d.events.join(', ')}</span>
        )}
      </p>
      <div className="space-y-1">
        <TooltipRow label="純資産" value={d.netWorth} color={d.netWorth >= 0 ? 'text-foreground' : 'text-negative'} signed />
        <TooltipRow label="総資産" value={d.totalAssets} color="text-foreground" />
        <TooltipRow label="総負債" value={d.totalLiabilities} color="text-negative" />
        <div className="border-t border-border pt-1">
          <TooltipRow label="投資リターン" value={d.investmentReturn} color="text-ink-muted" signed />
        </div>
      </div>
    </div>
  );
}

function TooltipRow({
  label,
  value,
  color,
  signed,
}: {
  label: string;
  value: number;
  color: string;
  signed?: boolean;
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-xs text-ink-muted">{label}</span>
      <span className={`text-xs font-medium tabular-nums ${color}`}>
        {signed && value > 0 ? '+' : ''}{signed && value < 0 ? '-' : ''}¥{formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}
