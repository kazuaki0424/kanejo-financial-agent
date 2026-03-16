'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Card } from '@/components/ui/card';
import type { ScoredService } from '@/lib/utils/service-comparison';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface AnnualMeritCardProps {
  topPick: ScoredService;
  monthlySpending: number;
}

export function AnnualMeritCard({ topPick, monthlySpending }: AnnualMeritCardProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const annualSpending = monthlySpending * 12;
  const rewardRate = topPick.annualBenefit / annualSpending;
  const fiveYearBenefit = topPick.annualBenefit * 5 - topPick.annualCost * 5;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-l-[3px] border-l-primary bg-primary-light">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 2L12.5 7.5L18 8L14 12L15 18L10 15L5 18L6 12L2 8L7.5 7.5L10 2Z" fill="currentColor" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {topPick.service.name}がおすすめです
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              月間支出¥{formatCurrency(monthlySpending)}に基づく試算
            </p>

            <div className="mt-3 grid grid-cols-3 gap-3">
              <MeritItem
                label="年間還元"
                value={`+¥${formatCurrency(topPick.annualBenefit)}`}
                color="text-positive"
              />
              <MeritItem
                label="実質還元率"
                value={`${(rewardRate * 100).toFixed(1)}%`}
                color="text-primary"
              />
              <MeritItem
                label="5年間メリット"
                value={`${fiveYearBenefit >= 0 ? '+' : ''}¥${formatCurrency(fiveYearBenefit)}`}
                color={fiveYearBenefit >= 0 ? 'text-positive' : 'text-negative'}
              />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function MeritItem({ label, value, color }: { label: string; value: string; color: string }): React.ReactElement {
  return (
    <div>
      <p className="text-[10px] text-ink-subtle">{label}</p>
      <p className={cn('text-sm font-medium tabular-nums', color)}>{value}</p>
    </div>
  );
}
