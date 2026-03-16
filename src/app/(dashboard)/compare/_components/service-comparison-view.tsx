'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  SERVICE_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  type ServiceCategory,
} from '@/lib/constants/financial-services';
import { compareServices, type UserPreferences, type ScoredService } from '@/lib/utils/service-comparison';
import { ComparisonTable } from './comparison-table';
import { AnnualMeritCard } from './annual-merit-card';
import { ServiceDetailPanel } from './service-detail-panel';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface ServiceComparisonViewProps {
  preferences: UserPreferences;
}

export function ServiceComparisonView({ preferences }: ServiceComparisonViewProps): React.ReactElement {
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('credit_card');
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'cost' | 'rating'>('score');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const result = useMemo(
    () => compareServices(activeCategory, preferences),
    [activeCategory, preferences],
  );

  const sorted = useMemo(() => {
    const list = [...result.services];
    switch (sortBy) {
      case 'cost': return list.sort((a, b) => a.annualCost - b.annualCost);
      case 'rating': return list.sort((a, b) => b.service.rating - a.service.rating);
      default: return list;
    }
  }, [result.services, sortBy]);

  const selectedServices = useMemo(
    () => result.services.filter((s) => selectedIds.has(s.service.id)),
    [result.services, selectedIds],
  );

  const toggleSelect = (id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SERVICE_CATEGORIES.filter((c) => c !== 'loan').map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => { setActiveCategory(cat); setExpandedService(null); setSelectedIds(new Set()); }}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors',
              activeCategory === cat
                ? 'border-primary bg-primary-light font-medium text-primary'
                : 'border-border text-ink-muted hover:bg-[var(--color-surface-hover)]',
            )}
          >
            <span>{CATEGORY_ICONS[cat]}</span>
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Sort + summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {sorted.length}件のサービスを比較
        </p>
        <div className="flex gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] p-0.5">
          {[
            { key: 'score' as const, label: 'おすすめ順' },
            { key: 'cost' as const, label: '安い順' },
            { key: 'rating' as const, label: '評価順' },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSortBy(opt.key)}
              className={cn(
                'rounded-[var(--radius-sm)] px-3 py-1 text-xs font-medium transition-colors',
                sortBy === opt.key ? 'bg-surface text-foreground shadow-sm' : 'text-ink-muted',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selection hint */}
      {selectedIds.size > 0 && selectedIds.size < 2 && (
        <p className="text-xs text-ink-muted">あと{2 - selectedIds.size}つ選択すると比較テーブルが表示されます</p>
      )}

      {/* Service cards */}
      <div className="space-y-3">
        {sorted.map((scored, i) => (
          <ServiceCard
            key={scored.service.id}
            scored={scored}
            index={i}
            expanded={expandedService === scored.service.id}
            onToggle={() => setExpandedService(
              expandedService === scored.service.id ? null : scored.service.id,
            )}
            category={activeCategory}
            selected={selectedIds.has(scored.service.id)}
            onSelect={() => toggleSelect(scored.service.id)}
          />
        ))}
      </div>

      {sorted.length === 0 && (
        <Card>
          <p className="py-8 text-center text-sm text-ink-subtle">
            このカテゴリにはサービスデータがありません
          </p>
        </Card>
      )}

      {/* Annual merit card */}
      {result.topPick && result.topPick.annualBenefit > 0 && (
        <AnnualMeritCard topPick={result.topPick} monthlySpending={preferences.monthlySpending} />
      )}

      {/* Side-by-side comparison table */}
      {selectedServices.length >= 2 && (
        <ComparisonTable
          services={selectedServices}
          onRemove={(id) => {
            setSelectedIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }}
        />
      )}

      {/* Service detail panel */}
      {expandedService && (
        <ServiceDetailPanel
          scored={result.services.find((s) => s.service.id === expandedService) ?? null}
          onClose={() => setExpandedService(null)}
        />
      )}
    </div>
  );
}

