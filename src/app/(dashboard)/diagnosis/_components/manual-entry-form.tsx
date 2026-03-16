'use client';

import { useActionState, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Select, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/shared/currency-input';
import { addManualEntry } from '@/app/(dashboard)/diagnosis/_actions/transactions';
import { cn } from '@/lib/utils/cn';

const INCOME_CATEGORIES = [
  { value: 'salary', label: '給与' },
  { value: 'side_job', label: '副業' },
  { value: 'investment', label: '投資収入' },
  { value: 'pension', label: '年金' },
  { value: 'rental', label: '家賃収入' },
  { value: 'other', label: 'その他' },
] as const;

const EXPENSE_CATEGORIES = [
  { value: 'housing', label: '住居費' },
  { value: 'food', label: '食費' },
  { value: 'transportation', label: '交通費' },
  { value: 'utilities', label: '水道光熱費' },
  { value: 'communication', label: '通信費' },
  { value: 'insurance', label: '保険料' },
  { value: 'medical', label: '医療費' },
  { value: 'education', label: '教育費' },
  { value: 'entertainment', label: '娯楽・交際費' },
  { value: 'clothing', label: '被服費' },
  { value: 'subscription', label: 'サブスク' },
  { value: 'other', label: 'その他' },
] as const;

interface FormState {
  error: string | null;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

export function ManualEntryForm(): React.ReactElement {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const wrappedAction = useCallback(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const result = await addManualEntry(formData);
      if (!result.error) {
        setShowSuccess(true);
        setCategory('');
        setTimeout(() => setShowSuccess(false), 3000);
        return { error: null, success: true };
      }
      return result;
    },
    [],
  );

  const [state, formAction, isPending] = useActionState(wrappedAction, { error: null });

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <form action={formAction} className="space-y-4">
      {/* Hidden fields */}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="category" value={category} />

      {/* Type toggle */}
      <div className="flex gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] p-1">
        <button
          type="button"
          onClick={() => { setType('expense'); setCategory(''); }}
          className={cn(
            'flex-1 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition-colors',
            type === 'expense' ? 'bg-surface text-negative shadow-sm' : 'text-ink-muted',
          )}
        >
          支出
        </button>
        <button
          type="button"
          onClick={() => { setType('income'); setCategory(''); }}
          className={cn(
            'flex-1 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition-colors',
            type === 'income' ? 'bg-surface text-positive shadow-sm' : 'text-ink-muted',
          )}
        >
          収入
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="日付"
          name="date"
          type="date"
          defaultValue={new Date().toISOString().split('T')[0]}
          required
          error={state.fieldErrors?.date?.[0]}
        />

        <Select
          label="カテゴリ"
          value={category}
          onValueChange={setCategory}
          error={state.fieldErrors?.category?.[0]}
        >
          {categories.map((c) => (
            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
          ))}
        </Select>
      </div>

      <CurrencyInput
        label="金額"
        name="amount"
        required
        error={state.fieldErrors?.amount?.[0]}
      />

      <Input
        label="メモ（任意）"
        name="description"
        type="text"
        placeholder="例: 3月分家賃"
      />

      {state.error && (
        <p className="text-sm text-negative" role="alert">{state.error}</p>
      )}

      <AnimatePresence>
        {showSuccess && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-positive"
          >
            データを追加しました。
          </motion.p>
        )}
      </AnimatePresence>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? '保存中...' : '追加'}
      </Button>
    </form>
  );
}
