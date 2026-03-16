'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/format';

const TIER_INFO = {
  basic: {
    label: 'ベーシック',
    description: '家計改善・固定費削減・補助金の活用を中心にサポートします。',
    variant: 'default' as const,
  },
  middle: {
    label: 'ミドル',
    description: '節税最適化・住宅ローン・保険見直しを含む総合的なアドバイスを提供します。',
    variant: 'primary' as const,
  },
  high_end: {
    label: 'ハイエンド',
    description: '資産運用・法人設立・相続対策まで、高度な金融戦略をサポートします。',
    variant: 'primary' as const,
  },
} as const;

interface OnboardingCompleteProps {
  tier: 'basic' | 'middle' | 'high_end';
  annualIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

export function OnboardingComplete({
  tier,
  annualIncome,
  totalAssets,
  totalLiabilities,
  netWorth,
}: OnboardingCompleteProps): React.ReactElement {
  const tierInfo = TIER_INFO[tier];

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        {/* チェックマーク */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light"
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path
              d="M8 16.5L13.5 22L24 10"
              stroke="var(--color-primary)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>

        <h1 className="font-display text-2xl text-foreground sm:text-3xl">
          プロファイル完成
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          あなた専属のCFOとして、最適なアドバイスをお届けします。
        </p>
      </motion.div>

      {/* ティア判定 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="mt-8">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-muted">あなたのプラン</span>
            <Badge variant={tierInfo.variant}>{tierInfo.label}</Badge>
          </div>
          <p className="mt-3 text-sm text-ink-muted">{tierInfo.description}</p>
        </Card>
      </motion.div>

      {/* サマリー */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <SummaryItem label="年収" value={`¥${formatCurrency(annualIncome)}`} />
            <SummaryItem label="総資産" value={`¥${formatCurrency(totalAssets)}`} />
            <SummaryItem label="総負債" value={`¥${formatCurrency(totalLiabilities)}`} />
            <SummaryItem
              label="純資産"
              value={`${netWorth < 0 ? '-' : ''}¥${formatCurrency(Math.abs(netWorth))}`}
              highlight={netWorth >= 0 ? 'positive' : 'negative'}
            />
          </div>
        </Card>
      </motion.div>

      {/* ダッシュボードへ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 text-center"
      >
        <Button asChild size="lg">
          <Link href="/">ダッシュボードへ</Link>
        </Button>
      </motion.div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'positive' | 'negative';
}): React.ReactElement {
  return (
    <div>
      <p className="text-xs text-ink-muted">{label}</p>
      <p
        className={`mt-0.5 font-display text-xl tabular-nums ${
          highlight === 'positive'
            ? 'text-positive'
            : highlight === 'negative'
              ? 'text-negative'
              : 'text-foreground'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
