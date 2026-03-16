'use client';

import { useActionState, useState, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { saveStep3 } from '@/app/onboarding/_actions/save-profile';
import { formatCurrency } from '@/lib/utils/format';

const EXPENSE_CATEGORIES = [
  { key: 'housing', label: '住居費', hint: '家賃・住宅ローン', max: 500_000, step: 5_000, defaultValue: 80_000 },
  { key: 'food', label: '食費', hint: '自炊・外食含む', max: 200_000, step: 5_000, defaultValue: 50_000 },
  { key: 'transportation', label: '交通費', hint: '通勤・車両維持費', max: 100_000, step: 1_000, defaultValue: 10_000 },
  { key: 'utilities', label: '水道光熱費', hint: '電気・ガス・水道', max: 100_000, step: 1_000, defaultValue: 15_000 },
  { key: 'communication', label: '通信費', hint: 'スマホ・インターネット', max: 50_000, step: 500, defaultValue: 10_000 },
  { key: 'insurance', label: '保険料', hint: '生命保険・医療保険', max: 200_000, step: 1_000, defaultValue: 10_000 },
  { key: 'entertainment', label: '娯楽・交際費', hint: '趣味・飲み会・旅行', max: 200_000, step: 5_000, defaultValue: 30_000 },
  { key: 'other', label: 'その他', hint: '衣服・日用品・教育費等', max: 200_000, step: 5_000, defaultValue: 20_000 },
] as const;

interface FormState {
  error: string | null;
  fieldErrors?: Record<string, string[]>;
}

interface Step3ExpensesProps {
  onComplete: () => void;
  onBack: () => void;
}

export function Step3Expenses({ onComplete, onBack }: Step3ExpensesProps): React.ReactElement {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const cat of EXPENSE_CATEGORIES) {
      initial[cat.key] = cat.defaultValue;
    }
    return initial;
  });

  const totalMonthly = Object.values(values).reduce((sum, v) => sum + v, 0);

  const wrappedAction = useCallback(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const result = await saveStep3(formData);
      if (!result.error) {
        onComplete();
      }
      return result;
    },
    [onComplete],
  );

  const [state, formAction, isPending] = useActionState(wrappedAction, { error: null });

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>月々の支出</CardTitle>
        <CardDescription>
          おおよその金額をスライダーで調整してください。正確でなくても構いません。
        </CardDescription>
      </CardHeader>

      <form action={formAction} className="flex flex-col gap-5">
        {/* 合計表示 */}
        <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] px-4 py-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-ink-muted">月間支出合計</span>
            <span className="font-display text-2xl text-foreground tabular-nums">
              ¥{formatCurrency(totalMonthly)}
            </span>
          </div>
          <div className="mt-1 text-xs text-ink-subtle">
            年間: ¥{formatCurrency(totalMonthly * 12)}
          </div>
        </div>

        {/* カテゴリ別スライダー */}
        <div className="flex flex-col gap-4">
          {EXPENSE_CATEGORIES.map((cat) => (
            <div key={cat.key}>
              <input type="hidden" name={cat.key} value={values[cat.key]} />
              <Slider
                label={cat.label}
                value={[values[cat.key]]}
                min={0}
                max={cat.max}
                step={cat.step}
                onValueChange={([val]) => {
                  setValues((prev) => ({ ...prev, [cat.key]: val }));
                }}
                formatValue={(v) => `¥${formatCurrency(v)}`}
              />
              <p className="mt-0.5 text-[11px] text-ink-subtle">{cat.hint}</p>
            </div>
          ))}
        </div>

        {/* エラーメッセージ */}
        {state.error && (
          <p className="text-sm text-negative" role="alert">{state.error}</p>
        )}

        {/* ボタン */}
        <div className="flex justify-between pt-2">
          <Button type="button" variant="ghost" onClick={onBack}>
            戻る
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? '保存中...' : '次へ'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
