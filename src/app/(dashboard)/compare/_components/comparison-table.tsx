'use client';

import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ScoredService } from '@/lib/utils/service-comparison';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface ComparisonTableProps {
  services: ScoredService[];
  onRemove: (id: string) => void;
}

export function ComparisonTable({ services, onRemove }: ComparisonTableProps): React.ReactElement {
  if (services.length < 2) {
    return (
      <Card>
        <p className="py-4 text-center text-sm text-ink-subtle">
          2つ以上のサービスを選択して比較してください
        </p>
      </Card>
    );
  }

  // Collect all unique feature labels
  const allLabels = new Set<string>();
  for (const s of services) {
    for (const f of s.service.features) {
      allLabels.add(f.label);
    }
  }
  const featureLabels = Array.from(allLabels);

  // Find best values for highlighting
  const bestScore = Math.max(...services.map((s) => s.score));
  const lowestCost = Math.min(...services.map((s) => s.annualCost));
  const highestBenefit = Math.max(...services.map((s) => s.annualBenefit));
  const highestRating = Math.max(...services.map((s) => s.service.rating));
  const bestNetValue = Math.max(...services.map((s) => s.netValue));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>サービス比較</CardTitle>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-border">
                <th className="w-28 px-3 py-2 text-left text-xs font-medium text-ink-muted" />
                {services.map((s) => (
                  <th key={s.service.id} className="px-3 py-2 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-medium text-foreground">{s.service.name}</span>
                      <span className="text-[10px] text-ink-subtle">{s.service.provider}</span>
                      {s.isRecommended && <Badge variant="primary" className="text-[9px]">おすすめ</Badge>}
                      <button
                        type="button"
                        onClick={() => onRemove(s.service.id)}
                        className="mt-1 text-[10px] text-ink-subtle hover:text-negative"
                      >
                        ✕ 除外
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Score */}
              <ComparisonRow
                label="おすすめ度"
                values={services.map((s) => ({
                  display: `${s.score}点`,
                  isBest: s.score === bestScore,
                }))}
              />

              {/* Annual cost */}
              <ComparisonRow
                label="年間コスト"
                values={services.map((s) => ({
                  display: s.annualCost === 0 ? '無料' : `¥${formatCurrency(s.annualCost)}`,
                  isBest: s.annualCost === lowestCost,
                }))}
              />

              {/* Annual benefit */}
              {highestBenefit > 0 && (
                <ComparisonRow
                  label="年間還元"
                  values={services.map((s) => ({
                    display: s.annualBenefit > 0 ? `+¥${formatCurrency(s.annualBenefit)}` : '-',
                    isBest: s.annualBenefit === highestBenefit && highestBenefit > 0,
                    color: s.annualBenefit > 0 ? 'text-positive' : undefined,
                  }))}
                />
              )}

              {/* Net value */}
              {highestBenefit > 0 && (
                <ComparisonRow
                  label="実質コスト"
                  values={services.map((s) => ({
                    display: `${s.netValue >= 0 ? '+' : ''}¥${formatCurrency(s.netValue)}`,
                    isBest: s.netValue === bestNetValue,
                    color: s.netValue >= 0 ? 'text-positive' : 'text-negative',
                  }))}
                />
              )}

              {/* Rating */}
              <ComparisonRow
                label="評価"
                values={services.map((s) => ({
                  display: `★ ${s.service.rating}`,
                  isBest: s.service.rating === highestRating,
                }))}
              />

              {/* Features */}
              {featureLabels.map((label) => (
                <ComparisonRow
                  key={label}
                  label={label}
                  values={services.map((s) => {
                    const feature = s.service.features.find((f) => f.label === label);
                    return {
                      display: feature?.value ?? '-',
                      isBest: false,
                    };
                  })}
                />
              ))}

              {/* Highlights */}
              <tr className="border-t border-border">
                <td className="px-3 py-2 text-xs text-ink-muted">特徴</td>
                {services.map((s) => (
                  <td key={s.service.id} className="px-3 py-2">
                    <div className="flex flex-wrap justify-center gap-1">
                      {s.service.highlights.map((h) => (
                        <Badge key={h} variant="default" className="text-[9px]">{h}</Badge>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}

function ComparisonRow({
  label,
  values,
}: {
  label: string;
  values: Array<{ display: string; isBest: boolean; color?: string }>;
}): React.ReactElement {
  return (
    <tr className="border-b border-border/50">
      <td className="px-3 py-2 text-xs text-ink-muted">{label}</td>
      {values.map((v, i) => (
        <td
          key={i}
          className={cn(
            'px-3 py-2 text-center text-sm tabular-nums',
            v.isBest ? 'font-medium text-primary' : v.color ?? 'text-foreground',
            v.isBest && 'bg-primary-light',
          )}
        >
          {v.display}
          {v.isBest && <span className="ml-1 text-[9px]">✓</span>}
        </td>
      ))}
    </tr>
  );
}
