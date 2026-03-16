'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TaxSavingsSummary } from '@/lib/utils/tax-savings';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface TaxSavingsDashboardProps {
  summary: TaxSavingsSummary;
}

const STATUS_STYLES = {
  active: { bg: 'bg-positive-bg', text: 'text-positive', badge: 'primary' as const },
  available: { bg: 'bg-[var(--color-surface-alt)]', text: 'text-ink-muted', badge: 'default' as const },
  not_eligible: { bg: 'bg-[var(--color-surface-alt)]', text: 'text-ink-subtle', badge: 'default' as const },
} as const;

const CATEGORY_LABELS = {
  deduction: '所得控除',
  investment: '非課税投資',
  donation: '寄付金控除',
} as const;

export function TaxSavingsDashboard({ summary }: TaxSavingsDashboardProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="space-y-6">
      {/* メトリクスカード */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <p className="text-[11px] text-ink-muted">実行中の節税額</p>
            <p className="mt-1 font-display text-3xl tabular-nums text-primary">
              ¥{formatCurrency(summary.totalActiveSaving)}
            </p>
            <p className="mt-1 text-xs text-ink-subtle">/年</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <p className="text-[11px] text-ink-muted">節税ポテンシャル</p>
            <p className="mt-1 font-display text-3xl tabular-nums text-foreground">
              ¥{formatCurrency(summary.totalPotentialSaving)}
            </p>
            <p className="mt-1 text-xs text-ink-subtle">/年（最大）</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <p className="text-[11px] text-ink-muted">活用率</p>
            <div className="mt-1 flex items-end gap-2">
              <p className="font-display text-3xl tabular-nums text-foreground">
                {Math.round(summary.utilizationRate * 100)}
              </p>
              <p className="mb-1 text-lg text-ink-muted">%</p>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={isInView ? { width: `${summary.utilizationRate * 100}%` } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
              />
            </div>
          </Card>
        </motion.div>
      </div>

      {/* 節税施策一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>節税施策</CardTitle>
        </CardHeader>

        <div className="space-y-2">
          {summary.items.map((item, i) => {
            const style = STATUS_STYLES[item.status];

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.05 * i, duration: 0.2 }}
                className={cn(
                  'rounded-[var(--radius-md)] border border-border px-4 py-3',
                  item.status === 'active' && 'border-l-[3px] border-l-positive',
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Status indicator */}
                  <div className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full', style.bg)}>
                    {item.status === 'active' ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-positive" /></svg>
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-ink-subtle" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                      <Badge variant={style.badge} className="text-[10px]">{item.statusLabel}</Badge>
                      <Badge variant="default" className="text-[9px]">{CATEGORY_LABELS[item.category]}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-muted">{item.description}</p>

                    {/* Saving bar */}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              item.status === 'active' ? 'bg-positive' : 'bg-ink-subtle',
                            )}
                            style={{ width: `${item.maxSaving > 0 ? (item.annualSaving / item.maxSaving) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs tabular-nums">
                        <span className={item.annualSaving > 0 ? 'font-medium text-positive' : 'text-ink-subtle'}>
                          ¥{formatCurrency(item.annualSaving)}
                        </span>
                        <span className="text-ink-subtle"> / ¥{formatCurrency(item.maxSaving)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <Button asChild variant="ghost" size="sm" className="shrink-0 text-xs">
                    <Link href={item.actionHref}>{item.actionLabel}</Link>
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
