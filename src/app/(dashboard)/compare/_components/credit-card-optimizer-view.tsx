'use client';

import { useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { optimizeCreditCards, type SpendingPattern, type CardRecommendation, type OptimizationResult } from '@/lib/utils/credit-card-optimizer';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface CreditCardOptimizerViewProps {
  spending: SpendingPattern[];
}

export function CreditCardOptimizerView({ spending }: CreditCardOptimizerViewProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const result = useMemo(() => optimizeCreditCards(spending), [spending]);

  return (
    <div ref={ref} className="space-y-6">
      {/* Summary metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="月間支出" value={`¥${formatCurrency(result.spendingSummary.totalMonthly)}`} />
        <MetricCard label="年間獲得ポイント" value={`¥${formatCurrency(result.comboAnnualReward)}`} color="text-positive" />
        <MetricCard label="実質還元率" value={`${(result.spendingSummary.effectiveRate * 100).toFixed(2)}%`} color="text-primary" />
        {result.improvementOverSingle > 0 && (
          <MetricCard
            label="組み合わせ効果"
            value={`+¥${formatCurrency(result.improvementOverSingle)}`}
            color="text-positive"
          />
        )}
      </div>

      {/* Best single card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>1枚で使うなら</CardTitle>
              <Badge variant="primary">おすすめ</Badge>
            </div>
          </CardHeader>
          <RecommendationDetail rec={result.singleBest} />
        </Card>
      </motion.div>

      {/* Best combo */}
      {result.comboBest.length >= 2 && result.improvementOverSingle > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>2枚使い分けるなら</CardTitle>
                  <CardDescription>
                    カテゴリ別に最適なカードを使い分けると年間+¥{formatCurrency(result.improvementOverSingle)}
                  </CardDescription>
                </div>
                <Badge variant="primary">最適</Badge>
              </div>
            </CardHeader>

            <div className="space-y-4">
              {result.comboBest.map((rec) => (
                <div key={rec.card.id}>
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant={rec.role === 'main' ? 'primary' : 'default'}>
                      {rec.role === 'main' ? 'メイン' : 'サブ'}
                    </Badge>
                    <span className="text-sm font-medium text-foreground">{rec.card.name}</span>
                    <span className="text-xs text-ink-subtle">{rec.card.provider}</span>
                  </div>
                  <RecommendationDetail rec={rec} compact />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Category breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>カテゴリ別還元シミュレーション</CardTitle>
          </CardHeader>
          <CategoryBreakdown result={result} />
        </Card>
      </motion.div>
    </div>
  );
}

function RecommendationDetail({ rec, compact }: { rec: CardRecommendation; compact?: boolean }): React.ReactElement {
  return (
    <div>
      {!compact && (
        <div className="mb-3 flex items-center gap-3">
          <span className="text-lg font-medium text-foreground">{rec.card.name}</span>
          <span className="text-sm text-ink-subtle">{rec.card.provider}</span>
        </div>
      )}

      <div className={cn('grid gap-3', compact ? 'grid-cols-3' : 'grid-cols-4')}>
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] px-3 py-2">
          <p className="text-[10px] text-ink-subtle">年間還元</p>
          <p className="font-medium tabular-nums text-positive">+¥{formatCurrency(rec.annualReward)}</p>
        </div>
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] px-3 py-2">
          <p className="text-[10px] text-ink-subtle">年会費</p>
          <p className="font-medium tabular-nums text-foreground">
            {rec.annualFee === 0 ? '無料' : `¥${formatCurrency(rec.annualFee)}`}
          </p>
        </div>
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] px-3 py-2">
          <p className="text-[10px] text-ink-subtle">実質メリット</p>
          <p className={cn('font-medium tabular-nums', rec.netBenefit >= 0 ? 'text-positive' : 'text-negative')}>
            {rec.netBenefit >= 0 ? '+' : ''}¥{formatCurrency(rec.netBenefit)}
          </p>
        </div>
        {!compact && (
          <div className="rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] px-3 py-2">
            <p className="text-[10px] text-ink-subtle">対象カテゴリ</p>
            <p className="font-medium text-foreground">{rec.assignedCategories.length}件</p>
          </div>
        )}
      </div>

      {/* Category assignments */}
      {rec.assignedCategories.length > 0 && (
        <div className="mt-3 space-y-1">
          {rec.assignedCategories.map((a) => (
            <div key={a.category} className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">{a.label}</span>
              <div className="flex items-center gap-3">
                <span className="tabular-nums text-ink-subtle">¥{formatCurrency(a.monthlyAmount)}/月</span>
                <span className="tabular-nums text-primary">{(a.rewardRate * 100).toFixed(1)}%</span>
                <span className="tabular-nums text-positive">+¥{formatCurrency(a.monthlyReward)}/月</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryBreakdown({ result }: { result: OptimizationResult }): React.ReactElement {
  const allCategories = result.comboBest.flatMap((rec) =>
    rec.assignedCategories.map((a) => ({
      ...a,
      cardName: rec.card.name,
      cardRole: rec.role,
    })),
  ).sort((a, b) => b.monthlyAmount - a.monthlyAmount);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-left text-ink-muted">
            <th className="px-2 py-2 font-medium">カテゴリ</th>
            <th className="px-2 py-2 font-medium text-right">月額</th>
            <th className="px-2 py-2 font-medium">使用カード</th>
            <th className="px-2 py-2 font-medium text-right">還元率</th>
            <th className="px-2 py-2 font-medium text-right">月間ポイント</th>
            <th className="px-2 py-2 font-medium text-right">年間ポイント</th>
          </tr>
        </thead>
        <tbody>
          {allCategories.map((c) => (
            <tr key={c.category} className="border-b border-border/50">
              <td className="px-2 py-1.5 text-foreground">{c.label}</td>
              <td className="px-2 py-1.5 text-right tabular-nums text-foreground">¥{formatCurrency(c.monthlyAmount)}</td>
              <td className="px-2 py-1.5">
                <Badge variant={c.cardRole === 'main' ? 'primary' : 'default'} className="text-[9px]">
                  {c.cardName}
                </Badge>
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums text-primary">{(c.rewardRate * 100).toFixed(1)}%</td>
              <td className="px-2 py-1.5 text-right tabular-nums text-positive">+¥{formatCurrency(c.monthlyReward)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums text-positive">+¥{formatCurrency(c.monthlyReward * 12)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border font-medium">
            <td className="px-2 py-2 text-ink-muted">合計</td>
            <td className="px-2 py-2 text-right tabular-nums text-foreground">¥{formatCurrency(result.spendingSummary.totalMonthly)}</td>
            <td />
            <td className="px-2 py-2 text-right tabular-nums text-primary">{(result.spendingSummary.effectiveRate * 100).toFixed(2)}%</td>
            <td className="px-2 py-2 text-right tabular-nums text-positive">+¥{formatCurrency(Math.round(result.comboAnnualReward / 12))}</td>
            <td className="px-2 py-2 text-right tabular-nums text-positive">+¥{formatCurrency(result.comboAnnualReward)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color?: string }): React.ReactElement {
  return (
    <Card>
      <p className="text-[11px] text-ink-muted">{label}</p>
      <p className={cn('mt-1 font-display text-xl tabular-nums', color ?? 'text-foreground')}>{value}</p>
    </Card>
  );
}
