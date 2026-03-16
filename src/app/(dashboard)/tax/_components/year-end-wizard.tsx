'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/shared/currency-input';
import { generateYearEndGuide, type YearEndProfile, type YearEndStep, type Optimization } from '@/lib/utils/year-end-adjustment';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface YearEndWizardProps {
  annualSalary: number;
  maritalStatus: string;
  dependents: number;
}

export function YearEndWizard({ annualSalary, maritalStatus, dependents }: YearEndWizardProps): React.ReactElement {
  const [currentStep, setCurrentStep] = useState(0);
  const [showWizard, setShowWizard] = useState(false);

  const [profile, setProfile] = useState<YearEndProfile>({
    annualSalary,
    maritalStatus,
    spouseIncome: 0,
    dependents,
    dependentAges: Array.from({ length: dependents }, () => 10),
    lifeInsurancePremium: 0,
    earthquakeInsurancePremium: 0,
    housingLoanBalance: 0,
    housingLoanFirstYear: false,
    idecoAmount: 0,
    medicalExpenses: 0,
    furusatoAmount: 0,
  });

  const update = useCallback(<K extends keyof YearEndProfile>(key: K, value: YearEndProfile[K]): void => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }, []);

  const result = useMemo(() => generateYearEndGuide(profile), [profile]);

  if (!showWizard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>年末調整ウィザード</CardTitle>
          <CardDescription>
            会社員向け。控除申告書の記入をステップバイステップでサポートします。
          </CardDescription>
        </CardHeader>
        <div className="flex items-center justify-between">
          <div className="text-sm text-ink-muted">
            <p>該当する申告書: {result.steps.length}件</p>
            <p>推定還付額: <span className="font-medium text-primary">¥{formatCurrency(result.summary.estimatedRefund)}</span></p>
          </div>
          <Button onClick={() => setShowWizard(true)}>
            ウィザードを開始
          </Button>
        </div>
      </Card>
    );
  }

  const activeStep = result.steps[currentStep];
  const isLastStep = currentStep === result.steps.length - 1;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            年末調整ウィザード ({currentStep + 1}/{result.steps.length})
          </p>
          <Button variant="ghost" size="sm" onClick={() => setShowWizard(false)} className="text-xs">
            閉じる
          </Button>
        </div>
        <div className="mt-3 flex gap-1">
          {result.steps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentStep(i)}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                i <= currentStep ? 'bg-primary' : 'bg-[var(--color-surface-hover)]',
              )}
            />
          ))}
        </div>
      </Card>

      {/* Input panel */}
      <Card>
        <CardHeader>
          <CardTitle>控除情報の入力</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {profile.maritalStatus === 'married' && (
            <CurrencyInput
              label="配偶者の年収"
              name="spouseIncome"
              defaultValue={profile.spouseIncome}
              onChange={(v) => update('spouseIncome', v)}
              hint="103万円以下で配偶者控除"
            />
          )}
          <CurrencyInput
            label="生命保険料（年額）"
            name="lifeInsurance"
            defaultValue={profile.lifeInsurancePremium}
            onChange={(v) => update('lifeInsurancePremium', v)}
          />
          <CurrencyInput
            label="地震保険料（年額）"
            name="earthquake"
            defaultValue={profile.earthquakeInsurancePremium}
            onChange={(v) => update('earthquakeInsurancePremium', v)}
          />
          <CurrencyInput
            label="住宅ローン残高"
            name="housingLoan"
            defaultValue={profile.housingLoanBalance}
            onChange={(v) => update('housingLoanBalance', v)}
          />
          <CurrencyInput
            label="iDeCo掛金（年額）"
            name="ideco"
            defaultValue={profile.idecoAmount}
            onChange={(v) => update('idecoAmount', v)}
          />
        </div>
      </Card>

      {/* Active step */}
      <AnimatePresence mode="wait">
        {activeStep && (
          <motion.div
            key={activeStep.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <StepCard step={activeStep} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => setCurrentStep((p) => Math.max(0, p - 1))}
          disabled={currentStep === 0}
        >
          前へ
        </Button>
        {isLastStep ? (
          <Button onClick={() => setCurrentStep(result.steps.length)}>
            結果を見る
          </Button>
        ) : (
          <Button onClick={() => setCurrentStep((p) => Math.min(result.steps.length - 1, p + 1))}>
            次へ
          </Button>
        )}
      </div>

      {/* Summary (shown after last step) */}
      {currentStep >= result.steps.length && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className="border-l-[4px] border-l-primary bg-primary-light">
            <p className="text-sm text-ink-muted">推定還付額</p>
            <p className="mt-1 font-display text-3xl tabular-nums text-primary">
              ¥{formatCurrency(result.summary.estimatedRefund)}
            </p>
            <p className="mt-1 text-xs text-ink-subtle">
              控除合計: ¥{formatCurrency(result.summary.totalDeductions)}
            </p>
          </Card>

          {result.optimizations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>最適化のヒント</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {result.optimizations.map((opt) => (
                  <OptimizationCard key={opt.title} optimization={opt} />
                ))}
              </div>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}

function StepCard({ step }: { step: YearEndStep }): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{step.title}</CardTitle>
          <Badge variant="default" className="text-[10px]">{step.formName}</Badge>
        </div>
        <CardDescription>{step.description}</CardDescription>
      </CardHeader>

      {/* Fields */}
      <div className="space-y-2">
        {step.fields.map((field) => (
          <div key={field.label} className="flex items-center justify-between rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] px-3 py-2">
            <div>
              <span className="text-sm text-foreground">{field.label}</span>
              {field.hint && <p className="text-[10px] text-ink-subtle">{field.hint}</p>}
            </div>
            <span className="font-medium tabular-nums text-foreground">{field.value}</span>
          </div>
        ))}
      </div>

      {/* Tips */}
      {step.tips.length > 0 && (
        <div className="mt-4 rounded-[var(--radius-md)] border-l-[3px] border-primary bg-primary-light px-4 py-3">
          <p className="mb-1.5 text-xs font-medium text-primary">ポイント</p>
          <ul className="space-y-1">
            {step.tips.map((tip) => (
              <li key={tip} className="text-xs text-ink-muted">• {tip}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function OptimizationCard({ optimization }: { optimization: Optimization }): React.ReactElement {
  const priorityStyle = {
    high: 'border-l-positive',
    medium: 'border-l-primary',
    low: 'border-l-border',
  }[optimization.priority];

  return (
    <div className={cn('rounded-[var(--radius-md)] border border-border border-l-[3px] px-4 py-3', priorityStyle)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">{optimization.title}</span>
        {optimization.potentialSaving > 0 && (
          <Badge variant="primary" className="text-[10px]">
            ~¥{formatCurrency(optimization.potentialSaving)}/年
          </Badge>
        )}
      </div>
      <p className="mt-1 text-xs text-ink-muted">{optimization.description}</p>
    </div>
  );
}
