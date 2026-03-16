'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { calculateFurusatoLimit, type Deduction } from '@/lib/utils/calculations';
import { FURUSATO_CATEGORIES, suggestAllocation, type FurusatoCategory } from '@/lib/constants/furusato';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface FurusatoSimulatorProps {
  annualSalary: number;
  maritalStatus: string;
  dependents: number;
  furusatoLimit: number;
}

export function FurusatoSimulator({
  annualSalary,
  maritalStatus,
  dependents,
  furusatoLimit: initialLimit,
}: FurusatoSimulatorProps): React.ReactElement {
  const [salary, setSalary] = useState(annualSalary);
  const [idecoAmount, setIdecoAmount] = useState(0);
  const [donationAmount, setDonationAmount] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  // Recalculate limit based on adjustable params
  const deductions: Deduction[] = useMemo(() => {
    const d: Deduction[] = [];
    if (maritalStatus === 'married') d.push({ type: 'spouse', amount: 1 });
    if (dependents > 0) d.push({ type: 'dependent_general', amount: dependents });
    if (idecoAmount > 0) d.push({ type: 'ideco', amount: idecoAmount });
    return d;
  }, [maritalStatus, dependents, idecoAmount]);

  const limit = useMemo(
    () => calculateFurusatoLimit(salary, deductions),
    [salary, deductions],
  );

  const suggestions = useMemo(() => suggestAllocation(limit), [limit]);

  const usagePercent = limit > 0 ? Math.min(100, (donationAmount / limit) * 100) : 0;
  const remaining = Math.max(0, limit - donationAmount);
  const selfPay = donationAmount > 0 ? 2_000 : 0;
  const taxSaving = Math.max(0, donationAmount - selfPay);

  const toggleCategory = useCallback((id: string): void => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* 上限額カード */}
      <Card>
        <CardHeader>
          <CardTitle>ふるさと納税 控除上限額</CardTitle>
          <CardDescription>
            自己負担2,000円で寄付できる上限額の目安です
          </CardDescription>
        </CardHeader>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-ink-subtle">控除上限額（目安）</p>
            <p className="font-display text-4xl tabular-nums text-primary">
              ¥{formatCurrency(limit)}
            </p>
          </div>
          <div className="text-right text-xs text-ink-subtle">
            <p>年収: ¥{formatCurrency(salary)}</p>
            <p>{maritalStatus === 'married' ? '既婚' : '未婚'} / 扶養{dependents}人</p>
          </div>
        </div>

        {/* Usage gauge */}
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-ink-muted">寄付済み: ¥{formatCurrency(donationAmount)}</span>
            <span className="text-ink-muted">残り: ¥{formatCurrency(remaining)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
            <motion.div
              className={cn(
                'h-full rounded-full',
                usagePercent > 100 ? 'bg-negative' : usagePercent > 80 ? 'bg-warning' : 'bg-primary',
              )}
              animate={{ width: `${Math.min(100, usagePercent)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {usagePercent > 100 && (
            <p className="mt-1 text-xs text-negative">
              上限を超えています。超過分は自己負担になります。
            </p>
          )}
        </div>
      </Card>

      {/* シミュレーション調整 */}
      <Card>
        <CardHeader>
          <CardTitle>シミュレーション</CardTitle>
        </CardHeader>

        <div className="space-y-5">
          <Slider
            label="年収"
            value={[salary]}
            min={0}
            max={30_000_000}
            step={500_000}
            onValueChange={([v]) => setSalary(v)}
            formatValue={(v) => `¥${formatCurrency(v)}`}
          />

          <Slider
            label="iDeCo掛金（年額）"
            value={[idecoAmount]}
            min={0}
            max={816_000}
            step={12_000}
            onValueChange={([v]) => setIdecoAmount(v)}
            formatValue={(v) => `¥${formatCurrency(v)}`}
          />

          <Slider
            label="寄付予定額"
            value={[donationAmount]}
            min={0}
            max={Math.max(limit * 1.5, 100_000)}
            step={5_000}
            onValueChange={([v]) => setDonationAmount(v)}
            formatValue={(v) => `¥${formatCurrency(v)}`}
          />
        </div>

        {/* 節税効果 */}
        {donationAmount > 0 && (
          <div className="mt-4 rounded-[var(--radius-md)] bg-primary-light px-4 py-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink-muted">節税効果</span>
              <span className="font-display text-xl tabular-nums text-primary">
                ¥{formatCurrency(taxSaving)}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-subtle">
              自己負担: ¥{formatCurrency(selfPay)}
              {donationAmount > limit && ` + 超過分 ¥${formatCurrency(donationAmount - limit)}`}
            </p>
          </div>
        )}
      </Card>

      {/* 返礼品カテゴリ */}
      <Card>
        <CardHeader>
          <CardTitle>返礼品カテゴリ</CardTitle>
          <CardDescription>
            上限額 ¥{formatCurrency(limit)} でおすすめの返礼品
          </CardDescription>
        </CardHeader>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FURUSATO_CATEGORIES.map((category) => {
            const isSelected = selectedCategories.has(category.id);
            const suggestion = suggestions.find((s) => s.category.id === category.id);

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={cn(
                  'rounded-[var(--radius-md)] border px-3 py-3 text-left transition-colors',
                  isSelected
                    ? 'border-primary bg-primary-light'
                    : 'border-border hover:bg-[var(--color-surface-hover)]',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.icon}</span>
                  <span className="text-sm font-medium text-foreground">{category.label}</span>
                </div>
                <p className="mt-1 text-[10px] text-ink-subtle">{category.description}</p>
                {suggestion && (
                  <Badge variant="primary" className="mt-1.5 text-[10px]">
                    ~¥{formatCurrency(suggestion.suggestedAmount)}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* 選択カテゴリの人気アイテム */}
        {selectedCategories.size > 0 && (
          <div className="mt-4 space-y-3">
            {FURUSATO_CATEGORIES.filter((c) => selectedCategories.has(c.id)).map((category) => (
              <CategoryItems key={category.id} category={category} />
            ))}
          </div>
        )}
      </Card>

      {/* おすすめ配分 */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>おすすめ配分</CardTitle>
            <CardDescription>上限額を効率よく使うプラン</CardDescription>
          </CardHeader>
          <div className="space-y-2">
            {suggestions.map(({ category, suggestedAmount }) => (
              <div key={category.id} className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2">
                <span className="text-lg">{category.icon}</span>
                <span className="flex-1 text-sm text-foreground">{category.label}</span>
                <span className="text-sm font-medium tabular-nums text-foreground">
                  ¥{formatCurrency(suggestedAmount)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="text-sm text-ink-muted">合計</span>
              <span className="text-sm font-medium tabular-nums text-foreground">
                ¥{formatCurrency(suggestions.reduce((s, x) => s + x.suggestedAmount, 0))}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function CategoryItems({ category }: { category: FurusatoCategory }): React.ReactElement {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-ink-muted">
        {category.icon} {category.label} — 人気の返礼品
      </p>
      <div className="space-y-1">
        {category.popularItems.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] px-3 py-2"
          >
            <div>
              <p className="text-sm text-foreground">{item.name}</p>
              <p className="text-[10px] text-ink-subtle">{item.description}</p>
            </div>
            <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
              ¥{formatCurrency(item.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
