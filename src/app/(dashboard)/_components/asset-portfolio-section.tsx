'use client';

import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { PortfolioData } from '@/app/(dashboard)/_actions/dashboard';

interface AssetPortfolioSectionProps {
  portfolio: PortfolioData;
}

export function AssetPortfolioSection({ portfolio }: AssetPortfolioSectionProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card>
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-[13px] font-medium text-foreground">資産ポートフォリオ</p>
          <p className="text-xs text-ink-subtle">
            流動性比率{' '}
            <span className="font-medium tabular-nums text-foreground">{portfolio.liquidRatio}%</span>
          </p>
        </div>

        {/* 純資産ヘッダー */}
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs text-ink-subtle">純資産</p>
            <p className={cn(
              'font-display text-2xl tabular-nums',
              portfolio.netWorth >= 0 ? 'text-foreground' : 'text-negative',
            )}>
              {portfolio.netWorth < 0 ? '-' : ''}¥{formatCurrency(Math.abs(portfolio.netWorth))}
            </p>
          </div>
          <div className="text-right text-xs text-ink-subtle">
            <p>資産 ¥{formatCurrency(portfolio.totalAssets)}</p>
            <p>負債 ¥{formatCurrency(portfolio.totalLiabilities)}</p>
          </div>
        </div>

        {/* 資産構成バー */}
        {portfolio.assets.length > 0 && (
          <div className="mb-5">
            <p className="mb-1.5 text-[11px] text-ink-subtle">資産構成</p>
            <div className="flex h-6 w-full overflow-hidden rounded-[var(--radius-sm)]">
              {portfolio.assets.map((asset) => {
                const widthPct = portfolio.totalAssets > 0
                  ? (asset.amount / portfolio.totalAssets) * 100
                  : 0;
                return (
                  <motion.div
                    key={asset.category}
                    initial={{ width: 0 }}
                    animate={isInView ? { width: `${widthPct}%` } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ backgroundColor: asset.color }}
                    className={cn(
                      'h-full cursor-pointer transition-opacity',
                      hoveredAsset && hoveredAsset !== asset.category ? 'opacity-30' : 'opacity-100',
                    )}
                    onMouseEnter={() => setHoveredAsset(asset.category)}
                    onMouseLeave={() => setHoveredAsset(null)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* 資産リスト */}
        {portfolio.assets.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-[11px] text-ink-subtle">資産内訳</p>
            <div className="space-y-0.5">
              {portfolio.assets.map((asset) => (
                <div key={asset.category}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-left transition-colors',
                      'hover:bg-[var(--color-surface-hover)]',
                      hoveredAsset === asset.category && 'bg-[var(--color-surface-hover)]',
                    )}
                    onMouseEnter={() => setHoveredAsset(asset.category)}
                    onMouseLeave={() => setHoveredAsset(null)}
                    onClick={() => setExpandedItem(
                      expandedItem === asset.category ? null : asset.category,
                    )}
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: asset.color }}
                    />
                    <span className="flex-1 text-sm text-foreground">{asset.label}</span>
                    {asset.isLiquid && (
                      <Badge variant="default" className="text-[10px]">流動</Badge>
                    )}
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums text-foreground">
                        ¥{formatCurrency(asset.amount)}
                      </p>
                      <p className="text-[11px] tabular-nums text-ink-subtle">{asset.percentage}%</p>
                    </div>
                    <ChevronIcon expanded={expandedItem === asset.category} />
                  </button>

                  <AnimatePresence>
                    {expandedItem === asset.category && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <AssetDetail
                          amount={asset.amount}
                          totalAssets={portfolio.totalAssets}
                          isLiquid={asset.isLiquid}
                          color={asset.color}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 負債リスト */}
        {portfolio.liabilities.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] text-ink-subtle">負債内訳</p>
            <div className="space-y-0.5">
              {portfolio.liabilities.map((liability) => (
                <div
                  key={liability.category}
                  className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: liability.color }}
                  />
                  <span className="flex-1 text-sm text-foreground">{liability.label}</span>
                  <p className="text-sm font-medium tabular-nums text-negative">
                    ¥{formatCurrency(liability.remainingAmount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {portfolio.assets.length === 0 && portfolio.liabilities.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-subtle">資産・負債データがありません</p>
        )}
      </Card>
    </motion.div>
  );
}

function AssetDetail({
  amount,
  totalAssets,
  isLiquid,
  color,
}: {
  amount: number;
  totalAssets: number;
  isLiquid: boolean;
  color: string;
}): React.ReactElement {
  const ratio = totalAssets > 0 ? (amount / totalAssets) * 100 : 0;

  return (
    <div className="ml-9 mr-3 mb-2 rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] px-3 py-2.5">
      <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
        <div>
          <span className="text-ink-subtle">評価額</span>
          <p className="font-medium tabular-nums text-foreground">¥{formatCurrency(amount)}</p>
        </div>
        <div>
          <span className="text-ink-subtle">構成比</span>
          <p className="font-medium tabular-nums text-foreground">{ratio.toFixed(1)}%</p>
        </div>
        <div>
          <span className="text-ink-subtle">流動性</span>
          <p className="font-medium text-foreground">{isLiquid ? '高' : '低'}</p>
        </div>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
        <div
          className="h-full rounded-full"
          style={{ width: `${ratio}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }): React.ReactElement {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={cn(
        'shrink-0 text-ink-subtle transition-transform',
        expanded && 'rotate-90',
      )}
      aria-hidden="true"
    >
      <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
