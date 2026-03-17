'use client';

import { useActionState, useState, useCallback, useOptimistic } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Select, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CurrencyInput } from '@/components/shared/currency-input';
import { PREFECTURES, FINANCIAL_GOAL_OPTIONS } from '@/lib/validations/profile';
import { cn } from '@/lib/utils/cn';
import { updateProfile, type ProfileCore } from '@/app/(dashboard)/settings/_actions/profile';

const OCCUPATION_OPTIONS = [
  { value: 'employee', label: '会社員' },
  { value: 'self_employed', label: '自営業・フリーランス' },
  { value: 'part_time', label: 'パート・アルバイト' },
  { value: 'retired', label: '退職・年金受給' },
  { value: 'student', label: '学生' },
  { value: 'other', label: 'その他' },
] as const;

const RISK_OPTIONS = [
  { value: 'conservative', label: '安定重視' },
  { value: 'moderate', label: 'バランス型' },
  { value: 'aggressive', label: '積極運用' },
] as const;

const TIER_LABELS: Record<string, string> = {
  basic: 'ベーシック',
  middle: 'ミドル',
  high_end: 'ハイエンド',
};

interface FormState {
  error: string | null;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

interface ProfileEditFormProps {
  profile: ProfileCore;
  children?: React.ReactNode;
}

export function ProfileEditForm({ profile, children }: ProfileEditFormProps): React.ReactElement {
  // Optimistic tier display
  const [optimisticTier, setOptimisticTier] = useOptimistic(profile.tier);

  // Controlled state for selects/toggles (Radix selects need controlled state)
  const [gender, setGender] = useState(profile.gender ?? '');
  const [prefecture, setPrefecture] = useState(profile.prefecture);
  const [maritalStatus, setMaritalStatus] = useState(profile.maritalStatus);
  const [occupation, setOccupation] = useState(profile.occupation);
  const [riskTolerance, setRiskTolerance] = useState(profile.riskTolerance ?? '');
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(
    new Set(profile.financialGoals ?? []),
  );
  const [annualIncome, setAnnualIncome] = useState(profile.annualIncome);
  const [showSuccess, setShowSuccess] = useState(false);

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
      // Optimistic: update tier based on new income
      const newIncome = Number(formData.get('annualIncome'));
      const newTier = newIncome >= 15_000_000 ? 'high_end' : newIncome >= 5_000_000 ? 'middle' : 'basic';
      setOptimisticTier(newTier);

      const result = await updateProfile(formData);
      if (!result.error) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        return { error: null, success: true };
      }
      return result;
    },
    [setOptimisticTier],
  );

  const [state, formAction, isPending] = useActionState(wrappedAction, { error: null });

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden fields for controlled components */}
      <input type="hidden" name="gender" value={gender} />
      <input type="hidden" name="prefecture" value={prefecture} />
      <input type="hidden" name="maritalStatus" value={maritalStatus} />
      <input type="hidden" name="occupation" value={occupation} />
      <input type="hidden" name="riskTolerance" value={riskTolerance} />
      <input type="hidden" name="financialGoals" value={Array.from(selectedGoals).join(',')} />
      <input type="hidden" name="annualIncome" value={annualIncome} />

      {/* ティア表示 */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-ink-muted">現在のプラン:</span>
        <Badge variant="primary">{TIER_LABELS[optimisticTier] ?? optimisticTier}</Badge>
      </div>

      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="生年月日"
            name="birthDate"
            type="date"
            defaultValue={profile.birthDate}
            error={state.fieldErrors?.birthDate?.[0]}
          />

          <div>
            <span className="mb-1.5 block text-sm font-medium text-foreground">性別</span>
            <div className="flex gap-2">
              {[
                { value: 'male', label: '男性' },
                { value: 'female', label: '女性' },
                { value: 'other', label: 'その他' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGender(opt.value)}
                  className={cn(
                    'rounded-[var(--radius-md)] border px-3 py-2 text-sm transition-colors',
                    gender === opt.value
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-border text-foreground hover:bg-[var(--color-surface-hover)]',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Select
            label="都道府県"
            value={prefecture}
            onValueChange={setPrefecture}
            error={state.fieldErrors?.prefecture?.[0]}
          >
            {PREFECTURES.map((pref) => (
              <SelectItem key={pref} value={pref}>{pref}</SelectItem>
            ))}
          </Select>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-foreground">婚姻状況</span>
            <div className="flex gap-2">
              {[
                { value: 'single', label: '未婚' },
                { value: 'married', label: '既婚' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMaritalStatus(opt.value)}
                  className={cn(
                    'rounded-[var(--radius-md)] border px-3 py-2 text-sm transition-colors',
                    maritalStatus === opt.value
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-border text-foreground hover:bg-[var(--color-surface-hover)]',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="扶養家族の人数"
            name="dependents"
            type="number"
            min={0}
            max={20}
            defaultValue={profile.dependents}
            error={state.fieldErrors?.dependents?.[0]}
          />
        </div>
      </Card>

      {/* 収入情報 */}
      <Card>
        <CardHeader>
          <CardTitle>収入情報</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="職業"
            value={occupation}
            onValueChange={setOccupation}
            error={state.fieldErrors?.occupation?.[0]}
          >
            {OCCUPATION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </Select>

          <CurrencyInput
            label="年収（税込）"
            name="_annualIncomeDisplay"
            defaultValue={profile.annualIncome}
            onChange={setAnnualIncome}
            error={state.fieldErrors?.annualIncome?.[0]}
          />
        </div>
      </Card>

      {/* Deferred financial summaries (Suspense slot) */}
      {children}

      {/* 目標・リスク */}
      <Card>
        <CardHeader>
          <CardTitle>目標・リスク許容度</CardTitle>
        </CardHeader>

        <div className="space-y-4">
          {/* 金融目標 */}
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">金融目標</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FINANCIAL_GOAL_OPTIONS.map((goal) => {
                const isSelected = selectedGoals.has(goal.value);
                return (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() => toggleGoal(goal.value)}
                    className={cn(
                      'rounded-[var(--radius-md)] border px-3 py-2 text-left text-sm transition-colors',
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
          </fieldset>

          {/* リスク許容度 */}
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">リスク許容度</legend>
            <div className="flex gap-2">
              {RISK_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRiskTolerance(opt.value)}
                  className={cn(
                    'rounded-[var(--radius-md)] border px-4 py-2 text-sm transition-colors',
                    riskTolerance === opt.value
                      ? 'border-primary bg-primary-light font-medium text-primary'
                      : 'border-border text-foreground hover:bg-[var(--color-surface-hover)]',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </Card>

      {/* エラー / 成功 */}
      {state.error && (
        <p className="text-sm text-negative" role="alert">{state.error}</p>
      )}

      {showSuccess && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-positive"
          role="status"
        >
          プロファイルを更新しました。
        </motion.p>
      )}

      {/* 送信 */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? '保存中...' : '変更を保存'}
        </Button>
      </div>
    </form>
  );
}
