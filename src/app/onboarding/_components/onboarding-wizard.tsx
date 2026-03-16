'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressBar } from './progress-bar';
import { Step1BasicInfo } from './step1-basic-info';
import { Step2Income } from './step2-income';
import { Step3Expenses } from './step3-expenses';
import { Step4Assets } from './step4-assets';
import { Step5Goals } from './step5-goals';
import { OnboardingComplete } from './onboarding-complete';

const TOTAL_STEPS = 5;

interface CompletionData {
  tier: 'basic' | 'middle' | 'high_end';
  annualIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

export function OnboardingWizard(): React.ReactElement {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [completionData, setCompletionData] = useState<CompletionData | null>(null);

  const handleStepComplete = useCallback((): void => {
    setDirection('forward');
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS + 1));
  }, []);

  const handleStepBack = useCallback((): void => {
    setDirection('back');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleFinalComplete = useCallback((result: {
    tier?: 'basic' | 'middle' | 'high_end';
    annualIncome?: number;
    totalAssets?: number;
    totalLiabilities?: number;
    netWorth?: number;
  }): void => {
    setCompletionData({
      tier: result.tier ?? 'basic',
      annualIncome: result.annualIncome ?? 0,
      totalAssets: result.totalAssets ?? 0,
      totalLiabilities: result.totalLiabilities ?? 0,
      netWorth: result.netWorth ?? 0,
    });
    setDirection('forward');
    setCurrentStep(TOTAL_STEPS + 1);
  }, []);

  const isComplete = currentStep > TOTAL_STEPS;

  const variants = {
    enter: { opacity: 0, x: direction === 'forward' ? 20 : -20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: direction === 'forward' ? -20 : 20 },
  };

  if (isComplete && completionData) {
    return <OnboardingComplete {...completionData} />;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl text-foreground sm:text-3xl">はじめましょう</h1>
        <p className="mt-2 text-sm text-ink-muted">
          あなたに最適な金融アドバイスを提供するために、いくつか質問させてください。
        </p>
      </div>

      <ProgressBar currentStep={currentStep} />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          {currentStep === 1 && (
            <Step1BasicInfo onComplete={handleStepComplete} />
          )}

          {currentStep === 2 && (
            <Step2Income onComplete={handleStepComplete} onBack={handleStepBack} />
          )}

          {currentStep === 3 && (
            <Step3Expenses onComplete={handleStepComplete} onBack={handleStepBack} />
          )}

          {currentStep === 4 && (
            <Step4Assets onComplete={handleStepComplete} onBack={handleStepBack} />
          )}

          {currentStep === 5 && (
            <Step5Goals onComplete={handleFinalComplete} onBack={handleStepBack} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
