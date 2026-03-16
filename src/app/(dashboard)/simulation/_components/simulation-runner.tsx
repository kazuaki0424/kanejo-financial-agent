'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { runSimulation, DEFAULT_PARAMS, type LifeEvent, type SimulationParams } from '@/lib/utils/cashflow-engine';
import { formatCurrency } from '@/lib/utils/format';
import { TimelineEditor } from './timeline-editor';
import { ScenarioComparison } from './scenario-comparison';
import { ScenarioTemplatePicker } from './scenario-template-picker';
import { SimulationInsight } from './simulation-insight';
import { ParameterPanel } from './parameter-panel';
import { CashflowChart } from '@/components/charts/cashflow-chart';
import type { SimulationInitialData } from '@/app/(dashboard)/simulation/_actions/simulation';
import { cn } from '@/lib/utils/cn';

interface SimulationRunnerProps {
  initialData: SimulationInitialData;
}

type ViewMode = 'single' | 'compare';

export function SimulationRunner({ initialData }: SimulationRunnerProps): React.ReactElement {
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [years, setYears] = useState(30);
  const [chartMode, setChartMode] = useState<'networth' | 'cashflow'>('networth');
  const [showParams, setShowParams] = useState(false);

  // Adjustable parameters
  const [adjustableParams, setAdjustableParams] = useState({
    salaryGrowthRate: DEFAULT_PARAMS.salaryGrowthRate,
    inflationRate: DEFAULT_PARAMS.inflationRate,
    investmentReturnRate: DEFAULT_PARAMS.investmentReturnRate,
    retirementAge: DEFAULT_PARAMS.retirementAge,
    retirementBonus: DEFAULT_PARAMS.retirementBonus,
    pensionAmount: DEFAULT_PARAMS.pensionAmount,
    pensionStartAge: DEFAULT_PARAMS.pensionStartAge,
  });

  const handleParamChange = useCallback((updates: Partial<typeof adjustableParams>): void => {
    setAdjustableParams((prev) => ({ ...prev, ...updates }));
  }, []);

  const params: SimulationParams = useMemo(() => ({
    ...DEFAULT_PARAMS,
    ...adjustableParams,
    currentAge: initialData.currentAge,
    annualIncome: initialData.annualIncome,
    annualExpenses: initialData.annualExpenses,
    totalAssets: initialData.totalAssets,
    totalLiabilities: initialData.totalLiabilities,
    annualLoanPayment: initialData.annualLoanPayment,
    years,
    lifeEvents: events,
  }), [initialData, adjustableParams, events, years]);

  const result = useMemo(() => runSimulation(params), [params]);

  return (
    <div className="space-y-6">
      {/* Mode toggle + period selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('single')}
            className={cn(
              'rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-colors',
              viewMode === 'single' ? 'bg-surface text-foreground shadow-sm' : 'text-ink-muted',
            )}
          >
            シミュレーション
          </button>
          <button
            type="button"
            onClick={() => setViewMode('compare')}
            className={cn(
              'rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-colors',
              viewMode === 'compare' ? 'bg-surface text-foreground shadow-sm' : 'text-ink-muted',
            )}
          >
            シナリオ比較
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showParams ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowParams(!showParams)}
            className="text-xs"
          >
            <SettingsIcon />
            パラメータ
          </Button>
          <span className="text-xs text-ink-muted">期間:</span>
          <select
            value={years}
            onChange={(e) => setYears(Math.max(5, Math.min(50, Number(e.target.value))))}
            className="rounded-[var(--radius-sm)] border border-border bg-surface px-2 py-1 text-xs text-foreground"
          >
            {[10, 20, 30, 40, 50].map((y) => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
        </div>
      </div>

      {/* パラメータ調整パネル */}
      {showParams && viewMode === 'single' && (
        <ParameterPanel
          values={adjustableParams}
          onChange={handleParamChange}
          fullParams={params}
        />
      )}

      {viewMode === 'compare' ? (
        <ScenarioComparison initialData={initialData} years={years} />
      ) : (
        <>
          {/* テンプレート選択（イベント未設定時） */}
          {events.length === 0 && (
            <ScenarioTemplatePicker
              currentAge={initialData.currentAge}
              onSelect={(_name, templateEvents) => setEvents(templateEvents)}
            />
          )}

          {/* タイムラインエディタ */}
          <TimelineEditor
            currentAge={initialData.currentAge}
            events={events}
            onEventsChange={setEvents}
          />

          {/* サマリーカード */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryMetric
              label="退職時純資産"
              value={result.summary.netWorthAtRetirement}
              highlight={result.summary.netWorthAtRetirement >= 0}
            />
            <SummaryMetric
              label={`${initialData.currentAge + years}歳時点`}
              value={result.summary.finalNetWorth}
              highlight={result.summary.finalNetWorth >= 0}
            />
            <SummaryMetric label="生涯貯蓄" value={result.summary.totalSavings} />
            <SummaryMetric label="投資リターン計" value={result.summary.totalInvestmentReturns} />
          </div>

          {/* キャッシュフローチャート */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] font-medium text-foreground">資産推移</p>
              <div className="flex gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] p-0.5">
                <button
                  type="button"
                  onClick={() => setChartMode('networth')}
                  className={cn(
                    'rounded-[var(--radius-sm)] px-3 py-1 text-xs font-medium transition-colors',
                    chartMode === 'networth' ? 'bg-surface text-foreground shadow-sm' : 'text-ink-muted',
                  )}
                >
                  純資産
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('cashflow')}
                  className={cn(
                    'rounded-[var(--radius-sm)] px-3 py-1 text-xs font-medium transition-colors',
                    chartMode === 'cashflow' ? 'bg-surface text-foreground shadow-sm' : 'text-ink-muted',
                  )}
                >
                  収支
                </button>
              </div>
            </div>
            <CashflowChart projections={result.projections} mode={chartMode} />
            <div className="mt-3 flex items-center justify-center gap-6">
              {chartMode === 'cashflow' ? (
                <>
                  <LegendItem color="var(--color-positive)" label="収入" />
                  <LegendItem color="var(--color-negative)" label="支出" />
                </>
              ) : (
                <>
                  <LegendItem color="var(--color-primary)" label="純資産" />
                  <LegendItem color="var(--color-ink-subtle)" label="イベント" dashed />
                </>
              )}
            </div>
          </Card>

          {/* AIアドバイス */}
          <SimulationInsight params={params} />

          {/* 破綻警告 */}
          {result.summary.bankruptcyAge !== null && (
            <Card className="border-negative bg-negative-bg">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-negative">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white" aria-hidden="true">
                    <path d="M8 5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-negative">
                    {result.summary.bankruptcyAge}歳で資産がマイナスになる可能性があります
                  </p>
                  <p className="text-xs text-negative/80">
                    支出の見直しや収入増加の検討をおすすめします
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* 年次プロジェクションテーブル */}
          <Card>
            <p className="mb-3 text-[13px] font-medium text-foreground">年次キャッシュフロー</p>
            <div className="max-h-[400px] overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-surface">
                  <tr className="border-b border-border text-left text-ink-muted">
                    <th className="px-2 py-2 font-medium">年齢</th>
                    <th className="px-2 py-2 font-medium text-right">収入</th>
                    <th className="px-2 py-2 font-medium text-right">支出</th>
                    <th className="px-2 py-2 font-medium text-right">貯蓄</th>
                    <th className="px-2 py-2 font-medium text-right">純資産</th>
                    <th className="px-2 py-2 font-medium">イベント</th>
                  </tr>
                </thead>
                <tbody>
                  {result.projections.map((p) => (
                    <tr
                      key={p.year}
                      className={cn(
                        'border-b border-border/50 transition-colors hover:bg-[var(--color-surface-hover)]',
                        p.events.length > 0 && 'bg-[var(--color-surface-alt)]',
                      )}
                    >
                      <td className="px-2 py-1.5 tabular-nums">
                        {p.age}歳
                        <span className="ml-1 text-ink-subtle">({p.year})</span>
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-foreground">
                        ¥{formatCurrency(p.income)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-foreground">
                        ¥{formatCurrency(p.expenses)}
                      </td>
                      <td className={cn(
                        'px-2 py-1.5 text-right tabular-nums',
                        p.savings >= 0 ? 'text-positive' : 'text-negative',
                      )}>
                        {p.savings >= 0 ? '+' : ''}¥{formatCurrency(p.savings)}
                      </td>
                      <td className={cn(
                        'px-2 py-1.5 text-right tabular-nums font-medium',
                        p.netWorth >= 0 ? 'text-foreground' : 'text-negative',
                      )}>
                        ¥{formatCurrency(p.netWorth)}
                      </td>
                      <td className="px-2 py-1.5">
                        {p.events.map((e) => (
                          <Badge key={e} variant="default" className="mr-1 text-[9px]">{e}</Badge>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed?: boolean }): React.ReactElement {
  return (
    <div className="flex items-center gap-1.5">
      {dashed ? (
        <span className="inline-block h-0 w-3 border-t-2 border-dashed" style={{ borderColor: color }} />
      ) : (
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      )}
      <span className="text-xs text-ink-muted">{label}</span>
    </div>
  );
}

function SettingsIcon(): React.ReactElement {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-current" aria-hidden="true">
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 1.5V3.5M8 12.5V14.5M1.5 8H3.5M12.5 8H14.5M3.4 3.4L4.8 4.8M11.2 11.2L12.6 12.6M3.4 12.6L4.8 11.2M11.2 4.8L12.6 3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function SummaryMetric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}): React.ReactElement {
  return (
    <Card>
      <p className="text-[11px] text-ink-muted">{label}</p>
      <p className={cn(
        'mt-1 font-display text-xl tabular-nums',
        highlight === false ? 'text-negative' : 'text-foreground',
      )}>
        {value < 0 ? '-' : ''}¥{formatCurrency(Math.abs(value))}
      </p>
    </Card>
  );
}
