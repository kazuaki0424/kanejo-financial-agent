'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface NetWorthCardProps {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

export function NetWorthCard({ totalAssets, totalLiabilities, netWorth }: NetWorthCardProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [animatedNet, setAnimatedNet] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, netWorth, {
      duration: 0.8,
      ease: [0.32, 0.72, 0, 1],
      onUpdate(latest) {
        setAnimatedNet(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [isInView, netWorth]);

  // Bar proportions
  const total = totalAssets + totalLiabilities;
  const assetPct = total > 0 ? (totalAssets / total) * 100 : 50;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card>
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] text-ink-muted">純資産</p>
          <p
            className={cn(
              'font-display text-2xl tabular-nums',
              animatedNet >= 0 ? 'text-foreground' : 'text-negative',
            )}
          >
            {animatedNet < 0 ? '-' : ''}¥{formatCurrency(Math.abs(animatedNet))}
          </p>
        </div>

        {/* Asset/Liability bar */}
        <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full">
          <motion.div
            className="h-full bg-positive"
            initial={{ width: 0 }}
            animate={isInView ? { width: `${assetPct}%` } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
          <motion.div
            className="h-full bg-negative"
            initial={{ width: 0 }}
            animate={isInView ? { width: `${100 - assetPct}%` } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
        </div>

        <div className="mt-2 flex justify-between text-xs">
          <span className="text-positive">資産 ¥{formatCurrency(totalAssets)}</span>
          <span className="text-negative">負債 ¥{formatCurrency(totalLiabilities)}</span>
        </div>
      </Card>
    </motion.div>
  );
}
