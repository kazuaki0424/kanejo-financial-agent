'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Alert, AlertType, AlertPriority } from '@/lib/utils/alert-engine';
import { cn } from '@/lib/utils/cn';

interface AlertListProps {
  alerts: Alert[];
}

const PRIORITY_CONFIG: Record<AlertPriority, { bg: string; border: string; icon: string; label: string }> = {
  urgent: { bg: 'bg-negative-bg', border: 'border-l-negative', icon: '⚠️', label: '緊急' },
  warning: { bg: 'bg-warning-bg', border: 'border-l-warning', icon: '⚡', label: '注意' },
  info: { bg: '', border: 'border-l-primary', icon: '💡', label: '情報' },
};

const TYPE_LABELS: Record<AlertType, string> = {
  spending_anomaly: '支出',
  score_change: 'スコア',
  deadline: '期限',
  savings_opportunity: '節約',
  system: 'システム',
};

export function AlertList({ alerts: initialAlerts }: AlertListProps): React.ReactElement {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [filter, setFilter] = useState<'all' | AlertPriority>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return alerts;
    return alerts.filter((a) => a.priority === filter);
  }, [alerts, filter]);

  const unreadCount = alerts.filter((a) => !a.read).length;

  const markRead = (id: string): void => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, read: true } : a));
  };

  const markAllRead = (): void => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const urgentCount = alerts.filter((a) => a.priority === 'urgent').length;
  const warningCount = alerts.filter((a) => a.priority === 'warning').length;
  const infoCount = alerts.filter((a) => a.priority === 'info').length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className={urgentCount > 0 ? 'border-l-[3px] border-l-negative' : ''}>
          <p className="text-[10px] text-ink-subtle">緊急</p>
          <p className={cn('font-display text-2xl tabular-nums', urgentCount > 0 ? 'text-negative' : 'text-foreground')}>{urgentCount}</p>
        </Card>
        <Card className={warningCount > 0 ? 'border-l-[3px] border-l-warning' : ''}>
          <p className="text-[10px] text-ink-subtle">注意</p>
          <p className={cn('font-display text-2xl tabular-nums', warningCount > 0 ? 'text-warning' : 'text-foreground')}>{warningCount}</p>
        </Card>
        <Card>
          <p className="text-[10px] text-ink-subtle">情報</p>
          <p className="font-display text-2xl tabular-nums text-foreground">{infoCount}</p>
        </Card>
      </div>

      {/* Filter + actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] p-0.5">
          {(['all', 'urgent', 'warning', 'info'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-[var(--radius-sm)] px-3 py-1 text-xs font-medium transition-colors',
                filter === f ? 'bg-surface text-foreground shadow-sm' : 'text-ink-muted',
              )}
            >
              {f === 'all' ? `すべて (${alerts.length})` : `${PRIORITY_CONFIG[f].label} (${alerts.filter((a) => a.priority === f).length})`}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs">
            すべて既読
          </Button>
        )}
      </div>

      {/* Alert list */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((alert, i) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              index={i}
              onRead={() => markRead(alert.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <Card>
          <p className="py-6 text-center text-sm text-ink-subtle">
            {filter === 'all' ? '通知はありません' : 'この優先度の通知はありません'}
          </p>
        </Card>
      )}
    </div>
  );
}

function AlertCard({ alert, index, onRead }: { alert: Alert; index: number; onRead: () => void }): React.ReactElement {
  const config = PRIORITY_CONFIG[alert.priority];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
    >
      <Card className={cn(
        'border-l-[3px] transition-colors',
        config.border,
        !alert.read && config.bg,
        alert.read && 'opacity-60',
      )}>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-base">{config.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-medium', alert.read ? 'text-ink-muted' : 'text-foreground')}>
                {alert.title}
              </span>
              {!alert.read && <span className="h-2 w-2 rounded-full bg-primary" />}
              <Badge variant="default" className="text-[9px]">{TYPE_LABELS[alert.type]}</Badge>
            </div>
            <p className="mt-1 text-xs text-ink-muted">{alert.message}</p>
            <div className="mt-2 flex items-center gap-2">
              {alert.actionHref && alert.actionLabel && (
                <Button asChild variant="secondary" size="sm" className="text-xs" onClick={onRead}>
                  <Link href={alert.actionHref}>{alert.actionLabel}</Link>
                </Button>
              )}
              {!alert.read && (
                <Button variant="ghost" size="sm" onClick={onRead} className="text-xs text-ink-subtle">
                  既読
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
