'use client';

import { useActionState, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CurrencyInput } from '@/components/shared/currency-input';
import { saveStep4 } from '@/app/onboarding/_actions/save-profile';
import { formatCurrency } from '@/lib/utils/format';

const ASSET_FIELDS = [
  { key: 'cash', label: '預貯金', hint: '普通預金・定期預金' },
  { key: 'stocks', label: '株式', hint: '個別株・ETF' },
  { key: 'mutualFunds', label: '投資信託', hint: 'つみたてNISA・iDeCo含む' },
  { key: 'crypto', label: '暗号資産', hint: 'ビットコイン等' },
  { key: 'insuranceValue', label: '保険解約返戻金', hint: '貯蓄型保険の解約返戻金' },
  { key: 'otherAssets', label: 'その他', hint: '不動産・貴金属等' },
] as const;

const LIABILITY_FIELDS = [
  { key: 'mortgage', label: '住宅ローン', hint: '残高' },
  { key: 'carLoan', label: '自動車ローン', hint: '残高' },
  { key: 'studentLoan', label: '奨学金', hint: '残高' },
  { key: 'creditCard', label: 'クレジットカード', hint: 'リボ・分割の残高' },
  { key: 'otherLiabilities', label: 'その他の借入', hint: 'カードローン等' },
] as const;

interface FormState {
  error: string | null;
  fieldErrors?: Record<string, string[]>;
}

interface Step4AssetsProps {
  onComplete: () => void;
  onBack: () => void;
}

export function Step4Assets({ onComplete, onBack }: Step4AssetsProps): React.ReactElement {
  const [assetValues, setAssetValues] = useState<Record<string, number>>({});
  const [liabilityValues, setLiabilityValues] = useState<Record<string, number>>({});

  const totalAssets = Object.values(assetValues).reduce((s, v) => s + v, 0);
  const totalLiabilities = Object.values(liabilityValues).reduce((s, v) => s + v, 0);
  const netWorth = totalAssets - totalLiabilities;

  const wrappedAction = useCallback(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const result = await saveStep4(formData);
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
        <CardTitle>資産・負債</CardTitle>
        <CardDescription>現在の資産と負債のおおよその金額を教えてください。0円の項目はスキップできます。</CardDescription>
      </CardHeader>

      <form action={formAction} className="flex flex-col gap-6">
        {/* 純資産サマリー */}
        <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] px-4 py-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-ink-muted">純資産</span>
            <span className={`font-display text-2xl tabular-nums ${netWorth >= 0 ? 'text-positive' : 'text-negative'}`}>
              {netWorth < 0 ? '-' : ''}¥{formatCurrency(Math.abs(netWorth))}
            </span>
          </div>
          <div className="mt-1 flex justify-between text-xs text-ink-subtle">
            <span>資産: ¥{formatCurrency(totalAssets)}</span>
            <span>負債: ¥{formatCurrency(totalLiabilities)}</span>
          </div>
        </div>

        {/* 資産 */}
        <fieldset>
          <legend className="mb-3 text-sm font-medium text-foreground">資産</legend>
          <div className="flex flex-col gap-4">
            {ASSET_FIELDS.map((field) => (
              <CurrencyInput
                key={field.key}
                label={field.label}
                name={field.key}
                hint={field.hint}
                onChange={(v) => setAssetValues((prev) => ({ ...prev, [field.key]: v }))}
              />
            ))}
          </div>
        </fieldset>

        {/* 負債 */}
        <fieldset>
          <legend className="mb-3 text-sm font-medium text-foreground">負債</legend>
          <div className="flex flex-col gap-4">
            {LIABILITY_FIELDS.map((field) => (
              <CurrencyInput
                key={field.key}
                label={field.label}
                name={field.key}
                hint={field.hint}
                onChange={(v) => setLiabilityValues((prev) => ({ ...prev, [field.key]: v }))}
              />
            ))}
          </div>
        </fieldset>

        {state.error && (
          <p className="text-sm text-negative" role="alert">{state.error}</p>
        )}

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
