'use client';

import { useMemo, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  analyzeInsurance,
  LIFE_STAGE_LABELS,
  type InsuranceProfile,
  type CoverageNeed,
  type InsuranceSuggestion,
} from '@/lib/utils/insurance-analyzer';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface InsuranceReviewViewProps {
  profile: InsuranceProfile;
}

const STATUS_CONFIG = {
  sufficient: { label: '適正', color: 'text-positive', bg: 'bg-positive-bg', dot: 'bg-positive' },
  insufficient: { label: '不足', color: 'text-negative', bg: 'bg-negative-bg', dot: 'bg-negative' },
  excessive: { label: '過剰', color: 'text-warning', bg: 'bg-warning-bg', dot: 'bg-warning' },
  not_needed: { label: '不要', color: 'text-ink-subtle', bg: 'bg-[var(--color-surface-alt)]', dot: 'bg-ink-subtle' },
} as const;

export function InsuranceReviewView({ profile }: InsuranceReviewViewProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const analysis = useMemo(() => analyzeInsurance(profile), [profile]);

  return (
    <div ref={ref} className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.3 }}>
          <Card>
            <p className="text-[11px] text-ink-muted">保障スコア</p>
            <p className={cn('mt-1 font-display text-3xl tabular-nums', analysis.overallScore >= 70 ? 'text-positive' : analysis.overallScore >= 40 ? 'text-warning' : 'text-negative')}>
              {analysis.overallScore}
            </p>
            <p className="text-[10px] text-ink-subtle">/100</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.3, delay: 0.05 }}>
          <Card>
            <p className="text-[11px] text-ink-muted">ライフステージ</p>
            <p className="mt-1 text-sm font-medium text-foreground">{LIFE_STAGE_LABELS[analysis.lifeStage]}</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card>
            <p className="text-[11px] text-ink-muted">月額保険料</p>
            <p className="mt-1 font-display text-xl tabular-nums text-foreground">¥{formatCurrency(analysis.totalMonthlyPremium)}</p>
            <p className="text-[10px] text-ink-subtle">推奨: ¥{formatCurrency(analysis.recommendedMonthlyBudget)}</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.3, delay: 0.15 }}>
          <Card>
            <p className="text-[11px] text-ink-muted">収入対比</p>
            <p className={cn('mt-1 font-display text-xl tabular-nums', analysis.premiumRatio > 0.10 ? 'text-warning' : 'text-foreground')}>
              {(analysis.premiumRatio * 100).toFixed(1)}%
            </p>
            <p className="text-[10px] text-ink-subtle">目安: 7%以下</p>
          </Card>
        </motion.div>
      </div>

      {/* Gap analysis */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>保障ギャップ分析</CardTitle>
            <CardDescription>必要保障額と現在の保障のギャップを分析します</CardDescription>
          </CardHeader>

          <div className="space-y-4">
            {analysis.needs.map((need) => (
              <CoverageNeedCard key={need.type} need={need} />
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>改善提案</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {analysis.suggestions.map((s) => (
                <SuggestionCard key={s.title} suggestion={s} />
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function CoverageNeedCard({ need }: { need: CoverageNeed }): React.ReactElement {
  const config = STATUS_CONFIG[need.status];
  const coverageRatio = need.requiredAmount > 0
    ? Math.min(100, (need.currentAmount / need.requiredAmount) * 100)
    : need.status === 'not_needed' ? 100 : 0;

  return (
    <div className={cn('rounded-[var(--radius-md)] border border-border px-4 py-3', need.status === 'insufficient' && 'border-l-[3px] border-l-negative')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', config.dot)} />
          <span className="text-sm font-medium text-foreground">{need.label}</span>
          <Badge variant="default" className={cn('text-[10px]', config.color)}>{config.label}</Badge>
          {need.priority === 'high' && <Badge variant="default" className="text-[10px] text-negative">優先</Badge>}
        </div>
      </div>

      <p className="mt-1 text-xs text-ink-muted">{need.description}</p>

      {/* Coverage bar */}
      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-[10px] text-ink-subtle">
            <span>現在: ¥{formatCurrency(need.currentAmount)}</span>
            <span>必要: ¥{formatCurrency(need.requiredAmount)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
            <div
              className={cn('h-full rounded-full', config.dot)}
              style={{ width: `${coverageRatio}%` }}
            />
          </div>
        </div>
        {need.gap !== 0 && need.status !== 'not_needed' && (
          <span className={cn('shrink-0 text-xs font-medium tabular-nums', need.gap > 0 ? 'text-negative' : 'text-warning')}>
            {need.gap > 0 ? `不足 ¥${formatCurrency(need.gap)}` : `超過 ¥${formatCurrency(Math.abs(need.gap))}`}
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-ink-muted">{need.recommendation}</p>
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: InsuranceSuggestion }): React.ReactElement {
  const borderColor = suggestion.priority === 'high' ? 'border-l-positive' : suggestion.priority === 'medium' ? 'border-l-primary' : 'border-l-border';

  return (
    <div className={cn('rounded-[var(--radius-md)] border border-border border-l-[3px] px-4 py-3', borderColor)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">{suggestion.title}</span>
        {suggestion.potentialSaving > 0 && (
          <Badge variant="primary" className="text-[10px]">年間¥{formatCurrency(suggestion.potentialSaving)}削減</Badge>
        )}
      </div>
      <p className="mt-1 text-xs text-ink-muted">{suggestion.description}</p>
    </div>
  );
}
