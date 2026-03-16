'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';

const GRADE_COLORS: Record<string, string> = {
  S: 'var(--color-primary)',
  A: 'var(--color-positive)',
  B: 'var(--chart-3)',
  C: 'var(--color-warning)',
  D: 'var(--color-negative)',
};

const GRADE_LABELS: Record<string, string> = {
  S: '素晴らしい',
  A: '良好',
  B: '普通',
  C: '注意',
  D: '要改善',
};

interface ScoreGaugeProps {
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
}

export function ScoreGauge({ score, grade }: ScoreGaugeProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [animatedScore, setAnimatedScore] = useState(0);
  const color = GRADE_COLORS[grade];

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, score, {
      duration: 1.2,
      ease: [0.32, 0.72, 0, 1],
      onUpdate(latest) {
        setAnimatedScore(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [isInView, score]);

  const RADIUS = 80;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const ARC_LENGTH = CIRCUMFERENCE * 0.75; // 270 degree arc
  const offset = ARC_LENGTH - (animatedScore / 100) * ARC_LENGTH;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center"
    >
      <div className="relative h-48 w-48">
        <svg viewBox="0 0 200 200" className="h-full w-full">
          {/* Background arc */}
          <circle
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            stroke="var(--color-surface-hover)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE - ARC_LENGTH}`}
            strokeDashoffset={-CIRCUMFERENCE * 0.125}
            transform="rotate(0 100 100)"
          />
          {/* Score arc */}
          <motion.circle
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE - ARC_LENGTH}`}
            strokeDashoffset={offset - CIRCUMFERENCE * 0.125}
            transform="rotate(0 100 100)"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-5xl leading-none text-foreground tabular-nums">
            {animatedScore}
          </span>
          <span className="mt-1 text-sm text-ink-subtle">/100</span>
        </div>
      </div>

      {/* Grade badge */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.8, duration: 0.3 }}
        className="mt-2 flex items-center gap-2"
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {grade}
        </span>
        <span className="text-sm font-medium text-foreground">
          {GRADE_LABELS[grade]}
        </span>
      </motion.div>
    </motion.div>
  );
}
