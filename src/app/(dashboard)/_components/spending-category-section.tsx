'use client';

import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DonutChart } from '@/components/charts/donut-chart';
import { formatCurrency } from '@/lib/utils/format';
import type { ExpenseCategoryData } from '@/app/(dashboard)/_actions/dashboard';
import { cn } from '@/lib/utils/cn';

interface SpendingCategorySectionProps {
  categories: ExpenseCategoryData[];
}

export function SpendingCategorySection({ categories }: SpendingCategorySectionProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const totalExpenses = categories.reduce((s, c) => s + c.amount, 0);
  const fixedTotal = categories.filter((c) => c.isFixed).reduce((s, c) => s + c.amount, 0);
  const variableTotal = totalExpenses - fixedTotal;

  const chartData = categories.map((c) => ({
    label: c.label,
    amount: c.amount,
    color: c.color,
  }));

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card>
        <p className="mb-4 text-[13px] font-medium text-foreground">支出カテゴリ分析</p>

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* ドーナツチャート */}
          <div className="shrink-0">
            <DonutChart
              data={chartData}
              centerLabel="月間支出"
              centerValue={`¥${formatCurrency(totalExpenses)}`}
              activeIndex={activeIndex}
              onActiveChange={setActiveIndex}
            />

            {/* 固定費 / 変動費 サマリー */}
            <div className="mt-3 flex justify-center gap-4 text-xs">
              <div className="text-center">
                <p className="text-ink-subtle">固定費</p>
                <p className="font-medium tabular-nums text-foreground">¥{formatCurrency(fixedTotal)}</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-ink-subtle">変動費</p>
                <p className="font-medium tabular-nums text-foreground">¥{formatCurrency(variableTotal)}</p>
              </div>
            </div>
          </div>

          {/* カテゴリリスト */}
          <div className="flex-1 space-y-1">
            {categories.map((cat, index) => (
              <div key={cat.category}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-left transition-colors',
                    'hover:bg-[var(--color-surface-hover)]',
                    activeIndex === index && 'bg-[var(--color-surface-hover)]',
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={() => setExpandedCategory(
                    expandedCategory === cat.category ? null : cat.category,
                  )}
                >
                  {/* Color dot */}
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: cat.color }}
                  />

                  {/* Label */}
                  <span className="flex-1 text-sm text-foreground">{cat.label}</span>

                  {/* Badge */}
                  {cat.isFixed && (
                    <Badge variant="default" className="text-[10px]">固定</Badge>
                  )}

                  {/* Amount + Percentage */}
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums text-foreground">
                      ¥{formatCurrency(cat.amount)}
                    </p>
                    <p className="text-[11px] tabular-nums text-ink-subtle">{cat.percentage}%</p>
                  </div>

                  {/* Chevron */}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className={cn(
                      'shrink-0 text-ink-subtle transition-transform',
                      expandedCategory === cat.category && 'rotate-90',
                    )}
                    aria-hidden="true"
                  >
                    <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Expanded detail */}
                <AnimatePresence>
                  {expandedCategory === cat.category && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <CategoryDetail
                        category={cat}
                        totalExpenses={totalExpenses}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function CategoryDetail({
  category,
  totalExpenses,
}: {
  category: ExpenseCategoryData;
  totalExpenses: number;
}): React.ReactElement {
  const annualAmount = category.amount * 12;
  const ratio = totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0;

  return (
    <div className="ml-9 mr-3 mb-2 rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] px-3 py-2.5">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div>
          <span className="text-ink-subtle">月額</span>
          <p className="font-medium tabular-nums text-foreground">¥{formatCurrency(category.amount)}</p>
        </div>
        <div>
          <span className="text-ink-subtle">年額</span>
          <p className="font-medium tabular-nums text-foreground">¥{formatCurrency(annualAmount)}</p>
        </div>
        <div>
          <span className="text-ink-subtle">全体比率</span>
          <p className="font-medium tabular-nums text-foreground">{ratio.toFixed(1)}%</p>
        </div>
        <div>
          <span className="text-ink-subtle">種別</span>
          <p className="font-medium text-foreground">{category.isFixed ? '固定費' : '変動費'}</p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${ratio}%`,
            backgroundColor: category.color,
          }}
        />
      </div>
    </div>
  );
}
