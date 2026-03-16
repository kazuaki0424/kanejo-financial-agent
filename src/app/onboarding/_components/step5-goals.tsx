'use client';

import { useActionState, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FINANCIAL_GOAL_OPTIONS } from '@/lib/validations/profile';
import { saveStep5 } from '@/app/onboarding/_actions/save-profile';
import { cn } from '@/lib/utils/cn';

const RISK_OPTIONS = [
  {
    value: 'conservative',
    label: '安定重視',
    description: '元本割れのリスクをできるだけ避けたい',
  },
  {
    value: 'moderate',
    label: 'バランス型',
    description: 'ある程度のリスクを取ってリターンも狙いたい',
  },
  {
    value: 'aggressive',
    label: '積極運用',
    description: '多少のリスクを許容してリターンを最大化したい',
  },
] as const;

interface FormState {
  error: string | null;
  fieldErrors?: Record<string, string[]>;
  tier?: 'basic' | 'middle' | 'high_end';
  annualIncome?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  netWorth?: number;
}

interface Step5GoalsProps {
  onComplete: (result: FormState) => void;
  onBack: () => void;
}

export function Step5Goals({ onComplete, onBack }: Step5GoalsProps): React.ReactElement {
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set());
  const [riskTolerance, setRiskTolerance] = useState<string>('');

  const toggleGoal = useCallback((value: string): void => {
    setSelectedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }, []);

  const wrappedAction = useCallback(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const result = await saveStep5(formData);
      if (!result.error) {
        onComplete(result);
      }
      return result;
    },
    [onComplete],
  );

  const [state, formAction, isPending] = useActionState(wrappedAction, { error: null });

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>目標設定</CardTitle>
        <CardDescription>あなたの金融目標とリスクに対する考え方を教えてください。</CardDescription>
      </CardHeader>

      <form action={formAction} className="flex flex-col gap-6">
        {/* Hidden input for goals */}
        <input
          type="hidden"
          name="financialGoals"
          value={Array.from(selectedGoals).join(',')}
        />
        <input type="hidden" name="riskTolerance" value={riskTolerance} />

        {/* 金融目標（複数選択） */}
        <fieldset>
          <legend className="mb-3 text-sm font-medium text-foreground">
            金融目標（複数選択可）
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {FINANCIAL_GOAL_OPTIONS.map((goal) => {
              const isSelected = selectedGoals.has(goal.value);
              return (
                <button
                  key={goal.value}
                  type="button"
                  onClick={() => toggleGoal(goal.value)}
                  className={cn(
                    'rounded-[var(--radius-md)] border px-3 py-2.5 text-left text-sm transition-colors',
                    isSelected
                      ? 'border-primary bg-primary-light font-medium text-primary'
                      : 'border-border text-foreground hover:bg-[var(--color-surface-hover)]',
                  )}
                >
                  {goal.label}
                </button>
              );
            })}
          </div>
          {state.fieldErrors?.financialGoals?.[0] && (
            <p className="mt-2 text-sm text-negative" role="alert">
              {state.fieldErrors.financialGoals[0]}
            </p>
          )}
        </fieldset>

        {/* リスク許容度 */}
        <fieldset>
          <legend className="mb-3 text-sm font-medium text-foreground">
            リスク許容度
          </legend>
          <div className="flex flex-col gap-2">
            {RISK_OPTIONS.map((option) => {
              const isSelected = riskTolerance === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRiskTolerance(option.value)}
                  className={cn(
                    'rounded-[var(--radius-md)] border px-4 py-3 text-left transition-colors',
                    isSelected
                      ? 'border-primary bg-primary-light'
                      : 'border-border hover:bg-[var(--color-surface-hover)]',
                  )}
                >
                  <span className={cn('text-sm font-medium', isSelected ? 'text-primary' : 'text-foreground')}>
                    {option.label}
                  </span>
                  <p className="mt-0.5 text-xs text-ink-muted">{option.description}</p>
                </button>
              );
            })}
          </div>
          {state.fieldErrors?.riskTolerance?.[0] && (
            <p className="mt-2 text-sm text-negative" role="alert">
              {state.fieldErrors.riskTolerance[0]}
            </p>
          )}
        </fieldset>

        {state.error && (
          <p className="text-sm text-negative" role="alert">{state.error}</p>
        )}

        <div className="flex justify-between pt-2">
          <Button type="button" variant="ghost" onClick={onBack}>
            戻る
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? '保存中...' : '完了'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
