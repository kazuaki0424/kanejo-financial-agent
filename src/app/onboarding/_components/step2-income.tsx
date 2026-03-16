'use client';

import { useActionState, useCallback } from 'react';
import { Select, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CurrencyInput } from '@/components/shared/currency-input';
import { saveStep2 } from '@/app/onboarding/_actions/save-profile';

const OCCUPATION_OPTIONS = [
  { value: 'employee', label: '会社員' },
  { value: 'self_employed', label: '自営業・フリーランス' },
  { value: 'part_time', label: 'パート・アルバイト' },
  { value: 'retired', label: '退職・年金受給' },
  { value: 'student', label: '学生' },
  { value: 'other', label: 'その他' },
] as const;

interface FormState {
  error: string | null;
  fieldErrors?: Record<string, string[]>;
}

interface Step2IncomeProps {
  onComplete: () => void;
  onBack: () => void;
}

export function Step2Income({ onComplete, onBack }: Step2IncomeProps): React.ReactElement {
  const wrappedAction = useCallback(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const result = await saveStep2(formData);
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
        <CardTitle>収入情報</CardTitle>
        <CardDescription>現在の職業と年収を教えてください。</CardDescription>
      </CardHeader>

      <form action={formAction} className="flex flex-col gap-5">
        {/* 職業 */}
        <SelectField
          name="occupation"
          label="職業"
          options={OCCUPATION_OPTIONS}
          error={state.fieldErrors?.occupation?.[0]}
        />

        {/* 年収（税込） */}
        <CurrencyInput
          label="年収（税込）"
          name="annualIncome"
          hint="源泉徴収票の「支払金額」を入力してください"
          error={state.fieldErrors?.annualIncome?.[0]}
          min={0}
          max={1_000_000_000}
        />

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

function SelectField({
  name,
  label,
  options,
  error,
}: {
  name: string;
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  error?: string;
}): React.ReactElement {
  return (
    <div className="relative">
      <input type="hidden" name={name} id={`${name}-hidden`} />
      <Select
        label={label}
        placeholder="選択してください"
        error={error}
        onValueChange={(value) => {
          const hidden = document.getElementById(`${name}-hidden`) as HTMLInputElement | null;
          if (hidden) hidden.value = value;
        }}
      >
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}
