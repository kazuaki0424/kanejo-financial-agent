'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  type AgentTask,
  TASK_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/types/agent';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface TaskCardProps {
  task: AgentTask;
  onApprove?: () => void;
  onCancel?: () => void;
}

export function TaskCard({ task, onApprove, onCancel }: TaskCardProps): React.ReactElement {
  const statusColor = STATUS_COLORS[task.status];
  const isProposed = task.status === 'proposed';
  const isExecuting = task.status === 'executing';
  const isCompleted = task.status === 'completed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        'border-l-[3px]',
        isProposed ? 'border-l-primary' : isCompleted ? 'border-l-positive' : task.status === 'failed' ? 'border-l-negative' : 'border-l-border',
      )}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TaskIcon type={task.type} />
              <span className="text-sm font-medium text-foreground">{task.title}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="default" className="text-[10px]">{TASK_TYPE_LABELS[task.type]}</Badge>
              <Badge variant="default" className={cn('text-[10px]', statusColor)}>{STATUS_LABELS[task.status]}</Badge>
            </div>
          </div>
          {task.estimatedSaving > 0 && (
            <div className="text-right">
              <p className="text-[10px] text-ink-subtle">見込み節約</p>
              <p className="font-display text-lg tabular-nums text-positive">
                ¥{formatCurrency(task.estimatedSaving)}
              </p>
              <p className="text-[10px] text-ink-subtle">/年</p>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="mt-2 text-xs text-ink-muted">{task.description}</p>

        {/* Steps */}
        {task.steps.length > 0 && (
          <div className="mt-3">
            <div className="space-y-1.5">
              {task.steps.map((step) => (
                <div key={step.order} className="flex items-center gap-2">
                  <StepIndicator status={step.status} />
                  <span className={cn(
                    'text-xs',
                    step.status === 'completed' ? 'text-positive line-through' : step.status === 'in_progress' ? 'text-foreground font-medium' : 'text-ink-muted',
                  )}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {isProposed && (
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={onApprove}>承認して実行</Button>
            <Button variant="ghost" size="sm" onClick={onCancel}>スキップ</Button>
          </div>
        )}

        {isExecuting && (
          <div className="mt-3 flex items-center gap-2 text-xs text-warning">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="h-3 w-3"
            >
              <svg viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.2" />
                <path d="M14 8A6 6 0 0 0 8 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </motion.div>
            実行中...
          </div>
        )}

        {isCompleted && task.estimatedSaving > 0 && (
          <div className="mt-3 rounded-[var(--radius-sm)] bg-positive-bg px-3 py-2 text-xs text-positive">
            タスクが完了しました。年間¥{formatCurrency(task.estimatedSaving)}の節約が見込まれます。
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function StepIndicator({ status }: { status: string }): React.ReactElement {
  if (status === 'completed') {
    return (
      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-positive">
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" /></svg>
      </div>
    );
  }
  if (status === 'in_progress') {
    return <div className="h-4 w-4 rounded-full border-2 border-primary bg-primary-light" />;
  }
  return <div className="h-4 w-4 rounded-full border border-border" />;
}

function TaskIcon({ type }: { type: string }): React.ReactElement {
  const icons: Record<string, string> = {
    service_switch: '🔄',
    subscription_audit: '📋',
    tax_optimization: '💰',
    insurance_review: '🛡️',
    custom: '⚡',
  };
  return <span className="text-base">{icons[type] ?? '⚡'}</span>;
}
