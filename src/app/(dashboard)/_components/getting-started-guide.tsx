'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GUIDE_STEPS } from '@/lib/constants/guide-steps';
import { NavIcon } from '@/components/layout/nav-icon';
import { cn } from '@/lib/utils/cn';

const VISITED_KEY = 'kanejo_guide_visited';
const DISMISSED_KEY = 'kanejo_guide_dismissed';

export function GettingStartedGuide(): React.ReactElement | null {
  const pathname = usePathname();
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // localStorageから復元
  useEffect(() => {
    const raw = localStorage.getItem(VISITED_KEY);
    if (raw) {
      try {
        setVisited(new Set(JSON.parse(raw) as string[]));
      } catch {
        // noop
      }
    }
    setDismissed(localStorage.getItem(DISMISSED_KEY) === 'true');
    setMounted(true);
  }, []);

  // ページ遷移のたびに訪問済みを更新
  useEffect(() => {
    if (!mounted) return;
    const matched = GUIDE_STEPS.find(
      (s) => pathname === s.href || pathname.startsWith(`${s.href}/`),
    );
    if (!matched || visited.has(matched.href)) return;
    const next = new Set([...visited, matched.href]);
    setVisited(next);
    localStorage.setItem(VISITED_KEY, JSON.stringify([...next]));
  }, [pathname, mounted, visited]);

  const handleDismiss = (): void => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  if (!mounted || dismissed) return null;

  const completedCount = GUIDE_STEPS.filter((s) => visited.has(s.href)).length;
  const nextStep = GUIDE_STEPS.find((s) => !visited.has(s.href));
  const allDone = completedCount === GUIDE_STEPS.length;

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="rounded-[var(--radius-lg)] border border-border bg-surface p-6"
      aria-label="はじめてのガイド"
    >
      {/* ヘッダー */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-medium text-foreground">Kanejoの使いかた</h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            {allDone
              ? 'すべての機能を確認しました。引き続きご活用ください'
              : `${completedCount} / ${GUIDE_STEPS.length} 完了${nextStep ? ` — まずは「${nextStep.title}」から始めましょう` : ''}`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] transition-colors',
            'text-ink-subtle hover:bg-[var(--color-surface-hover)] hover:text-foreground',
          )}
          aria-label="ガイドを閉じる"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* プログレスバー */}
      <div className="mb-5 h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${(completedCount / GUIDE_STEPS.length) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* ステップグリッド */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {GUIDE_STEPS.map((step) => {
          const isDone = visited.has(step.href);
          const isNext = step.href === nextStep?.href;

          return (
            <Link
              key={step.href}
              href={step.href}
              className={cn(
                'group flex items-start gap-3 rounded-[var(--radius-md)] border p-4 transition-colors',
                isDone
                  ? 'border-border opacity-50 hover:opacity-70'
                  : isNext
                    ? 'border-primary/40 bg-primary-light hover:border-primary/70'
                    : 'border-border hover:bg-[var(--color-surface-hover)]',
              )}
            >
              {/* ステップ番号 or チェックマーク */}
              <div
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                  isDone
                    ? 'bg-primary text-white'
                    : isNext
                      ? 'bg-primary text-white'
                      : 'bg-[var(--color-surface-hover)] text-ink-muted',
                )}
              >
                {isDone ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3"
                    aria-hidden
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.step
                )}
              </div>

              {/* テキスト */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <NavIcon name={step.icon} className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                  <span
                    className={cn(
                      'text-sm font-medium leading-snug',
                      isDone ? 'text-ink-muted' : 'text-foreground',
                    )}
                  >
                    {step.title}
                  </span>
                  {isNext && (
                    <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium leading-none text-white">
                      次へ
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink-subtle">
                  {step.description}
                </p>
              </div>

              {/* 矢印 */}
              {!isDone && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-1 h-3.5 w-3.5 shrink-0 text-ink-subtle transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              )}
            </Link>
          );
        })}
      </div>
    </motion.section>
  );
}
