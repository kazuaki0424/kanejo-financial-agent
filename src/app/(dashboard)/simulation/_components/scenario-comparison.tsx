'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { runSimulation, DEFAULT_PARAMS, type LifeEvent, type SimulationResult } from '@/lib/utils/cashflow-engine';
import { formatCurrency } from '@/lib/utils/format';
import { ScenarioComparisonChart } from '@/components/charts/scenario-comparison-chart';
import { TimelineEditor } from './timeline-editor';
import { ScenarioTemplatePicker } from './scenario-template-picker';
import type { SimulationInitialData } from '@/app/(dashboard)/simulation/_actions/simulation';
import { cn } from '@/lib/utils/cn';

const MAX_SCENARIOS = 3;

const SCENARIO_COLORS = [
  'var(--color-primary)',
  'var(--chart-3)',
  'var(--chart-5)',
];

interface Scenario {
  id: string;
  name: string;
  events: LifeEvent[];
}

interface ScenarioComparisonProps {
  initialData: SimulationInitialData;
  years: number;
}

export function ScenarioComparison({ initialData, years }: ScenarioComparisonProps): React.ReactElement {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    { id: 'base', name: '現状維持', events: [] },
  ]);
  const [activeScenario, setActiveScenario] = useState('base');
  const [editingName, setEditingName] = useState<string | null>(null);

  // Run simulations for all scenarios
  const results = useMemo((): Array<{ scenario: Scenario; result: SimulationResult }> => {
    return scenarios.map((s) => ({
      scenario: s,
      result: runSimulation({
        ...DEFAULT_PARAMS,
        currentAge: initialData.currentAge,
        annualIncome: initialData.annualIncome,
        annualExpenses: initialData.annualExpenses,
        totalAssets: initialData.totalAssets,
        totalLiabilities: initialData.totalLiabilities,
        annualLoanPayment: initialData.annualLoanPayment,
        years,
        lifeEvents: s.events,
      }),
    }));
  }, [scenarios, initialData, years]);

  const addScenario = useCallback((): void => {
    if (scenarios.length >= MAX_SCENARIOS) return;
    const id = `scenario-${Date.now()}`;
    setScenarios((prev) => [...prev, { id, name: `シナリオ ${prev.length + 1}`, events: [] }]);
    setActiveScenario(id);
  }, [scenarios.length]);

  const removeScenario = useCallback((id: string): void => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
    setActiveScenario((current) => current === id ? scenarios[0]?.id ?? 'base' : current);
  }, [scenarios]);

  const updateEvents = useCallback((id: string, events: LifeEvent[]): void => {
    setScenarios((prev) => prev.map((s) => s.id === id ? { ...s, events } : s));
  }, []);

  const updateName = useCallback((id: string, name: string): void => {
    setScenarios((prev) => prev.map((s) => s.id === id ? { ...s, name } : s));
  }, []);

  const activeResult = results.find((r) => r.scenario.id === activeScenario);

  // Chart data
  const chartScenarios = results.map((r) => ({
    name: r.scenario.name,
    data: r.result.projections.map((p) => ({ age: p.age, netWorth: p.netWorth })),
  }));

  return (
    <div className="space-y-6">
      {/* Scenario tabs */}
      <Card>
        <div className="flex items-center gap-2 overflow-x-auto">
          {scenarios.map((s, index) => (
            <div key={s.id} className="flex items-center gap-1">
              {editingName === s.id ? (
                <Input
                  value={s.name}
                  onChange={(e) => updateName(s.id, e.target.value)}
                  onBlur={() => setEditingName(null)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setEditingName(null); }}
                  className="h-8 w-32 text-xs"
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveScenario(s.id)}
                  onDoubleClick={() => setEditingName(s.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-1.5 text-sm transition-colors',
                    activeScenario === s.id
                      ? 'bg-[var(--color-surface-alt)] font-medium text-foreground'
                      : 'text-ink-muted hover:text-foreground',
                  )}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: SCENARIO_COLORS[index % SCENARIO_COLORS.length] }}
                  />
                  {s.name}
                </button>
              )}
              {scenarios.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeScenario(s.id)}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-ink-subtle hover:bg-negative-bg hover:text-negative"
                  aria-label={`${s.name}を削除`}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          {scenarios.length < MAX_SCENARIOS && (
            <Button variant="ghost" size="sm" onClick={addScenario} className="text-xs">
              + シナリオ追加
            </Button>
          )}
        </div>
        <p className="mt-2 text-[10px] text-ink-subtle">ダブルクリックで名前を変更</p>
      </Card>

      {/* Template picker for empty scenarios */}
      {activeResult && activeResult.scenario.events.length === 0 && (
        <ScenarioTemplatePicker
          currentAge={initialData.currentAge}
          onSelect={(name, templateEvents) => {
            updateName(activeScenario, name);
            updateEvents(activeScenario, templateEvents);
          }}
        />
      )}

      {/* Active scenario timeline editor */}
      {activeResult && (
        <TimelineEditor
          currentAge={initialData.currentAge}
          events={activeResult.scenario.events}
          onEventsChange={(newEvents) => updateEvents(activeScenario, newEvents)}
        />
      )}

      {/* Comparison chart (visible when 2+ scenarios) */}
      {results.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>シナリオ比較</CardTitle>
          </CardHeader>
          <ScenarioComparisonChart scenarios={chartScenarios} />
        </Card>
      )}

      {/* Comparison table */}
      {results.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>比較サマリー</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-xs font-medium text-ink-muted">指標</th>
                  {results.map((r, i) => (
                    <th key={r.scenario.id} className="px-3 py-2 text-right text-xs font-medium">
                      <div className="flex items-center justify-end gap-1.5">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: SCENARIO_COLORS[i % SCENARIO_COLORS.length] }}
                        />
                        <span className="text-foreground">{r.scenario.name}</span>
                      </div>
                    </th>
                  ))}
                  {results.length === 2 && (
                    <th className="px-3 py-2 text-right text-xs font-medium text-ink-muted">差分</th>
                  )}
                </tr>
              </thead>
              <tbody>
                <ComparisonRow
                  label="退職時純資産"
                  values={results.map((r) => r.result.summary.netWorthAtRetirement)}
                  showDiff={results.length === 2}
                />
                <ComparisonRow
                  label={`${initialData.currentAge + years}歳時点`}
                  values={results.map((r) => r.result.summary.finalNetWorth)}
                  showDiff={results.length === 2}
                />
                <ComparisonRow
                  label="生涯貯蓄"
                  values={results.map((r) => r.result.summary.totalSavings)}
                  showDiff={results.length === 2}
                />
                <ComparisonRow
                  label="投資リターン計"
                  values={results.map((r) => r.result.summary.totalInvestmentReturns)}
                  showDiff={results.length === 2}
                />
                <tr className="border-t border-border">
                  <td className="px-3 py-2 text-xs text-ink-muted">資産枯渇年齢</td>
                  {results.map((r) => (
                    <td key={r.scenario.id} className="px-3 py-2 text-right text-xs tabular-nums">
                      {r.result.summary.bankruptcyAge !== null ? (
                        <span className="font-medium text-negative">{r.result.summary.bankruptcyAge}歳</span>
                      ) : (
                        <Badge variant="primary" className="text-[10px]">安全</Badge>
                      )}
                    </td>
                  ))}
                  {results.length === 2 && <td />}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Single scenario summary (when only 1) */}
      {results.length === 1 && activeResult && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard label="退職時純資産" value={activeResult.result.summary.netWorthAtRetirement} />
          <MetricCard label={`${initialData.currentAge + years}歳時点`} value={activeResult.result.summary.finalNetWorth} />
          <MetricCard label="生涯貯蓄" value={activeResult.result.summary.totalSavings} />
          <MetricCard label="投資リターン計" value={activeResult.result.summary.totalInvestmentReturns} />
        </div>
      )}
    </div>
  );
}

