'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import type { ScoreBreakdown } from '@/lib/utils/household-score';
import { cn } from '@/lib/utils/cn';

interface ImprovementListProps {
  breakdown: ScoreBreakdown;
  tier: string;
}

interface Recommendation {
  indicator: string;
  score: number;
  max: number;
  ratio: number;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
}

function generateRecommendations(breakdown: ScoreBreakdown, tier: string): Recommendation[] {
  const items: Recommendation[] = [];

  const indicators = [
    {
      indicator: 'savings',
      score: breakdown.savingsScore,
      max: breakdown.savingsMax,
      title: '貯蓄率を改善する',
      descriptions: {
        basic: '毎月の収入の20%を貯蓄に回すことを目標にしましょう。まずは固定費の見直しから始めてみてください。',
        middle: '毎月の収入の25%以上を貯蓄に回せると理想的です。サブスクリプションや保険の見直しが効果的かもしれません。',
        high_end: '収入の30%以上の貯蓄率を維持することで、資産形成のスピードが大きく変わります。',
      },
    },
    {
      indicator: 'debt',
      score: breakdown.debtScore,
      max: breakdown.debtMax,
      title: '負債を管理する',
      descriptions: {
        basic: '年収の3倍以内に負債を抑えることが重要です。高金利の借入から優先的に返済を検討してください。',
        middle: '住宅ローンを含む総負債が年収の5倍以内であれば健全です。繰り上げ返済の検討も有効です。',
        high_end: '投資用不動産のレバレッジを含めても、年収の8倍以内が目安です。金利環境に応じた戦略的な借入管理を。',
      },
    },
    {
      indicator: 'diversity',
      score: breakdown.diversityScore,
      max: breakdown.diversityMax,
      title: '資産を分散する',
      descriptions: {
        basic: '預貯金だけでなく、つみたてNISAなどで投資信託にも分散すると、長期的な資産成長が期待できます。',
        middle: '預貯金・株式・投資信託の3カテゴリ以上に分散することで、リスクを抑えながらリターンを狙えます。',
        high_end: '国内外の株式・債券・不動産・オルタナティブなど、4カテゴリ以上への分散が理想的です。',
      },
    },
    {
      indicator: 'buffer',
      score: breakdown.bufferScore,
      max: breakdown.bufferMax,
      title: '緊急資金を確保する',
      descriptions: {
        basic: '月支出の3ヶ月分を流動性の高い預貯金で確保しましょう。急な出費にも対応できます。',
        middle: '月支出の6ヶ月分の緊急資金があると安心です。定期預金やMMFも活用できます。',
        high_end: '月支出の12ヶ月分の流動資産を確保することで、市場変動時にも冷静な判断ができます。',
      },
    },
    {
      indicator: 'insurance',
      score: breakdown.insuranceScore,
      max: breakdown.insuranceMax,
      title: '保険カバーを見直す',
      descriptions: {
        basic: '最低限の医療保険と、家族がいる場合は生命保険の加入を検討してください。年収の5-10%程度が目安です。',
        middle: '家族構成やライフステージに合わせた保険の見直しが重要です。過不足なく年収の10-15%程度が適切です。',
        high_end: '保険は節税効果も含めて戦略的に活用しましょう。法人保険や逓増定期なども検討の余地があります。',
      },
    },
  ];

  for (const item of indicators) {
    const ratio = item.max > 0 ? item.score / item.max : 0;
    const priority = ratio < 0.3 ? 'high' : ratio < 0.6 ? 'medium' : 'low';

    items.push({
      indicator: item.indicator,
      score: item.score,
      max: item.max,
      ratio,
      priority,
      title: item.title,
      description: item.descriptions[tier as keyof typeof item.descriptions] ?? item.descriptions.middle,
    });
  }

  // Sort by priority: high → medium → low, then by ratio ascending
  return items.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.ratio - b.ratio;
  });
}

const PRIORITY_STYLES = {
  high: { dot: 'bg-negative', label: '優先度：高', text: 'text-negative' },
  medium: { dot: 'bg-warning', label: '優先度：中', text: 'text-warning' },
  low: { dot: 'bg-positive', label: '良好', text: 'text-positive' },
} as const;

export function ImprovementList({ breakdown, tier }: ImprovementListProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const recommendations = generateRecommendations(breakdown, tier);

  // Split into areas to improve vs good areas
  const toImprove = recommendations.filter((r) => r.priority !== 'low');
  const goodAreas = recommendations.filter((r) => r.priority === 'low');

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>改善ポイント</CardTitle>
        </CardHeader>

        {toImprove.length > 0 ? (
          <div className="space-y-3">
            {toImprove.map((rec, index) => (
              <motion.div
                key={rec.indicator}
                initial={{ opacity: 0, x: -8 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.1 * index, duration: 0.2 }}
                className="rounded-[var(--radius-md)] border border-border px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', PRIORITY_STYLES[rec.priority].dot)} />
                  <span className="text-sm font-medium text-foreground">{rec.title}</span>
                  <span className={cn('ml-auto text-xs', PRIORITY_STYLES[rec.priority].text)}>
                    {PRIORITY_STYLES[rec.priority].label}
                  </span>
                  <span className="text-xs tabular-nums text-ink-subtle">
                    {rec.score}/{rec.max}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                  {rec.description}
                </p>
                {/* Progress bar */}
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
                  <div
                    className={cn('h-full rounded-full', PRIORITY_STYLES[rec.priority].dot)}
                    style={{ width: `${rec.ratio * 100}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-positive">すべての指標が良好です。この調子を維持しましょう。</p>
        )}

        {/* Good areas */}
        {goodAreas.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-medium text-ink-subtle">良好な指標</p>
            <div className="flex flex-wrap gap-2">
              {goodAreas.map((rec) => (
                <span
                  key={rec.indicator}
                  className="inline-flex items-center gap-1.5 rounded-full bg-positive-bg px-3 py-1 text-xs text-positive"
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2.5 6.5L5 9L9.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {rec.title.replace('する', '').replace('を', '')}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
