'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskCard } from './task-card';
import { ActionApproval } from './action-approval';
import { TaskProgressTracker } from './task-progress-tracker';
import type { AgentTask, AgentMessage, TaskType } from '@/types/agent';
import { cn } from '@/lib/utils/cn';
import { formatCurrency } from '@/lib/utils/format';

const QUICK_ACTIONS = [
  { label: '固定費を削減したい', message: '毎月の固定費を見直して削減できるところを提案してください' },
  { label: 'サブスクを整理したい', message: 'サブスクリプションを監査して不要なものを特定してください' },
  { label: '節税対策を知りたい', message: '私の状況に合った節税対策を提案してください' },
  { label: '保険を見直したい', message: '現在の保険が適切か分析してください' },
  { label: '貯蓄率を上げたい', message: '貯蓄率を改善するための具体的なアクションプランを提案してください' },
] as const;

export function AgentChat(): React.ReactElement {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const sendMessage = useCallback(async (text: string): Promise<void> => {
    if (!text.trim() || isLoading) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const userMsg: AgentMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json() as { error?: string };
        setMessages((prev) => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'agent',
          content: data.error ?? 'エラーが発生しました。',
          timestamp: new Date().toISOString(),
        }]);
        setIsLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) { setIsLoading(false); return; }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data) as { text?: string };
            if (parsed.text) {
              fullContent += parsed.text;
              setStreamingContent(fullContent);
            }
          } catch { /* skip */ }
        }
      }

      const agentMsg: AgentMessage = {
        id: `msg-${Date.now()}`,
        role: 'agent',
        content: fullContent,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, agentMsg]);
      setStreamingContent('');

      // Auto-generate a task proposal from the response
      if (fullContent.length > 50) {
        generateTaskFromResponse(fullContent, text);
      }

      setIsLoading(false);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setIsLoading(false);
    }
  }, [isLoading]);

  const generateTaskFromResponse = (response: string, userRequest: string): void => {
    // Determine task type from keywords
    let type: TaskType = 'custom';
    if (/サブスク|定額|月額/.test(userRequest)) type = 'subscription_audit';
    else if (/節税|税|ふるさと|iDeCo|NISA/.test(userRequest)) type = 'tax_optimization';
    else if (/保険/.test(userRequest)) type = 'insurance_review';
    else if (/切替|乗り換え|サービス/.test(userRequest)) type = 'service_switch';

    const task: AgentTask = {
      id: `task-${Date.now()}`,
      type,
      status: 'proposed',
      title: extractTitle(response),
      description: response.slice(0, 150) + (response.length > 150 ? '...' : ''),
      estimatedSaving: estimateSaving(response),
      steps: generateSteps(type),
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [...prev, task]);
  };

  const approveTask = useCallback((taskId: string): void => {
    setTasks((prev) => prev.map((t) => {
      if (t.id !== taskId) return t;
      const updated = { ...t, status: 'executing' as const };
      // Simulate execution
      setTimeout(() => {
        setTasks((p) => p.map((tt) =>
          tt.id === taskId
            ? { ...tt, status: 'completed' as const, completedAt: new Date().toISOString(),
                steps: tt.steps.map((s) => ({ ...s, status: 'completed' as const })) }
            : tt,
        ));
      }, 3000);
      return updated;
    }));
  }, []);

  const cancelTask = useCallback((taskId: string): void => {
    setTasks((prev) => prev.map((t) =>
      t.id === taskId ? { ...t, status: 'cancelled' as const } : t,
    ));
  }, []);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    sendMessage(input);
  };

  const hasMessages = messages.length > 0;
  const activeTasks = tasks.filter((t) => t.status !== 'cancelled');
  const totalSavings = tasks
    .filter((t) => t.status === 'completed')
    .reduce((s, t) => s + t.estimatedSaving, 0);

  return (
    <div className="space-y-6">
      {/* Task progress tracker */}
      <TaskProgressTracker tasks={tasks} />

      {/* Task cards */}
      {activeTasks.length > 0 && (
        <div className="space-y-3">
          <p className="text-[13px] font-medium text-foreground">タスク</p>
          {activeTasks.map((task) => (
            task.status === 'proposed' ? (
              <ActionApproval
                key={task.id}
                task={task}
                onApprove={() => approveTask(task.id)}
                onCancel={() => cancelTask(task.id)}
              />
            ) : (
            <TaskCard
              key={task.id}
              task={task}
              onApprove={() => approveTask(task.id)}
              onCancel={() => cancelTask(task.id)}
            />
            )
          ))}
        </div>
      )}

      {/* Chat area */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LeafIcon />
            <CardTitle>金融エージェント</CardTitle>
          </div>
        </CardHeader>

        {/* Quick actions (when no messages) */}
        {!hasMessages && !isLoading && (
          <div className="py-4">
            <p className="mb-3 text-sm text-ink-muted">
              家計改善のアクションを提案します。何をしたいですか？
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => sendMessage(action.message)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-ink-muted transition-colors hover:bg-[var(--color-surface-hover)] hover:text-foreground"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className={cn('space-y-3', hasMessages && 'max-h-[400px] overflow-y-auto')}>
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}

          {isLoading && streamingContent && (
            <div className="rounded-[var(--radius-md)] border-l-[3px] border-primary bg-primary-light px-4 py-3">
              <FormattedText text={streamingContent} />
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
                className="ml-0.5 inline-block h-4 w-0.5 bg-primary"
              />
            </div>
          )}

          {isLoading && !streamingContent && (
            <div className="rounded-[var(--radius-md)] border-l-[3px] border-primary bg-primary-light px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                  ))}
                </div>
                <span className="text-xs text-ink-muted">分析中...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="家計改善について質問する..."
            disabled={isLoading}
            className="h-10 flex-1 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-foreground placeholder:text-ink-subtle focus:outline-2 focus:outline-offset-0 focus:outline-primary disabled:opacity-50"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>送信</Button>
        </form>

        <p className="mt-3 text-[10px] text-ink-subtle">
          ※ エージェントの提案は参考情報です。重要な判断は専門家にご相談ください。
        </p>
      </Card>
    </div>
  );
}

function MessageItem({ message }: { message: AgentMessage }): React.ReactElement {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] px-4 py-2.5">
          <p className="text-sm text-foreground">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-md)] border-l-[3px] border-primary bg-primary-light px-4 py-3">
      <FormattedText text={message.content} />
    </div>
  );
}