function ComparisonRow({
  label,
  values,
  showDiff,
}: {
  label: string;
  values: number[];
  showDiff: boolean;
}): React.ReactElement {
  const diff = values.length >= 2 ? values[0] - values[1] : 0;

  return (
    <tr className="border-b border-border/50">
      <td className="px-3 py-2 text-xs text-ink-muted">{label}</td>
      {values.map((v, i) => (
        <td key={i} className={cn(
          'px-3 py-2 text-right text-xs font-medium tabular-nums',
          v < 0 ? 'text-negative' : 'text-foreground',
        )}>
          {v < 0 ? '-' : ''}¥{formatCurrency(Math.abs(v))}
        </td>
      ))}
      {showDiff && (
        <td className={cn(
          'px-3 py-2 text-right text-xs font-medium tabular-nums',
          diff > 0 ? 'text-positive' : diff < 0 ? 'text-negative' : 'text-ink-subtle',
        )}>
          {diff > 0 ? '+' : diff < 0 ? '-' : ''}¥{formatCurrency(Math.abs(diff))}
        </td>
      )}
    </tr>
  );
}

function MetricCard({ label, value }: { label: string; value: number }): React.ReactElement {
  return (
    <Card>
      <p className="text-[11px] text-ink-muted">{label}</p>
      <p className={cn(
        'mt-1 font-display text-xl tabular-nums',
        value < 0 ? 'text-negative' : 'text-foreground',
      )}>
        {value < 0 ? '-' : ''}¥{formatCurrency(Math.abs(value))}
      </p>
    </Card>
  );
}
