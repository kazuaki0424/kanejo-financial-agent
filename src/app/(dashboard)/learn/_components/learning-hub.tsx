'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LEARNING_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  GLOSSARY,
  getDailyTip,
  getTopicsForTier,
  type LearningTopic,
  type LearningCategory,
  type GlossaryTerm,
} from '@/lib/constants/learning-content';
import { cn } from '@/lib/utils/cn';

interface LearningHubProps {
  tier: string;
}

export function LearningHub({ tier }: LearningHubProps): React.ReactElement {
  const [activeCategory, setActiveCategory] = useState<LearningCategory | 'all' | 'glossary'>('all');
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [glossarySearch, setGlossarySearch] = useState('');

  const topics = useMemo(() => getTopicsForTier(tier), [tier]);
  const filtered = useMemo(() => {
    if (activeCategory === 'all' || activeCategory === 'glossary') return topics;
    return topics.filter((t) => t.category === activeCategory);
  }, [topics, activeCategory]);

  const filteredGlossary = useMemo(() => {
    if (!glossarySearch) return GLOSSARY;
    const q = glossarySearch.toLowerCase();
    return GLOSSARY.filter((g) => g.term.includes(q) || g.reading.includes(q) || g.definition.includes(q));
  }, [glossarySearch]);

  const progress = topics.length > 0 ? (completedTopics.size / topics.length) * 100 : 0;
  const dailyTip = getDailyTip();

  const toggleComplete = (id: string): void => {
    setCompletedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Daily tip */}
      <Card className="border-l-[3px] border-l-primary bg-primary-light">
        <div className="flex items-start gap-3">
          <span className="text-lg">💡</span>
          <div>
            <p className="text-xs font-medium text-primary">今日のTips</p>
            <p className="mt-0.5 text-sm text-foreground">{dailyTip}</p>
          </div>
        </div>
      </Card>

      {/* Progress */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-ink-muted">学習進捗</p>
            <p className="mt-0.5 font-display text-2xl tabular-nums text-foreground">
              {completedTopics.size}<span className="text-sm text-ink-subtle">/{topics.length}</span>
            </p>
          </div>
          <div className="relative h-14 w-14">
            <svg viewBox="0 0 44 44" className="h-full w-full -rotate-90">
              <circle cx="22" cy="22" r="18" fill="none" stroke="var(--color-surface-hover)" strokeWidth="4" />
              <motion.circle
                cx="22" cy="22" r="18" fill="none" stroke="var(--color-primary)" strokeWidth="4"
                strokeLinecap="round" strokeDasharray={113} strokeDashoffset={113 - (progress / 100) * 113}
                initial={{ strokeDashoffset: 113 }}
                animate={{ strokeDashoffset: 113 - (progress / 100) * 113 }}
                transition={{ duration: 0.8 }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium tabular-nums text-foreground">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </Card>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <CategoryTab label="すべて" active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} count={topics.length} />
        {LEARNING_CATEGORIES.map((cat) => {
          const count = topics.filter((t) => t.category === cat).length;
          if (count === 0) return null;
          return (
            <CategoryTab
              key={cat}
              label={`${CATEGORY_ICONS[cat]} ${CATEGORY_LABELS[cat]}`}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              count={count}
            />
          );
        })}
        <CategoryTab label="📖 用語集" active={activeCategory === 'glossary'} onClick={() => setActiveCategory('glossary')} count={GLOSSARY.length} />
      </div>

      {/* Topics */}
      {activeCategory !== 'glossary' && (
        <div className="space-y-2">
          {filtered.map((topic, i) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              index={i}
              expanded={expandedTopic === topic.id}
              completed={completedTopics.has(topic.id)}
              onToggle={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
              onComplete={() => toggleComplete(topic.id)}
            />
          ))}
        </div>
      )}

      {/* Glossary */}
      {activeCategory === 'glossary' && (
        <Card>
          <input
            type="text"
            value={glossarySearch}
            onChange={(e) => setGlossarySearch(e.target.value)}
            placeholder="用語を検索..."
            className="mb-4 h-9 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-foreground placeholder:text-ink-subtle focus:outline-2 focus:outline-primary"
          />
          <div className="space-y-3">
            {filteredGlossary.map((term) => (
              <GlossaryItem key={term.term} term={term} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function CategoryTab({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count: number }): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors',
        active ? 'border-primary bg-primary-light font-medium text-primary' : 'border-border text-ink-muted hover:bg-[var(--color-surface-hover)]',
      )}
    >
      {label}
      <span className={cn('inline-flex h-4 min-w-4 items-center justify-center rounded-full text-[10px]', active ? 'bg-primary text-white' : 'bg-[var(--color-surface-alt)] text-ink-subtle')}>
        {count}
      </span>
    </button>
  );
}

function TopicCard({ topic, index, expanded, completed, onToggle, onComplete }: {
  topic: LearningTopic; index: number; expanded: boolean; completed: boolean;
  onToggle: () => void; onComplete: () => void;
}): React.ReactElement {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
      <Card className={cn(completed && 'opacity-60 border-l-[3px] border-l-positive')}>
        <button type="button" onClick={onToggle} className="flex w-full items-start gap-3 text-left">
          <span className="mt-0.5 text-lg">{CATEGORY_ICONS[topic.category]}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-medium', completed ? 'text-ink-muted line-through' : 'text-foreground')}>{topic.title}</span>
              {completed && <Badge variant="primary" className="text-[9px]">完了</Badge>}
            </div>
            <p className="mt-0.5 text-xs text-ink-muted">{topic.summary}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="default" className="text-[9px]">{CATEGORY_LABELS[topic.category]}</Badge>
              <span className="text-[10px] text-ink-subtle">{'★'.repeat(topic.difficulty)}{'☆'.repeat(3 - topic.difficulty)}</span>
              <span className="text-[10px] text-ink-subtle">{topic.estimatedMinutes}分</span>
            </div>
          </div>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-4 border-t border-border pt-4">
                <div className="space-y-3">
                  {topic.content.map((para, i) => (
                    <p key={i} className="text-sm leading-relaxed text-ink-muted">{para}</p>
                  ))}
                </div>
                <div className="mt-4 rounded-[var(--radius-md)] bg-primary-light px-4 py-3">
                  <p className="mb-1 text-xs font-medium text-primary">ポイント</p>
                  <ul className="space-y-1">
                    {topic.keyTakeaways.map((t) => (
                      <li key={t} className="text-xs text-ink-muted">• {t}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4">
                  <Button size="sm" variant={completed ? 'secondary' : 'primary'} onClick={onComplete}>
                    {completed ? '未完了にする' : '学習完了'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

function GlossaryItem({ term }: { term: GlossaryTerm }): React.ReactElement {
  return (
    <div className="border-b border-border/50 pb-2 last:border-0">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium text-foreground">{term.term}</span>
        <span className="text-[10px] text-ink-subtle">({term.reading})</span>
        <Badge variant="default" className="text-[9px]">{CATEGORY_LABELS[term.category]}</Badge>
      </div>
      <p className="mt-0.5 text-xs text-ink-muted">{term.definition}</p>
    </div>
  );
}
