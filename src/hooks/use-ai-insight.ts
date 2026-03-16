'use client';

import { useState, useCallback, useRef } from 'react';

interface UseAiInsightReturn {
  content: string;
  isLoading: boolean;
  error: string | null;
  isCached: boolean;
  generate: (options?: { refresh?: boolean }) => void;
  reset: () => void;
}

export function useAiInsight(): UseAiInsightReturn {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback((options?: { refresh?: boolean }): void => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setContent('');
    setIsLoading(true);
    setError(null);
    setIsCached(false);

    (async (): Promise<void> => {
      try {
        const response = await fetch('/api/diagnosis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: options?.refresh ?? false }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const data = await response.json() as { error?: string };
          setError(data.error ?? 'エラーが発生しました。');
          setIsLoading(false);
          return;
        }

        setIsCached(response.headers.get('X-Cache') === 'HIT');

        const reader = response.body?.getReader();
        if (!reader) {
          setError('ストリーミングの初期化に失敗しました。');
          setIsLoading(false);
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              setIsLoading(false);
              return;
            }

            try {
              const parsed = JSON.parse(data) as { text?: string; error?: string };
              if (parsed.error) {
                setError(parsed.error);
                setIsLoading(false);
                return;
              }
              if (parsed.text) {
                setContent((prev) => prev + parsed.text);
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }

        setIsLoading(false);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError('通信エラーが発生しました。もう一度お試しください。');
        setIsLoading(false);
      }
    })();
  }, []);

  const reset = useCallback((): void => {
    abortRef.current?.abort();
    setContent('');
    setIsLoading(false);
    setError(null);
    setIsCached(false);
  }, []);

  return { content, isLoading, error, isCached, generate, reset };
}
