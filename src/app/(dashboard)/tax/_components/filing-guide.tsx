'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { assessFilingNeed, type FilingProfile, type FilingResult } from '@/lib/utils/tax-filing';
import { cn } from '@/lib/utils/cn';

interface FilingGuideProps {
  initialProfile: FilingProfile;
}

export function FilingGuide({ initialProfile }: FilingGuideProps): React.ReactElement {
  const [profile, setProfile] = useState(initialProfile);
  const [showQuestions, setShowQuestions] = useState(false);

  const result = useMemo(() => assessFilingNeed(profile), [profile]);

  const toggle = useCallback((key: keyof FilingProfile, value: boolean): void => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="space-y-6">
      {/* 判定結果 */}
      <FilingStatusCard result={result} />

      {/* 追加質問 */}
      <Card>
        <div className="flex items-center justify-between">
          <CardHeader className="mb-0">
            <CardTitle>あなたの状況を教えてください</CardTitle>
            <CardDescription>該当する項目をチェックすると判定が更新されます</CardDescription>
          </CardHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowQuestions(!showQuestions)}
            className="text-xs"
          >
            {showQuestions ? '閉じる' : '詳細を入力'}
          </Button>
        </div>

        <AnimatePresence>
          {showQuestions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="space-y-3">
                <CheckItem
                  label="副業・フリーランス収入がある"
                  checked={profile.hasSideIncome}
                  onChange={(v) => toggle('hasSideIncome', v)}
                />
                <CheckItem
                  label="2ヶ所以上から給与をもらっている"
                  checked={profile.hasMultipleEmployers}
                  onChange={(v) => toggle('hasMultipleEmployers', v)}
                />
                <CheckItem
                  label="年間医療費が10万円を超える"
                  checked={profile.hasMedicalExpenses}
                  onChange={(v) => toggle('hasMedicalExpenses', v)}
                />
                <CheckItem
                  label="住宅ローン控除を初めて受ける"
                  checked={profile.housingLoanFirstYear}
                  onChange={(v) => {
                    setProfile((prev) => ({
                      ...prev,
                      housingLoanFirstYear: v,
                      hasHousingLoan: v || prev.hasHousingLoan,
                    }));
                  }}
                />
                <CheckItem
                  label="ふるさと納税の寄付先が6自治体以上"
                  checked={profile.hasFurusato && profile.furusatoCount > 5}
                  onChange={(v) => {
                    setProfile((prev) => ({
                      ...prev,
                      hasFurusato: v,
                      furusatoCount: v ? 6 : 0,
                    }));
                  }}
                />
                <CheckItem
                  label="株式の譲渡所得がある（源泉徴収なし）"
                  checked={profile.hasStockIncome}
                  onChange={(v) => toggle('hasStockIncome', v)}
                />
                <CheckItem
                  label="不動産の賃貸収入がある"
                  checked={profile.hasRentalIncome}
                  onChange={(v) => toggle('hasRentalIncome', v)}
                />
                <CheckItem
                  label="年の途中で退職した（年末調整なし）"
                  checked={profile.leftJobMidYear}
                  onChange={(v) => toggle('leftJobMidYear', v)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* 理由 */}
      {result.reasons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>判定理由</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {result.reasons.map((reason, i) => (
              <motion.div
                key={reason.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  'rounded-[var(--radius-md)] border px-4 py-3',
                  reason.required ? 'border-l-[3px] border-l-negative' : 'border-l-[3px] border-l-primary',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{reason.title}</span>
                  <Badge variant={reason.required ? 'default' : 'primary'} className="text-[10px]">
                    {reason.required ? '必須' : 'メリットあり'}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{reason.description}</p>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* ステップガイド */}
      <Card>
        <CardHeader>
          <CardTitle>手続きの流れ</CardTitle>
        </CardHeader>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-3 bottom-3 w-px bg-border" />

          <div className="space-y-4">
            {result.steps.map((step, i) => (
              <motion.div
                key={step.order}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="relative flex gap-4 pl-1"
              >
                <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {step.order}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{step.title}</span>
                    {step.deadline && (
                      <span className="text-[10px] text-warning">〆 {step.deadline}</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Card>

      {/* 必要書類チェックリスト */}
      {result.documents.length > 0 && (
        <DocumentChecklist documents={result.documents} />
      )}
    </div>
  );
}

function FilingStatusCard({ result }: { result: FilingResult }): React.ReactElement {
  const config = {
    required: {
      bg: 'bg-negative-bg',
      border: 'border-negative',
      icon: '⚠️',
      title: '確定申告が必要です',
      description: '以下の理由により、確定申告が必要と判定されました。',
    },
    recommended: {
      bg: 'bg-primary-light',
      border: 'border-primary',
      icon: '💡',
      title: '確定申告をおすすめします',
      description: '義務ではありませんが、申告することで税金の還付が見込めます。',
    },
    not_needed: {
      bg: 'bg-positive-bg',
      border: 'border-positive',
      icon: '✓',
      title: '確定申告は不要です',
      description: '年末調整で税金の精算は完了しています。',
    },
  }[result.filingType];

  return (
    <Card className={cn('border-l-[4px]', config.border, config.bg)}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{config.icon}</span>
        <div>
          <h2 className="text-lg font-medium text-foreground">{config.title}</h2>
          <p className="mt-1 text-sm text-ink-muted">{config.description}</p>
        </div>
      </div>
    </Card>
  );
}

function DocumentChecklist({ documents }: { documents: FilingResult['documents'] }): React.ReactElement {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggleDoc = (name: string): void => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const progress = documents.length > 0 ? (checked.size / documents.length) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>必要書類チェックリスト</CardTitle>
          <span className="text-xs tabular-nums text-ink-muted">{checked.size}/{documents.length}</span>
        </div>
      </CardHeader>

      {/* Progress bar */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
        <motion.div
          className="h-full rounded-full bg-primary"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="space-y-1">
        {documents.map((doc) => {
          const isChecked = checked.has(doc.name);
          return (
            <button
              key={doc.name}
              type="button"
              onClick={() => toggleDoc(doc.name)}
              className={cn(
                'flex w-full items-start gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left transition-colors',
                'hover:bg-[var(--color-surface-hover)]',
                isChecked && 'opacity-60',
              )}
            >
              <div className={cn(
                'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                isChecked ? 'border-primary bg-primary' : 'border-border',
              )}>
                {isChecked && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className={cn('text-sm text-foreground', isChecked && 'line-through')}>{doc.name}</span>
                <p className="text-[10px] text-ink-subtle">入手先: {doc.source}</p>
                {doc.notes && <p className="text-[10px] text-ink-subtle">{doc.notes}</p>}
              </div>
              {!doc.required && (
                <Badge variant="default" className="shrink-0 text-[9px]">任意</Badge>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function CheckItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}): React.ReactElement {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 transition-colors hover:bg-[var(--color-surface-hover)]">
      <div className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
        checked ? 'border-primary bg-primary' : 'border-border',
      )}>
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}
