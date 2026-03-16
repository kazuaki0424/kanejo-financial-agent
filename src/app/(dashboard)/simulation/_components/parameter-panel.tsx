'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { runSimulation, type SimulationParams } from '@/lib/utils/cashflow-engine';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface AdjustableParams {
  salaryGrowthRate: number;
  inflationRate: number;
  investmentReturnRate: number;
  retirementAge: number;
  retirementBonus: number;
  pensionAmount: number;
  pensionStartAge: number;
}

interface ParameterPanelProps {
  values: AdjustableParams;
  onChange: (updates: Partial<AdjustableParams>) => void;
  fullParams: SimulationParams;
}

export function ParameterPanel({ values, onChange, fullParams }: ParameterPanelProps): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>パラメータ調整</CardTitle>
      </CardHeader>

      <div className="space-y-5">
        {/* 昇給率 */}
        <Slider
          label="昇給率"
          value={[values.salaryGrowthRate * 100]}
          min={0}
          max={10}
          step={0.5}
          onValueChange={([v]) => onChange({ salaryGrowthRate: v / 100 })}
          formatValue={(v) => `${v.toFixed(1)}%`}
        />

        {/* インフレ率 */}
        <Slider
          label="インフレ率"
          value={[values.inflationRate * 100]}
          min={0}
          max={5}
          step={0.5}
          onValueChange={([v]) => onChange({ inflationRate: v / 100 })}
          formatValue={(v) => `${v.toFixed(1)}%`}
        />

        {/* 投資利回り */}
        <Slider
          label="投資利回り"
          value={[values.investmentReturnRate * 100]}
          min={0}
          max={10}
          step={0.5}
          onValueChange={([v]) => onChange({ investmentReturnRate: v / 100 })}
          formatValue={(v) => `${v.toFixed(1)}%`}
        />

        {/* 退職年齢 */}
        <Slider
          label="退職年齢"
          value={[values.retirementAge]}
          min={50}
          max={75}
          step={1}
          onValueChange={([v]) => onChange({ retirementAge: v })}
          formatValue={(v) => `${v}歳`}
        />

        {/* 退職金 */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">退職金</span>
            <span className="text-sm font-medium tabular-nums text-foreground">
              ¥{formatCurrency(values.retirementBonus)}
            </span>
          </div>
          <Slider
            value={[values.retirementBonus]}
            min={0}
            max={50_000_000}
            step={1_000_000}
            onValueChange={([v]) => onChange({ retirementBonus: v })}
            formatValue={(v) => `¥${formatCurrency(v)}`}
          />
        </div>

        {/* 年金額 */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">年金（年額）</span>
            <span className="text-sm font-medium tabular-nums text-foreground">
              ¥{formatCurrency(values.pensionAmount)}
            </span>
          </div>
          <Slider
            value={[values.pensionAmount]}
            min={0}
            max={5_000_000}
            step={100_000}
            onValueChange={([v]) => onChange({ pensionAmount: v })}
            formatValue={(v) => `¥${formatCurrency(v)}`}
          />
        </div>

        {/* 年金受給開始年齢 */}
        <Slider
          label="年金受給開始"
          value={[values.pensionStartAge]}
          min={60}
          max={75}
          step={1}
          onValueChange={([v]) => onChange({ pensionStartAge: v })}
          formatValue={(v) => `${v}歳`}
        />
      </div>

      {/* 感度分析 */}
      <div className="mt-6 border-t border-border pt-4">
        <p className="mb-3 text-[13px] font-medium text-foreground">感度分析</p>
        <p className="mb-3 text-[11px] text-ink-subtle">
          各パラメータを±1%変動させた場合の最終純資産への影響
        </p>
        <SensitivityAnalysis fullParams={fullParams} />
      </div>
    </Card>
  );
}

function SensitivityAnalysis({ fullParams }: { fullParams: SimulationParams }): React.ReactElement {
  const analysis = useMemo(() => {
    const baseResult = runSimulation(fullParams);
    const baseNetWorth = baseResult.summary.finalNetWorth;

    const factors = [
      {
        label: '昇給率',
        key: 'salaryGrowthRate' as const,
        delta: 0.01,
        unit: '%',
      },
      {
        label: 'インフレ率',
        key: 'inflationRate' as const,
        delta: 0.01,
        unit: '%',
        inverted: true, // higher inflation = worse
      },
      {
        label: '投資利回り',
        key: 'investmentReturnRate' as const,
        delta: 0.01,
        unit: '%',
      },
    ];

    return factors.map((factor) => {
      const upParams = { ...fullParams, [factor.key]: fullParams[factor.key] + factor.delta };
      const downParams = { ...fullParams, [factor.key]: fullParams[factor.key] - factor.delta };

      const upResult = runSimulation(upParams);
      const downResult = runSimulation(downParams);

      const upImpact = upResult.summary.finalNetWorth - baseNetWorth;
      const downImpact = downResult.summary.finalNetWorth - baseNetWorth;

      return {
        label: factor.label,
        upImpact,
        downImpact,
        maxAbsImpact: Math.max(Math.abs(upImpact), Math.abs(downImpact)),
      };
    });
  }, [fullParams]);

  const maxImpact = Math.max(...analysis.map((a) => a.maxAbsImpact), 1);

  return (
    <div className="space-y-3">
      {analysis.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-ink-muted">{item.label}</span>
            <div className="flex gap-3">
              <span className={cn('tabular-nums', item.downImpact >= 0 ? 'text-positive' : 'text-negative')}>
                -1%: {item.downImpact >= 0 ? '+' : ''}¥{formatCurrency(item.downImpact)}
              </span>
              <span className={cn('tabular-nums', item.upImpact >= 0 ? 'text-positive' : 'text-negative')}>
                +1%: {item.upImpact >= 0 ? '+' : ''}¥{formatCurrency(item.upImpact)}
              </span>
            </div>
          </div>
          {/* Impact bar */}
          <div className="flex h-2 items-center">
            <div className="flex h-full w-full items-center justify-center">
              {/* Negative side */}
              <div className="flex h-full w-1/2 justify-end">
                {item.downImpact < 0 && (
                  <div
                    className="h-full rounded-l-full bg-negative"
                    style={{ width: `${(Math.abs(item.downImpact) / maxImpact) * 100}%` }}
                  />
                )}
              </div>
              <div className="h-full w-px bg-border" />
              {/* Positive side */}
              <div className="flex h-full w-1/2">
                {item.upImpact > 0 && (
                  <div
                    className="h-full rounded-r-full bg-positive"
                    style={{ width: `${(item.upImpact / maxImpact) * 100}%` }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
