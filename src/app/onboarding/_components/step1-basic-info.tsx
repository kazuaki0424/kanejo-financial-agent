'use client';

import { useActionState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PREFECTURES } from '@/lib/validations/profile';
import { saveStep1 } from '@/app/onboarding/_actions/save-profile';

interface FormState {
  error: string | null;
  fieldErrors?: Record<string, string[]>;
}

interface Step1BasicInfoProps {
  onComplete: () => void;
}

export function Step1BasicInfo({ onComplete }: Step1BasicInfoProps): React.ReactElement {
  const wrappedAction = useCallback(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const result = await saveStep1(formData);
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
        <CardTitle>基本情報</CardTitle>
        <CardDescription>まずはあなたの基本的な情報を教えてください。</CardDescription>
      </CardHeader>

      <form action={formAction} className="flex flex-col gap-5">
        {/* 生年月日 */}
        <Input
          label="生年月日"
          name="birthDate"
          type="date"
          required
          error={state.fieldErrors?.birthDate?.[0]}
        />

        {/* 性別 */}
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-medium text-foreground">性別（任意）</legend>
          <div className="flex gap-3">
            {[
              { value: 'male', label: '男性' },
              { value: 'female', label: '女性' },
              { value: 'other', label: 'その他' },
            ].map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-border px-4 py-2.5 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary-light"
              >
                <input
                  type="radio"
                  name="gender"
                  value={option.value}
                  className="accent-[var(--color-primary)]"
                />
                {option.label}
              </label>
            ))}
          </div>
          {state.fieldErrors?.gender?.[0] && (
            <p className="text-sm text-negative" role="alert">{state.fieldErrors.gender[0]}</p>
          )}
        </fieldset>

        {/* 都道府県 */}
        <SelectField
          name="prefecture"
          label="お住まいの都道府県"
          error={state.fieldErrors?.prefecture?.[0]}
        />

        {/* 婚姻状況 */}
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-medium text-foreground">婚姻状況</legend>
          <div className="flex gap-3">
            {[
              { value: 'single', label: '未婚' },
              { value: 'married', label: '既婚' },
            ].map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-border px-4 py-2.5 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary-light"
              >
                <input
                  type="radio"
                  name="maritalStatus"
                  value={option.value}
                  className="accent-[var(--color-primary)]"
                  required
                />
                {option.label}
              </label>
            ))}
          </div>
          {state.fieldErrors?.maritalStatus?.[0] && (
            <p className="text-sm text-negative" role="alert">{state.fieldErrors.maritalStatus[0]}</p>
          )}
        </fieldset>

        {/* 扶養人数 */}
        <Input
          label="扶養家族の人数"
          name="dependents"
          type="number"
          min={0}
          max={20}
          defaultValue={0}
          hint="配偶者を除く被扶養者の人数"
          error={state.fieldErrors?.dependents?.[0]}
        />

        {/* エラーメッセージ */}
        {state.error && (
          <p className="text-sm text-negative" role="alert">{state.error}</p>
        )}

        {/* 送信ボタン */}
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? '保存中...' : '次へ'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// Hidden-input approach for Select (Radix Select doesn't support native form submission)
function SelectField({
  name,
  label,
  error,
}: {
  name: string;
  label: string;
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
        {PREFECTURES.map((pref) => (
          <SelectItem key={pref} value={pref}>
            {pref}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}
