'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AgentTask, TaskStep } from '@/types/agent';
import { TASK_TYPE_LABELS } from '@/types/agent';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

type ApprovalStage = 'proposal' | 'detail' | 'confirm' | 'executing' | 'completed' | 'cancelled';

interface ActionApprovalProps {
  task: AgentTask;
  onApprove: () => void;
  onCancel: () => void;
}

export function ActionApproval({ task, onApprove, onCancel }: ActionApprovalProps): React.ReactElement {
  const [stage, setStage] = useState<ApprovalStage>('proposal');

  const handleApprove = useCallback((): void => {
    setStage('executing');
    onApprove();
    // Simulate completion
    setTimeout(() => setStage('completed'), 3000);
  }, [onApprove]);

  const handleCancel = useCallback((): void => {
    setStage('cancelled');
    onCancel();
  }, [onCancel]);

  return (
    <Card className={cn(
      'border-l-[3px]',
      stage === 'proposal' || stage === 'detail' || stage === 'confirm' ? 'border-l-primary'
      : stage === 'executing' ? 'border-l-warning'
      : stage === 'completed' ? 'border-l-positive'
      : 'border-l-ink-subtle',
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
            <StageBadge stage={stage} />
          </div>
        </div>
        {task.estimatedSaving > 0 && (
          <div className="text-right">
            <p className="text-[10px] text-ink-subtle">見込み節約</p>
            <p className="font-display text-lg tabular-nums text-positive">¥{formatCurrency(task.estimatedSaving)}/年</p>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Stage 1: Proposal */}
        {stage === 'proposal' && (
          <motion.div
            key="proposal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3"
          >
            <p className="text-xs text-ink-muted">{task.description}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => setStage('detail')}>
                詳細を確認
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                スキップ
              </Button>
            </div>
          </motion.div>
        )}

        {/* Stage 2: Detail review */}
        {stage === 'detail' && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3"
          >
            <p className="text-xs text-ink-muted">{task.description}</p>

            {/* Steps preview */}
            <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] px-4 py-3">
              <p className="mb-2 text-xs font-medium text-ink-muted">実行ステップ</p>
              <div className="space-y-2">
                {task.steps.map((step) => (
                  <div key={step.order} className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-light text-[10px] font-medium text-primary">
                      {step.order}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-foreground">{step.title}</p>
                      <p className="text-[10px] text-ink-subtle">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risks/notes */}
            <div className="mt-3 rounded-[var(--radius-md)] border-l-[3px] border-warning bg-warning-bg px-4 py-2">
              <p className="text-xs text-warning">
                このアクションを実行する前に、関連する契約条件（違約金等）をご確認ください。
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => setStage('confirm')}>
                承認に進む
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setStage('proposal')}>
                戻る
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancel} className="ml-auto text-ink-subtle">
                キャンセル
              </Button>
            </div>
          </motion.div>
        )}

        {/* Stage 3: Final confirmation */}
        {stage === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3"
          >
            <div className="rounded-[var(--radius-md)] bg-primary-light px-4 py-3">
              <p className="text-sm font-medium text-foreground">実行を承認しますか？</p>
              <p className="mt-1 text-xs text-ink-muted">
                「{task.title}」を実行します。このアクションは後から取り消すことも可能です。
              </p>
              {task.estimatedSaving > 0 && (
                <p className="mt-2 text-xs text-primary">
                  見込み効果: 年間¥{formatCurrency(task.estimatedSaving)}の節約
                </p>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={handleApprove}>
                承認して実行
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setStage('detail')}>
                戻る
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancel} className="ml-auto text-ink-subtle">
                キャンセル
              </Button>
            </div>
          </motion.div>
        )}

        {/* Stage 4: Executing */}
        {stage === 'executing' && (
          <motion.div
            key="executing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3"
          >
            <div className="space-y-2">
              {task.steps.map((step, i) => (
                <ExecutingStep key={step.order} step={step} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Stage 5: Completed */}
        {stage === 'completed' && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3"
          >
            <div className="rounded-[var(--radius-md)] bg-positive-bg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-positive">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <span className="text-sm font-medium text-positive">タスク完了</span>
              </div>
              {task.estimatedSaving > 0 && (
                <p className="mt-1 ml-8 text-xs text-positive">
                  年間¥{formatCurrency(task.estimatedSaving)}の節約が見込まれます
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Stage 6: Cancelled */}
        {stage === 'cancelled' && (
          <motion.div
            key="cancelled"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3"
          >
            <p className="text-xs text-ink-subtle">このタスクはスキップされました</p>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function StageBadge({ stage }: { stage: ApprovalStage }): React.ReactElement {
  const config: Record<ApprovalStage, { label: string; color: string }> = {
    proposal: { label: '提案', color: 'text-primary' },
    detail: { label: '詳細確認', color: 'text-info' },
    confirm: { label: '承認待ち', color: 'text-warning' },
    executing: { label: '実行中', color: 'text-warning' },
    completed: { label: '完了', color: 'text-positive' },
    cancelled: { label: 'スキップ', color: 'text-ink-subtle' },
  };
  const c = config[stage];
  return <Badge variant="default" className={cn('text-[10px]', c.color)}>{c.label}</Badge>;
}

function ExecutingStep({ step, index }: { step: TaskStep; index: number }): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.8, duration: 0.3 }}
      className="flex items-center gap-2"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.8 + 0.5, duration: 0.2 }}
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-positive">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" /></svg>
        </div>
      </motion.div>
      <span className="text-xs text-foreground">{step.title}</span>
    </motion.div>
  );
}

function TaskIcon({ type }: { type: string }): React.ReactElement {
  const icons: Record<string, string> = {
    service_switch: '🔄', subscription_audit: '📋', tax_optimization: '💰', insurance_review: '🛡️', custom: '⚡',
  };
  return <span className="text-base">{icons[type] ?? '⚡'}</span>;
}
