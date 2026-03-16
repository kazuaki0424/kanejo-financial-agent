'use client';

import { useState, useCallback, useRef } from 'react';
import type { SimulationParams } from '@/lib/utils/cashflow-engine';

interface UseSimulationInsightReturn {
  content: string;
  isLoading: boolean;
  error: string | null;
  generate: (params: SimulationParams) => void;
  reset: () => void;
}

export function useSimulationInsight(): UseSimulationInsightReturn {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback((params: SimulationParams): void => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setContent('');
    setIsLoading(true);
    setError(null);

    (async (): Promise<void> => {
      try {
        const response = await fetch('/api/simulation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ params }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const data = await response.json() as { error?: string };
          setError(data.error ?? 'エラーが発生しました。');
          setIsLoading(false);
          return;
        }

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
            if (data === '[DONE]') { setIsLoading(false); return; }

            try {
              const parsed = JSON.parse(data) as { text?: string; error?: string };
              if (parsed.error) { setError(parsed.error); setIsLoading(false); return; }
              if (parsed.text) setContent((prev) => prev + parsed.text);
            } catch {
              // skip
            }
          }
        }
        setIsLoading(false);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError('通信エラーが発生しました。');
        setIsLoading(false);
      }
    })();
  }, []);

  const reset = useCallback((): void => {
    abortRef.current?.abort();
    setContent('');
    setIsLoading(false);
    setError(null);
  }, []);

  return { content, isLoading, error, generate, reset };
}
