'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { RadarChart } from '@/components/charts/radar-chart';
import type { ScoreBreakdown } from '@/lib/utils/household-score';

interface ScoreRadarCardProps {
  breakdown: ScoreBreakdown;
}

export function ScoreRadarCard({ breakdown }: ScoreRadarCardProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const radarData = [
    { label: '貯蓄率', value: breakdown.savingsScore, fullMark: breakdown.savingsMax },
    { label: '負債管理', value: breakdown.debtScore, fullMark: breakdown.debtMax },
    { label: '資産分散', value: breakdown.diversityScore, fullMark: breakdown.diversityMax },
    { label: '緊急資金', value: breakdown.bufferScore, fullMark: breakdown.bufferMax },
    { label: '保険', value: breakdown.insuranceScore, fullMark: breakdown.insuranceMax },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>指標バランス</CardTitle>
        </CardHeader>

        <RadarChart data={radarData} />

        {/* Score details table */}
        <div className="mt-4 space-y-2">
          {radarData.map((item) => {
            const ratio = item.fullMark > 0 ? item.value / item.fullMark : 0;
            return (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-16 text-xs text-ink-muted">{item.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={isInView ? { width: `${ratio * 100}%` } : {}}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  />
                </div>
                <span className="w-12 text-right text-xs tabular-nums text-ink-subtle">
                  {item.value}/{item.fullMark}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}
