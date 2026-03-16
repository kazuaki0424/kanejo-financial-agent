'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ScoredService } from '@/lib/utils/service-comparison';
import { getServiceDetail } from '@/lib/constants/service-details';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface ServiceDetailPanelProps {
  scored: ScoredService | null;
  currentMonthlyCost?: number;
  onClose: () => void;
}

export function ServiceDetailPanel({ scored, currentMonthlyCost, onClose }: ServiceDetailPanelProps): React.ReactElement {
  if (!scored) return <></>;

  const detail = getServiceDetail(scored.service.id);
  const { service, score, annualCost, annualBenefit, netValue, isRecommended } = scored;

  const switchSaving = currentMonthlyCost
    ? (currentMonthlyCost * 12) - annualCost
    : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <Card>
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-medium text-foreground">{service.name}</h2>
                {isRecommended && <Badge variant="primary">おすすめ</Badge>}
              </div>
              <p className="mt-0.5 text-sm text-ink-muted">{service.provider}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
              ✕
            </Button>
          </div>

          <p className="mt-2 text-sm text-ink-muted">{service.description}</p>

          {/* Score + Cost summary */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] px-3 py-2 text-center">
              <p className="text-[10px] text-ink-subtle">スコア</p>
              <p className={cn('text-lg font-medium tabular-nums', score >= 80 ? 'text-primary' : 'text-foreground')}>{score}</p>
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] px-3 py-2 text-center">
              <p className="text-[10px] text-ink-subtle">年間コスト</p>
              <p className="text-lg font-medium tabular-nums text-foreground">
                {annualCost === 0 ? '無料' : `¥${formatCurrency(annualCost)}`}
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] px-3 py-2 text-center">
              <p className="text-[10px] text-ink-subtle">評価</p>
              <p className="text-lg font-medium tabular-nums text-foreground">★ {service.rating}</p>
            </div>
          </div>

          {/* Switch saving */}
          {switchSaving > 0 && (
            <div className="mt-4 rounded-[var(--radius-md)] border-l-[3px] border-primary bg-primary-light px-4 py-3">
              <p className="text-xs text-ink-muted">乗り換えた場合の年間節約額</p>
              <p className="mt-0.5 font-display text-xl tabular-nums text-primary">
                ¥{formatCurrency(switchSaving)}/年
              </p>
              <p className="mt-0.5 text-[10px] text-ink-subtle">
                月額¥{formatCurrency(Math.round(switchSaving / 12))}の削減
              </p>
            </div>
          )}

          {/* Features */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-ink-muted">スペック</p>
            <div className="space-y-1">
              {service.features.map((f) => (
                <div key={f.label} className="flex justify-between rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] px-3 py-1.5 text-xs">
                  <span className="text-ink-muted">{f.label}</span>
                  <span className="font-medium text-foreground">{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pros / Cons */}
          {detail && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="mb-2 text-xs font-medium text-positive">メリット</p>
                <ul className="space-y-1.5">
                  {detail.pros.map((pro) => (
                    <li key={pro} className="flex items-start gap-1.5 text-xs text-ink-muted">
                      <span className="mt-0.5 text-positive">○</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-negative">デメリット</p>
                <ul className="space-y-1.5">
                  {detail.cons.map((con) => (
                    <li key={con} className="flex items-start gap-1.5 text-xs text-ink-muted">
                      <span className="mt-0.5 text-negative">△</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Use cases */}
          {detail && detail.useCases.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-ink-muted">こんな方におすすめ</p>
              <div className="flex flex-wrap gap-1.5">
                {detail.useCases.map((uc) => (
                  <Badge key={uc} variant="default" className="text-[10px]">{uc}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {detail && detail.reviews.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-ink-muted">ユーザーの声</p>
              <div className="space-y-2">
                {detail.reviews.map((review, i) => (
                  <div key={i} className="rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, j) => (
                          <svg key={j} width="10" height="10" viewBox="0 0 12 12" fill={j < review.rating ? 'var(--chart-3)' : 'none'} stroke="var(--chart-3)" strokeWidth="1" aria-hidden="true">
                            <path d="M6 1L7.5 4.2L11 4.6L8.5 7L9.2 10.5L6 8.8L2.8 10.5L3.5 7L1 4.6L4.5 4.2L6 1Z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-[10px] text-ink-subtle">{review.userType}</span>
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Highlights */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {service.highlights.map((h) => (
              <Badge key={h} variant="primary" className="text-[10px]">{h}</Badge>
            ))}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
