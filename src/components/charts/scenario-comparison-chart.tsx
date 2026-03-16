'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/utils/format';

const SCENARIO_COLORS = [
  'var(--color-primary)',
  'var(--chart-3)',
  'var(--chart-5)',
] as const;

const SCENARIO_DASH = [
  undefined,
  '8 4',
  '4 4',
] as const;

interface ScenarioLine {
  name: string;
  data: Array<{ age: number; netWorth: number }>;
}

interface ScenarioComparisonChartProps {
  scenarios: ScenarioLine[];
}

export function ScenarioComparisonChart({ scenarios }: ScenarioComparisonChartProps): React.ReactElement {
  // Merge all scenario data by age
  const mergedData: Array<Record<string, number>> = [];
  const allAges = new Set<number>();

  for (const s of scenarios) {
    for (const d of s.data) {
      allAges.add(d.age);
    }
  }

  const sortedAges = Array.from(allAges).sort((a, b) => a - b);

  for (const age of sortedAges) {
    const point: Record<string, number> = { age };
    for (const s of scenarios) {
      const match = s.data.find((d) => d.age === age);
      if (match) {
        point[s.name] = match.netWorth;
      }
    }
    mergedData.push(point);
  }

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={mergedData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          <Tooltip content={<ComparisonTooltip scenarioNames={scenarios.map((s) => s.name)} />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => (
              <span className="text-xs text-ink-muted">{value}</span>
            )}
          />
          {scenarios.map((s, i) => (
            <Line
              key={s.name}
              type="monotone"
              dataKey={s.name}
              stroke={SCENARIO_COLORS[i % SCENARIO_COLORS.length]}
              strokeWidth={2}
              strokeDasharray={SCENARIO_DASH[i % SCENARIO_DASH.length]}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, fill: 'var(--color-surface)' }}
            />
          ))}
        </LineChart>
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

function ComparisonTooltip({
  active,
  payload,
  label,
  scenarioNames,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
  scenarioNames: string[];
}): React.ReactElement | null {
  if (!active || !payload) return null;

  // Calculate diff between first two scenarios if available
  const values = scenarioNames.map((name) => {
    const match = payload.find((p) => p.name === name);
    return match?.value ?? 0;
  });
  const hasDiff = values.length >= 2;
  const diff = hasDiff ? values[0] - values[1] : 0;

  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 shadow-md">
      <p className="mb-2 text-xs font-medium text-ink-muted">{label}歳</p>
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.name} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
              <span className="text-xs text-ink-muted">{p.name}</span>
            </div>
            <span className="text-xs font-medium tabular-nums text-foreground">
              ¥{formatCurrency(p.value)}
            </span>
          </div>
        ))}
        {hasDiff && diff !== 0 && (
          <div className="border-t border-border pt-1">
            <div className="flex items-center justify-between gap-6">
              <span className="text-xs text-ink-muted">差額</span>
              <span className={`text-xs font-medium tabular-nums ${diff > 0 ? 'text-positive' : 'text-negative'}`}>
                {diff > 0 ? '+' : '-'}¥{formatCurrency(Math.abs(diff))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
