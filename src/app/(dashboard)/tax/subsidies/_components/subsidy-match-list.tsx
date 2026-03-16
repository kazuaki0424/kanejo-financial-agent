'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  SUBSIDY_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  type SubsidyCategory,
  type MatchResult,
} from '@/lib/constants/subsidies';
import { cn } from '@/lib/utils/cn';

interface SubsidyMatchListProps {
  results: MatchResult[];
}

export function SubsidyMatchList({ results }: SubsidyMatchListProps): React.ReactElement {
  const [activeCategory, setActiveCategory] = useState<SubsidyCategory | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return results;
    return results.filter((r) => r.subsidy.category === activeCategory);
  }, [results, activeCategory]);

  const fullMatches = filtered.filter((r) => r.matchScore === 1);
  const partialMatches = filtered.filter((r) => r.matchScore > 0 && r.matchScore < 1);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: results.length };
    for (const r of results) {
      counts[r.subsidy.category] = (counts[r.subsidy.category] ?? 0) + 1;
    }
    return counts;
  }, [results]);

  return (
    <div className="space-y-6">
      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterChip
          label="すべて"
          count={categoryCounts['all']}
          active={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
        />
        {SUBSIDY_CATEGORIES.map((cat) => {
          const count = categoryCounts[cat] ?? 0;
          if (count === 0) return null;
          return (
            <FilterChip
              key={cat}
              label={`${CATEGORY_ICONS[cat]} ${CATEGORY_LABELS[cat]}`}
              count={count}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
            />
          );
        })}
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3">
        <Badge variant="primary">{fullMatches.length}件</Badge>
        <span className="text-sm text-ink-muted">の補助金・給付金が利用できる可能性があります</span>
      </div>

      {/* Full matches */}
      {fullMatches.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-medium text-positive">条件に該当</p>
          <div className="space-y-2">
            {fullMatches.map((r, i) => (
              <SubsidyCard
                key={r.subsidy.id}
                result={r}
                index={i}
                expanded={expandedId === r.subsidy.id}
                onToggle={() => setExpandedId(expandedId === r.subsidy.id ? null : r.subsidy.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Partial matches */}
      {partialMatches.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-medium text-ink-muted">一部条件に該当（要確認）</p>
          <div className="space-y-2">
            {partialMatches.map((r, i) => (
              <SubsidyCard
                key={r.subsidy.id}
                result={r}
                index={fullMatches.length + i}
                expanded={expandedId === r.subsidy.id}
                onToggle={() => setExpandedId(expandedId === r.subsidy.id ? null : r.subsidy.id)}
              />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <Card>
          <p className="py-4 text-center text-sm text-ink-subtle">
            このカテゴリに該当する補助金はありません
          </p>
        </Card>
      )}
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors',
        active
          ? 'border-primary bg-primary-light font-medium text-primary'
          : 'border-border text-ink-muted hover:bg-[var(--color-surface-hover)]',
      )}
    >
      {label}
      <span className={cn(
        'inline-flex h-4 min-w-4 items-center justify-center rounded-full text-[10px]',
        active ? 'bg-primary text-white' : 'bg-[var(--color-surface-alt)] text-ink-subtle',
      )}>
        {count}
      </span>
    </button>
  );
}

function SubsidyCard({
  result,
  index,
  expanded,
  onToggle,
}: {
  result: MatchResult;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}): React.ReactElement {
  const { subsidy, matchScore, matchedConditions, unmatchedConditions } = result;
  const isFullMatch = matchScore === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
    >
      <Card className={cn(
        'transition-colors',
        isFullMatch && 'border-l-[3px] border-l-positive',
      )}>
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-start gap-3 text-left"
        >
          <span className="mt-0.5 text-xl">{CATEGORY_ICONS[subsidy.category]}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{subsidy.name}</span>
              {isFullMatch && <Badge variant="primary" className="text-[10px]">該当</Badge>}
            </div>
            <p className="mt-0.5 text-xs text-ink-muted">{subsidy.provider}</p>
            <p className="mt-1 text-xs text-ink-subtle line-clamp-2">{subsidy.summary}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-medium tabular-nums text-primary">{subsidy.amount}</p>
            {subsidy.applicationDeadline && (
              <p className="mt-0.5 text-[10px] text-warning">〆 {subsidy.applicationDeadline}</p>
            )}
          </div>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="mt-3 border-t border-border pt-3">
                {/* Conditions */}
                <div className="space-y-1.5">
                  {matchedConditions.map((c) => (
                    <div key={c} className="flex items-center gap-2 text-xs">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-positive text-white">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                      </span>
                      <span className="text-positive">{c}</span>
                    </div>
                  ))}
                  {unmatchedConditions.map((c) => (
                    <div key={c} className="flex items-center gap-2 text-xs">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-surface-hover)] text-ink-subtle">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M4 2V6M2 4H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                      </span>
                      <span className="text-ink-muted">{c}（要確認）</span>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {subsidy.tags.map((tag) => (
                    <Badge key={tag} variant="default" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