function FormattedText({ text }: { text: string }): React.ReactElement {
  return (
    <>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1.5" />;
        const formatted = line.split(/(\*\*[^*]+\*\*)/).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-medium text-foreground">{part.slice(2, -2)}</strong>;
          }
          return part;
        });
        return <p key={i} className="mt-1 text-sm text-ink-muted first:mt-0">{formatted}</p>;
      })}
    </>
  );
}

function LeafIcon(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-primary" aria-hidden="true">
      <path d="M13 3C13 3 10.5 3.5 8 6C5.5 8.5 5 11 5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 3C13 3 13 6 11 8C9 10 6 11 3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 13L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function extractTitle(response: string): string {
  const firstLine = response.split('\n').find((l) => l.trim().length > 0) ?? '';
  const cleaned = firstLine.replace(/\*\*/g, '').replace(/^\d+\.\s*/, '').trim();
  return cleaned.slice(0, 30) || '家計改善アクション';
}

function estimateSaving(response: string): number {
  const match = response.match(/([0-9,]+)円/);
  if (match) {
    const num = Number.parseInt(match[1].replace(/,/g, ''), 10);
    if (!Number.isNaN(num) && num > 0) return num;
  }
  return 0;
}

function generateSteps(type: TaskType): AgentTask['steps'] {
  const stepMap: Record<TaskType, Array<{ title: string; description: string }>> = {
    subscription_audit: [
      { title: '現在のサブスクを一覧化', description: 'クレカ明細からサブスクを特定' },
      { title: '利用頻度を分析', description: '直近3ヶ月の利用状況を確認' },
      { title: '不要なサブスクを解約', description: '使っていないサービスを整理' },
    ],
    tax_optimization: [
      { title: '現在の税務状況を確認', description: '所得・控除の現状把握' },
      { title: '適用可能な控除を特定', description: '未活用の節税策を洗い出し' },
      { title: '節税プランを策定', description: '具体的なアクションリストを作成' },
    ],
    insurance_review: [
      { title: '現在の保障内容を確認', description: '加入中の保険を棚卸し' },
      { title: '必要保障額を算出', description: 'ライフステージに合わせた試算' },
      { title: '最適プランを提案', description: '過不足のない保障設計' },
    ],
    service_switch: [
      { title: '現在のサービスを確認', description: '契約内容と料金の把握' },
      { title: '代替サービスを比較', description: 'コスト・品質の比較分析' },
      { title: '切替手続きをガイド', description: 'ステップバイステップで案内' },
    ],
    custom: [
      { title: '状況を分析', description: '現状の確認と課題の特定' },
      { title: 'アクションプランを策定', description: '具体的な改善策を立案' },
      { title: '実行・フォローアップ', description: '進捗確認と調整' },
    ],
  };

  return (stepMap[type] ?? stepMap.custom).map((s, i) => ({
    order: i + 1,
    title: s.title,
    description: s.description,
    status: 'pending' as const,
  }));
}
