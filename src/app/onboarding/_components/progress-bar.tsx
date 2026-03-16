'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

const STEPS = [
  { label: '基本情報' },
  { label: '収入' },
  { label: '支出' },
  { label: '資産・負債' },
  { label: '目標設定' },
] as const;

interface ProgressBarProps {
  currentStep: number;
}

export function ProgressBar({ currentStep }: ProgressBarProps): React.ReactElement {
  const progress = ((currentStep) / STEPS.length) * 100;

  return (
    <div className="mb-8">
      {/* Step indicators */}
      <div className="mb-3 flex items-center justify-between">
        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={step.label} className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors',
                  isCompleted && 'bg-primary text-white',
                  isCurrent && 'border-2 border-primary bg-primary-light text-primary',
                  !isCompleted && !isCurrent && 'border border-border bg-surface text-ink-subtle',
                )}
              >
                {isCompleted ? (
                  <CheckIcon />
                ) : (
                  stepNumber
                )}
              </div>
              <span
                className={cn(
                  'text-[11px] hidden sm:block',
                  isCurrent ? 'font-medium text-foreground' : 'text-ink-subtle',
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress track */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Step label for mobile */}
      <p className="mt-2 text-center text-sm text-ink-muted sm:hidden">
        ステップ {currentStep} / {STEPS.length}: {STEPS[currentStep - 1].label}
      </p>
    </div>
  );
}

function CheckIcon(): React.ReactElement {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
