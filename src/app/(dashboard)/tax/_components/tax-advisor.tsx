'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

const SUGGESTED_QUESTIONS = [
  '副業収入がある場合の最適な申告方法は？',
  'iDeCoとNISAはどちらを優先すべき？',
  'ふるさと納税の上限を最大化するには？',
  '住宅購入時の税制優遇を教えて',
  '医療費控除はどんな場合に使える？',
] as const;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function TaxAdvisor(): React.ReactElement {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback((): void => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const sendQuestion = useCallback(async (question: string): Promise<void> => {
    if (!question.trim() || isLoading) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      const response = await fetch('/api/tax-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json() as { error?: string };
        setMessages((prev) => [...prev, { role: 'assistant', content: data.error ?? 'エラーが発生しました。' }]);
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
            const parsed = JSON.parse(data) as { text?: string; error?: string };
            if (parsed.text) {
              fullContent += parsed.text;
              setStreamingContent(fullContent);
            }
          } catch { /* skip */ }
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: fullContent }]);
      setStreamingContent('');
      setIsLoading(false);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setMessages((prev) => [...prev, { role: 'assistant', content: '通信エラーが発生しました。' }]);
      setIsLoading(false);
    }
  }, [isLoading]);

  const handleSubmit = useCallback((e: React.FormEvent): void => {
    e.preventDefault();
    sendQuestion(input);
  }, [input, sendQuestion]);

  const hasMessages = messages.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <LeafIcon />
          <CardTitle>AI税務アドバイザー</CardTitle>
        </div>
      </CardHeader>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className={cn(
          'overflow-y-auto',
          hasMessages ? 'max-h-[400px] min-h-[200px]' : '',
        )}
      >
        {!hasMessages && !isLoading && (
          <div className="py-4">
            <p className="mb-3 text-sm text-ink-muted">
              節税に関する質問にAIがお答えします。以下から選ぶか、自由に質問してください。
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendQuestion(q)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-ink-muted transition-colors hover:bg-[var(--color-surface-hover)] hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {/* Streaming */}
          {isLoading && streamingContent && (
            <div className="rounded-[var(--radius-md)] border-l-[3px] border-primary bg-primary-light px-4 py-3">
              <FormattedText text={streamingContent} />
              <StreamingCursor />
            </div>
          )}

          {isLoading && !streamingContent && (
            <div className="rounded-[var(--radius-md)] border-l-[3px] border-primary bg-primary-light px-4 py-3">
              <LoadingDots />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="節税について質問する..."
          disabled={isLoading}
          className={cn(
            'h-10 flex-1 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-foreground',
            'placeholder:text-ink-subtle focus:outline-2 focus:outline-offset-0 focus:outline-primary',
            'disabled:opacity-50',
          )}
        />
        <Button type="submit" disabled={isLoading || !input.trim()} size="md">
          送信
        </Button>
      </form>

      {/* Disclaimer */}
      <p className="mt-3 text-[10px] leading-relaxed text-ink-subtle">
        ※ 本情報は一般的な税務知識の提供を目的としており、個別の税務相談ではありません。
        確定申告や節税の最終判断は、税理士等の専門家にご相談ください。
      </p>
    </Card>
  );
}

function MessageBubble({ message }: { message: Message }): React.ReactElement {
  if (message.role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] px-4 py-2.5">
          <p className="text-sm text-foreground">{message.content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--radius-md)] border-l-[3px] border-primary bg-primary-light px-4 py-3"
    >
      <FormattedText text={message.content} />
    </motion.div>
  );
}

function FormattedText({ text }: { text: string }): React.ReactElement {
  const lines = text.split('\n');

  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1.5" />;

        const formatted = trimmed.split(/(\*\*[^*]+\*\*)/).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-medium text-foreground">{part.slice(2, -2)}</strong>;
          }
          return part;
        });

        // Numbered item
        if (/^\d+\./.test(trimmed)) {
          return <p key={i} className="mt-2 text-sm text-ink-muted first:mt-0">{formatted}</p>;
        }

        return <p key={i} className="mt-1 text-sm text-ink-muted first:mt-0">{formatted}</p>;
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
    <div className="flex items-center gap-2">
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
      <span className="text-xs text-ink-muted">回答を生成中...</span>
    </div>
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
