'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  IDECO_LIMITS,
  NISA_TSUMITATE_ANNUAL,
  NISA_GROWTH_ANNUAL,
  NISA_LIFETIME_LIMIT,
  RETURN_RATES,
  type ReturnRateKey,
  simulateInvestment,
  calculateIdecoTaxSaving,
  calculateNisaTaxSaving,
} from '@/lib/constants/investment-plans';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface InvestmentSimulatorProps {
  currentAge: number;
  occupation: string;
  annualSalary: number;
  tier: string;
  incomeTaxRate: number;
}

export function InvestmentSimulator({
  currentAge,
  occupation,
  annualSalary,
  tier,
  incomeTaxRate,
}: InvestmentSimulatorProps): React.ReactElement {
  // iDeCo
  const idecoRule = IDECO_LIMITS.find((r) => r.occupation === occupation) ?? IDECO_LIMITS[0];
  const [idecoMonthly, setIdecoMonthly] = useState(idecoRule.monthlyLimit);

  // NISA
  const [nisaTsumitateMonthly, setNisaTsumitateMonthly] = useState(
    Math.min(50_000, Math.floor(annualSalary * 0.05 / 12 / 1000) * 1000),
  );
  const [nisaGrowthMonthly, setNisaGrowthMonthly] = useState(0);

  // Shared
  const yearsToRetirement = Math.max(5, 65 - currentAge);
  const [years, setYears] = useState(Math.min(30, yearsToRetirement));
  const [returnRate, setReturnRate] = useState<ReturnRateKey>(
    tier === 'high_end' ? 'growth' : tier === 'middle' ? 'balanced' : 'conservative',
  );

  const rate = RETURN_RATES[returnRate].rate;

  // Simulations
  const idecoSim = useMemo(
    () => simulateInvestment(idecoMonthly, years, rate),
    [idecoMonthly, years, rate],
  );
  const nisaTsumitateSim = useMemo(
    () => simulateInvestment(nisaTsumitateMonthly, years, rate),
    [nisaTsumitateMonthly, years, rate],
  );
  const nisaGrowthSim = useMemo(
    () => simulateInvestment(nisaGrowthMonthly, years, rate),
    [nisaGrowthMonthly, years, rate],
  );

  // Tax savings
  const annualIdecoTaxSaving = calculateIdecoTaxSaving(idecoMonthly * 12, incomeTaxRate);
  const lifetimeIdecoTaxSaving = annualIdecoTaxSaving * years;
  const nisaTotalReturn = nisaTsumitateSim.totalReturn + nisaGrowthSim.totalReturn;
  const nisaTaxSaving = calculateNisaTaxSaving(nisaTotalReturn);

  // Total
  const totalMonthly = idecoMonthly + nisaTsumitateMonthly + nisaGrowthMonthly;
  const totalFinalValue = idecoSim.finalValue + nisaTsumitateSim.finalValue + nisaGrowthSim.finalValue;
  const totalContribution = idecoSim.totalContribution + nisaTsumitateSim.totalContribution + nisaGrowthSim.totalContribution;
  const totalTaxSaving = lifetimeIdecoTaxSaving + nisaTaxSaving;

  // Chart data
  const chartData = idecoSim.yearly.map((y, i) => ({
    year: y.year,
    age: currentAge + y.year,
    ideco: y.value,
    nisaTsumitate: nisaTsumitateSim.yearly[i]?.value ?? 0,
    nisaGrowth: nisaGrowthSim.yearly[i]?.value ?? 0,
    contribution: y.cumulativeContribution + (nisaTsumitateSim.yearly[i]?.cumulativeContribution ?? 0) + (nisaGrowthSim.yearly[i]?.cumulativeContribution ?? 0),
  }));

  return (
    <div className="space-y-6">
      {/* サマリー */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-[11px] text-ink-muted">月額積立</p>
          <p className="mt-1 font-display text-xl tabular-nums text-foreground">
            ¥{formatCurrency(totalMonthly)}
          </p>
        </Card>
        <Card>
          <p className="text-[11px] text-ink-muted">{years}年後の評価額</p>
          <p className="mt-1 font-display text-xl tabular-nums text-primary">
            ¥{formatCurrency(totalFinalValue)}
          </p>
        </Card>
        <Card>
          <p className="text-[11px] text-ink-muted">運用益</p>
          <p className="mt-1 font-display text-xl tabular-nums text-positive">
            +¥{formatCurrency(totalFinalValue - totalContribution)}
          </p>
        </Card>
        <Card>
          <p className="text-[11px] text-ink-muted">節税効果（累計）</p>
          <p className="mt-1 font-display text-xl tabular-nums text-primary">
            ¥{formatCurrency(totalTaxSaving)}
          </p>
        </Card>
      </div>

      {/* 資産推移チャート */}
      <Card>
        <CardHeader>
          <CardTitle>資産推移</CardTitle>
        </CardHeader>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradIdeco" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradTsumitate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="age"
                tick={{ fontSize: 11, fill: 'var(--color-ink-subtle)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-border)' }}
                tickFormatter={(v: number) => `${v}歳`}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-ink-subtle)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={fmtAxis}
                width={52}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="ideco" name="iDeCo" stackId="1" stroke="var(--chart-1)" fill="url(#gradIdeco)" strokeWidth={2} />
              <Area type="monotone" dataKey="nisaTsumitate" name="つみたて" stackId="1" stroke="var(--chart-2)" fill="url(#gradTsumitate)" strokeWidth={2} />
              {nisaGrowthMonthly > 0 && (
                <Area type="monotone" dataKey="nisaGrowth" name="成長投資" stackId="1" stroke="var(--chart-3)" fill="url(#gradGrowth)" strokeWidth={2} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center justify-center gap-4">
          <Legend color="var(--chart-1)" label="iDeCo" />
          <Legend color="var(--chart-2)" label="つみたて投資枠" />
          {nisaGrowthMonthly > 0 && <Legend color="var(--chart-3)" label="成長投資枠" />}
        </div>
      </Card>

      {/* パラメータ調整 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* iDeCo */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>iDeCo</CardTitle>
              <Badge variant="primary">節税 ¥{formatCurrency(annualIdecoTaxSaving)}/年</Badge>
            </div>
            <CardDescription>{idecoRule.label} — 上限 ¥{formatCurrency(idecoRule.monthlyLimit)}/月</CardDescription>
          </CardHeader>
          <Slider
            label="月額掛金"
            value={[idecoMonthly]}
            min={5_000}
            max={idecoRule.monthlyLimit}
            step={1_000}
            onValueChange={([v]) => setIdecoMonthly(v)}
            formatValue={(v) => `¥${formatCurrency(v)}`}
          />
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] px-3 py-2">
              <p className="text-ink-subtle">年間掛金</p>
              <p className="font-medium tabular-nums text-foreground">¥{formatCurrency(idecoMonthly * 12)}</p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] px-3 py-2">
              <p className="text-ink-subtle">{years}年後評価額</p>
              <p className="font-medium tabular-nums text-foreground">¥{formatCurrency(idecoSim.finalValue)}</p>
            </div>
          </div>
        </Card>

        {/* NISA */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>新NISA</CardTitle>
              <Badge variant="primary">非課税 ¥{formatCurrency(nisaTaxSaving)}</Badge>
            </div>
            <CardDescription>生涯非課税枠 1,800万円</CardDescription>
          </CardHeader>
          <div className="space-y-4">
            <Slider
              label="つみたて投資枠"
              value={[nisaTsumitateMonthly]}
              min={0}
              max={100_000}
              step={5_000}
              onValueChange={([v]) => setNisaTsumitateMonthly(v)}
              formatValue={(v) => `¥${formatCurrency(v)}/月`}
            />
            <Slider
              label="成長投資枠"
              value={[nisaGrowthMonthly]}
              min={0}
              max={200_000}
              step={10_000}
              onValueChange={([v]) => setNisaGrowthMonthly(v)}
              formatValue={(v) => `¥${formatCurrency(v)}/月`}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] px-3 py-2">
              <p className="text-ink-subtle">年間投資額</p>
              <p className="font-medium tabular-nums text-foreground">
                ¥{formatCurrency((nisaTsumitateMonthly + nisaGrowthMonthly) * 12)}
              </p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] px-3 py-2">
              <p className="text-ink-subtle">{years}年後評価額</p>
              <p className="font-medium tabular-nums text-foreground">
                ¥{formatCurrency(nisaTsumitateSim.finalValue + nisaGrowthSim.finalValue)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 共通パラメータ */}
      <Card>
        <CardHeader>
          <CardTitle>運用条件</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <Slider
            label="積立期間"
            value={[years]}
            min={5}
            max={40}
            step={1}
            onValueChange={([v]) => setYears(v)}
            formatValue={(v) => `${v}年（${currentAge + v}歳まで）`}
          />

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">想定利回り</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.entries(RETURN_RATES) as Array<[ReturnRateKey, typeof RETURN_RATES[ReturnRateKey]]>).map(([key, val]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setReturnRate(key)}
                  className={cn(
                    'rounded-[var(--radius-md)] border px-3 py-2 text-left text-xs transition-colors',
                    returnRate === key
                      ? 'border-primary bg-primary-light font-medium text-primary'
                      : 'border-border text-foreground hover:bg-[var(--color-surface-hover)]',
                  )}
                >
                  <p className="font-medium">{val.label} ({(val.rate * 100).toFixed(0)}%)</p>
                  <p className="mt-0.5 text-[10px] text-ink-subtle">{val.description}</p>
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </Card>
    </div>
  );
}

function fmtAxis(value: number): string {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(0)}億`;
  if (value >= 10_000) return `${(value / 10_000).toFixed(0)}万`;
  return String(value);
}

function Legend({ color, label }: { color: string; label: string }): React.ReactElement {
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      <span className="text-xs text-ink-muted">{label}</span>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; payload: { age: number; contribution: number } }>;
}): React.ReactElement | null {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const total = payload.reduce((s, p) => s + p.value, 0);

  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 shadow-md">
      <p className="mb-2 text-xs font-medium text-ink-muted">{d.age}歳</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: p.color }} />
            <span className="text-ink-muted">{p.name}</span>
          </div>
          <span className="tabular-nums text-foreground">¥{formatCurrency(p.value)}</span>
        </div>
      ))}
      <div className="mt-1 border-t border-border pt-1 flex justify-between text-xs">
        <span className="text-ink-muted">合計</span>
        <span className="font-medium tabular-nums text-foreground">¥{formatCurrency(total)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-ink-muted">積立額</span>
        <span className="tabular-nums text-ink-subtle">¥{formatCurrency(d.contribution)}</span>
      </div>
    </div>
  );
}
