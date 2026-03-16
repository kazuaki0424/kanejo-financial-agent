'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { Card } from '@/components/ui/card';
import type { ScoreBreakdown } from '@/lib/utils/household-score';

interface HouseholdScoreCardProps {
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  breakdown: ScoreBreakdown;
}

const GRADE_COLORS: Record<string, string> = {
  S: 'var(--color-primary)',
  A: 'var(--color-positive)',
  B: 'var(--chart-3)',
  C: 'var(--color-warning)',
  D: 'var(--color-negative)',
};

const GRADE_MESSAGES: Record<string, string> = {
  S: '素晴らしい家計管理です',
  A: '良好な家計状況です',
  B: '改善の余地があります',
  C: 'いくつかの見直しをおすすめします',
  D: '家計の見直しが必要です',
};

export function HouseholdScoreCard({ score, grade, breakdown }: HouseholdScoreCardProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [animatedScore, setAnimatedScore] = useState(0);
  const gradeColor = GRADE_COLORS[grade] ?? 'var(--color-ink-subtle)';

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, score, {
      duration: 1,
      ease: [0.32, 0.72, 0, 1],
      onUpdate(latest) {
        setAnimatedScore(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [isInView, score]);

  const RADIUS = 44;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const offset = CIRCUMFERENCE - (animatedScore / 100) * CIRCUMFERENCE;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <p className="text-[13px] text-ink-muted">家計スコア</p>

        <div className="mt-3 flex items-center gap-6">
          {/* Circular gauge */}
          <div className="relative h-24 w-24 shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r={RADIUS}
                fill="none"
                stroke="var(--color-surface-hover)"
                strokeWidth="8"
              />
              <motion.circle
                cx="50"
                cy="50"
                r={RADIUS}
                fill="none"
                stroke={gradeColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl leading-none text-foreground tabular-nums">
                {animatedScore}
              </span>
              <span className="text-xs text-ink-subtle">/100</span>
            </div>
          </div>

          {/* 5-indicator breakdown */}
          <div className="flex-1 space-y-1.5">
            <BreakdownBar label="貯蓄率" value={breakdown.savingsScore} max={breakdown.savingsMax} />
            <BreakdownBar label="負債比率" value={breakdown.debtScore} max={breakdown.debtMax} />
            <BreakdownBar label="分散度" value={breakdown.diversityScore} max={breakdown.diversityMax} />
            <BreakdownBar label="緊急資金" value={breakdown.bufferScore} max={breakdown.bufferMax} />
            <BreakdownBar label="保険" value={breakdown.insuranceScore} max={breakdown.insuranceMax} />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: gradeColor }}
          >
            {grade}
          </span>
          <span className="text-sm text-ink-muted">
            {GRADE_MESSAGES[grade]}
          </span>
        </div>
      </Card>
    </motion.div>
  );
}

function BreakdownBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}): React.ReactElement {
  const pct = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="w-14 text-[11px] text-ink-muted">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
        />
      </div>
      <span className="w-8 text-right text-[11px] tabular-nums text-ink-subtle">
        {value}/{max}
      </span>
    </div>
  );
}
