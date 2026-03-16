'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AgentTask } from '@/types/agent';
import { TASK_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from '@/types/agent';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface TaskProgressTrackerProps {
  tasks: AgentTask[];
}

export function TaskProgressTracker({ tasks }: TaskProgressTrackerProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const completed = tasks.filter((t) => t.status === 'completed');
  const executing = tasks.filter((t) => t.status === 'executing');
  const proposed = tasks.filter((t) => t.status === 'proposed' || t.status === 'approved');
  const failed = tasks.filter((t) => t.status === 'failed');
  const totalSaving = completed.reduce((s, t) => s + t.estimatedSaving, 0);
  const pendingSaving = [...executing, ...proposed].reduce((s, t) => s + t.estimatedSaving, 0);

  if (tasks.length === 0) return <></>;

  return (
    <div ref={ref} className="space-y-4">
      {/* Summary metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.2 }}>
          <Card className="py-4">
            <p className="text-[10px] text-ink-subtle">実行済み節約</p>
            <p className="mt-0.5 font-display text-xl tabular-nums text-positive">¥{formatCurrency(totalSaving)}</p>
            <p className="text-[10px] text-ink-subtle">/年</p>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.2, delay: 0.05 }}>
          <Card className="py-4">
            <p className="text-[10px] text-ink-subtle">見込み節約</p>
            <p className="mt-0.5 font-display text-xl tabular-nums text-primary">¥{formatCurrency(pendingSaving)}</p>
            <p className="text-[10px] text-ink-subtle">/年</p>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.2, delay: 0.1 }}>
          <Card className="py-4">
            <p className="text-[10px] text-ink-subtle">完了タスク</p>
            <p className="mt-0.5 font-display text-xl tabular-nums text-foreground">{completed.length}<span className="text-sm text-ink-subtle">/{tasks.length}</span></p>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.2, delay: 0.15 }}>
          <Card className="py-4">
            <p className="text-[10px] text-ink-subtle">達成率</p>
            <ProgressRing completed={completed.length} total={tasks.length} />
          </Card>
        </motion.div>
      </div>

      {/* Task timeline */}
      <Card>
        <CardHeader>
          <CardTitle>タスク履歴</CardTitle>
        </CardHeader>

        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-3">
            {/* Executing tasks */}
            {executing.map((task) => (
              <TaskTimelineItem key={task.id} task={task} />
            ))}

            {/* Proposed tasks */}
            {proposed.map((task) => (
              <TaskTimelineItem key={task.id} task={task} />
            ))}

            {/* Completed tasks */}
            {completed.map((task) => (
              <TaskTimelineItem key={task.id} task={task} />
            ))}

            {/* Failed tasks */}
            {failed.map((task) => (
              <TaskTimelineItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function TaskTimelineItem({ task }: { task: AgentTask }): React.ReactElement {
  const statusColor = STATUS_COLORS[task.status];
  const completedSteps = task.steps.filter((s) => s.status === 'completed').length;
  const progress = task.steps.length > 0 ? completedSteps / task.steps.length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative flex gap-3 pl-1"
    >
      {/* Timeline dot */}
      <div className={cn(
        'z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
        task.status === 'completed' ? 'bg-positive' :
        task.status === 'executing' ? 'bg-warning' :
        task.status === 'failed' ? 'bg-negative' :
        'bg-primary-light border border-primary',
      )}>
        {task.status === 'completed' ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : task.status === 'executing' ? (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-3 w-3">
            <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5" stroke="white" strokeWidth="2" opacity="0.3" /><path d="M13 8A5 5 0 0 0 8 3" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
          </motion.div>
        ) : task.status === 'failed' ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 3L7 7M7 3L3 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
        ) : (
          <div className="h-2 w-2 rounded-full bg-primary" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{task.title}</span>
          <Badge variant="default" className={cn('text-[9px]', statusColor)}>{STATUS_LABELS[task.status]}</Badge>
          <Badge variant="default" className="text-[9px]">{TASK_TYPE_LABELS[task.type]}</Badge>
        </div>

        {/* Step progress bar */}
        {task.steps.length > 0 && task.status !== 'completed' && task.status !== 'cancelled' && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
              <motion.div
                className={cn('h-full rounded-full', task.status === 'failed' ? 'bg-negative' : 'bg-primary')}
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-[10px] tabular-nums text-ink-subtle">{completedSteps}/{task.steps.length}</span>
          </div>
        )}

        {/* Saving */}
        {task.estimatedSaving > 0 && (
          <p className={cn('mt-1 text-xs tabular-nums', task.status === 'completed' ? 'text-positive' : 'text-ink-muted')}>
            {task.status === 'completed' ? '節約達成' : '見込み'}: ¥{formatCurrency(task.estimatedSaving)}/年
          </p>
        )}

        {/* Completion time */}
        {task.completedAt && (
          <p className="mt-0.5 text-[10px] text-ink-subtle">
            {new Date(task.completedAt).toLocaleDateString('ja-JP')} 完了
          </p>
        )}
      </div>
    </motion.div>
  );
}

function ProgressRing({ completed, total }: { completed: number; total: number }): React.ReactElement {
  const pct = total > 0 ? (completed / total) * 100 : 0;
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative mt-1 h-12 w-12">
      <svg viewBox="0 0 44 44" className="h-full w-full -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="var(--color-surface-hover)" strokeWidth="4" />
        <motion.circle
          cx="22" cy="22" r={r} fill="none" stroke="var(--color-primary)" strokeWidth="4"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-sm tabular-nums text-foreground">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}
