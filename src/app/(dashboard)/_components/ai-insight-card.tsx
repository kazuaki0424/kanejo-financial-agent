'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAiInsight } from '@/hooks/use-ai-insight';
import { cn } from '@/lib/utils/cn';

interface AiInsightCardProps {
  autoGenerate?: boolean;
}

export function AiInsightCard({ autoGenerate = false }: AiInsightCardProps): React.ReactElement {
  const { content, isLoading, error, isCached, generate } = useAiInsight();
  const contentRef = useRef<HTMLDivElement>(null);
  const hasGenerated = useRef(false);

  // Auto-generate on mount (for diagnosis page)
  useEffect(() => {
    if (autoGenerate && !hasGenerated.current) {
      hasGenerated.current = true;
      generate();
    }
  }, [autoGenerate, generate]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (contentRef.current && isLoading) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content, isLoading]);

  const hasContent = content.length > 0;

  return (
    <Card>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LeafIcon />
          <span className="text-[13px] font-medium text-foreground">AIインサイト</span>
          {isCached && hasContent && !isLoading && (
            <span className="rounded-full bg-[var(--color-surface-alt)] px-2 py-0.5 text-[10px] text-ink-subtle">
              キャッシュ
            </span>
          )}
        </div>
        {hasContent && !isLoading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => generate({ refresh: true })}
            className="text-xs"
          >
            <RefreshIcon />
            再分析
          </Button>
        )}
      </div>

      {/* Empty state */}
      {!hasContent && !isLoading && !error && (
        <div className="flex items-center gap-4 rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] px-4 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light">
            <LeafIcon />
          </div>
          <div className="flex-1">
            <p className="text-sm text-foreground">家計データをAIが分析します</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              あなたの収支・資産・スコアに基づいた改善提案を生成します
            </p>
          </div>
          <Button onClick={() => generate()} size="sm">
            分析を開始
          </Button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-[var(--radius-md)] bg-negative-bg px-4 py-3">
          <p className="text-sm text-negative">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => generate()} className="mt-2 text-xs text-negative">
            再試行
          </Button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && !hasContent && (
        <div className="space-y-3 rounded-[var(--radius-md)] border-l-[3px] border-primary bg-primary-light px-4 py-4">
          <div className="flex items-center gap-2">
            <LoadingDots />
            <span className="text-xs text-ink-muted">分析中...</span>
          </div>
        </div>
      )}

      {/* Insight content */}
      {hasContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div
            ref={contentRef}
            className="max-h-[400px] overflow-y-auto rounded-[var(--radius-md)] border-l-[3px] border-primary bg-primary-light px-4 py-3"
          >
            <div className="text-sm leading-relaxed text-foreground">
              <FormattedContent text={content} />
              {isLoading && <StreamingCursor />}
            </div>
          </div>

          {/* Disclaimer */}
          {!isLoading && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-3 text-[10px] leading-relaxed text-ink-subtle"
            >
              ※ 本情報は一般的な金融知識の提供を目的としており、個別の投資・税務・法律に関する助言ではありません。最終的な判断はご自身の責任において、必要に応じて専門家にご相談ください。
            </motion.p>
          )}
        </motion.div>
      )}
    </Card>
  );
}

function FormattedContent({ text }: { text: string }): React.ReactElement {
  const lines = text.split('\n');

  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        // Numbered list item with bold title
        const numberedMatch = trimmed.match(/^(\d+)\.\s+\*\*(.+?)\*\*(.*)/);
        if (numberedMatch) {
          return (
            <div key={i} className="mt-3 first:mt-0">
              <div className="flex items-baseline gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                  {numberedMatch[1]}
                </span>
                <span className="text-sm font-medium text-foreground">{numberedMatch[2]}</span>
              </div>
              {numberedMatch[3] && (
                <p className="mt-1 ml-7 text-sm text-ink-muted">{numberedMatch[3].trim()}</p>
              )}
            </div>
          );
        }

        // Bold formatting inline
        const formatted = trimmed.split(/(\*\*[^*]+\*\*)/).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={j} className="font-medium text-foreground">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });

        // "全体として" summary line
        if (trimmed.startsWith('全体として')) {
          return (
            <p key={i} className="mt-3 border-t border-[var(--color-border)] pt-3 text-sm text-ink-muted">
              {formatted}
            </p>
          );
        }

        // Continuation line (indented content under a numbered item)
        if (line.startsWith('   ') || line.startsWith('\t')) {
          return (
            <p key={i} className="ml-7 text-sm text-ink-muted">
              {formatted}
            </p>
          );
        }

        return (
          <p key={i} className="mt-1 text-sm text-ink-muted">
            {formatted}
          </p>
        );
      })}
    </>
  );
}

function StreamingCursor(): React.ReactElement {
  return (
    <motion.span
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
      className="ml-0.5 inline-block h-4 w-0.5 bg-primary"
    />
  );
}

function LoadingDots(): React.ReactElement {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
        />
      ))}
    </div>
  );
}

function LeafIcon(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-primary" aria-hidden="true">
      <path
        d="M13 3C13 3 10.5 3.5 8 6C5.5 8.5 5 11 5 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M13 3C13 3 13 6 11 8C9 10 6 11 3 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M3 13L5 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RefreshIcon(): React.ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-current" aria-hidden="true">
      <path d="M10 3.5A4.5 4.5 0 1 0 10.5 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10 1.5V3.5H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
