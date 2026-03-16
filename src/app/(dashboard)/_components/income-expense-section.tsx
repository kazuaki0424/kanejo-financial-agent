'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { IncomeExpenseChart } from '@/components/charts/income-expense-chart';
import type { MonthlyChartPoint } from '@/app/(dashboard)/_actions/dashboard';

interface IncomeExpenseSectionProps {
  data: MonthlyChartPoint[];
}

export function IncomeExpenseSection({ data }: IncomeExpenseSectionProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  // Summary stats
  const totalIncome = data.reduce((s, d) => s + d.income, 0);
  const totalExpenses = data.reduce((s, d) => s + d.expenses, 0);
  const avgSavings = Math.round((totalIncome - totalExpenses) / data.length);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card>
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-[13px] font-medium text-foreground">月次収支推移</p>
          <p className="text-xs text-ink-subtle">
            平均差額{' '}
            <span className={avgSavings >= 0 ? 'text-positive' : 'text-negative'}>
              {avgSavings >= 0 ? '+' : ''}¥{new Intl.NumberFormat('ja-JP').format(avgSavings)}/月
            </span>
          </p>
        </div>
        <IncomeExpenseChart data={data} />
        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-positive" />
            <span className="text-xs text-ink-muted">収入</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-negative" />
            <span className="text-xs text-ink-muted">支出</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