function ServiceCard({
  scored,
  index,
  expanded,
  onToggle,
  category,
  selected,
  onSelect,
}: {
  scored: ScoredService;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  category: ServiceCategory;
  selected: boolean;
  onSelect: () => void;
}): React.ReactElement {
  const { service, score, annualCost, annualBenefit, netValue, recommendation, isRecommended } = scored;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
    >
      <Card className={cn(
        'transition-colors',
        isRecommended && 'border-l-[3px] border-l-primary',
        selected && 'ring-2 ring-primary/30',
      )}>
        {/* Header */}
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-start gap-4 text-left"
        >
          {/* Compare checkbox */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className={cn(
              'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
              selected ? 'border-primary bg-primary' : 'border-border hover:border-border-strong',
            )}
            aria-label={`${service.name}を比較に追加`}
          >
            {selected && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
          </button>

          {/* Score circle */}
          <div className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
            score >= 80 ? 'bg-primary text-white' : score >= 60 ? 'bg-primary-light text-primary' : 'bg-[var(--color-surface-alt)] text-ink-muted',
          )}>
            {score}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{service.name}</span>
              {isRecommended && <Badge variant="primary" className="text-[10px]">おすすめ</Badge>}
            </div>
            <p className="text-xs text-ink-muted">{service.provider}</p>
            <p className="mt-1 text-xs text-ink-subtle">{recommendation}</p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-sm font-medium tabular-nums text-foreground">
              {annualCost === 0 ? '無料' : `¥${formatCurrency(annualCost)}/年`}
            </p>
            {category === 'credit_card' && annualBenefit > 0 && (
              <p className="text-[11px] tabular-nums text-positive">
                +¥{formatCurrency(annualBenefit)} 還元
              </p>
            )}
            <div className="mt-1 flex items-center gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <StarIcon key={i} filled={i < Math.round(service.rating)} />
              ))}
              <span className="ml-1 text-[10px] tabular-nums text-ink-subtle">{service.rating}</span>
            </div>
          </div>
        </button>

        {/* Expanded detail */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="mt-4 border-t border-border pt-4">
                {/* Description */}
                <p className="text-sm text-ink-muted">{service.description}</p>

                {/* Features table */}
                <div className="mt-3 space-y-1">
                  {service.features.map((f) => (
                    <div key={f.label} className="flex justify-between rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] px-3 py-1.5 text-xs">
                      <span className="text-ink-muted">{f.label}</span>
                      <span className="font-medium text-foreground">{f.value}</span>
                    </div>
                  ))}
                </div>

                {/* Highlights */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {service.highlights.map((h) => (
                    <Badge key={h} variant="default" className="text-[10px]">{h}</Badge>
                  ))}
                </div>

                {/* Net value */}
                {category === 'credit_card' && (
                  <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] px-3 py-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-muted">年間コスト</span>
                      <span className="tabular-nums text-foreground">¥{formatCurrency(annualCost)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-muted">年間還元</span>
                      <span className="tabular-nums text-positive">+¥{formatCurrency(annualBenefit)}</span>
                    </div>
                    <div className="mt-1 flex justify-between border-t border-border pt-1 text-xs">
                      <span className="font-medium text-ink-muted">実質</span>
                      <span className={cn('font-medium tabular-nums', netValue >= 0 ? 'text-positive' : 'text-negative')}>
                        {netValue >= 0 ? '+' : ''}¥{formatCurrency(netValue)}
                      </span>
                    </div>
                  </div>
                )}

                <p className="mt-3 text-[10px] text-ink-subtle">
                  おすすめ対象: {service.bestFor}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

function StarIcon({ filled }: { filled: boolean }): React.ReactElement {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill={filled ? 'var(--chart-3)' : 'none'} stroke="var(--chart-3)" strokeWidth="1" aria-hidden="true">
      <path d="M6 1L7.5 4.2L11 4.6L8.5 7L9.2 10.5L6 8.8L2.8 10.5L3.5 7L1 4.6L4.5 4.2L6 1Z" />
    </svg>
  );
}
