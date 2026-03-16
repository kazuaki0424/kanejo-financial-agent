'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { importCsv } from '@/app/(dashboard)/diagnosis/_actions/transactions';
import type { ImportResult } from '@/lib/adapters/data-source';
import { cn } from '@/lib/utils/cn';

export function CsvImport(): React.ReactElement {
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File): Promise<void> => {
    if (!file.name.endsWith('.csv')) {
      setResult({ success: false, imported: 0, skipped: 0, errors: ['CSVファイルを選択してください。'] });
      return;
    }

    setFileName(file.name);
    setIsImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const importResult = await importCsv(text);
      setResult(importResult);
    } catch {
      setResult({ success: false, imported: 0, skipped: 0, errors: ['ファイルの読み込みに失敗しました。'] });
    } finally {
      setIsImporting(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center rounded-[var(--radius-md)] border-2 border-dashed px-6 py-8 text-center transition-colors',
          isDragging ? 'border-primary bg-primary-light' : 'border-border bg-[var(--color-surface-alt)]',
        )}
      >
        <UploadIcon />
        <p className="mt-3 text-sm text-foreground">
          CSVファイルをドラッグ&ドロップ
        </p>
        <p className="mt-1 text-xs text-ink-subtle">
          または
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-2"
          onClick={() => fileRef.current?.click()}
          disabled={isImporting}
        >
          ファイルを選択
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Loading */}
      {isImporting && (
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="h-4 w-4"
          >
            <svg viewBox="0 0 16 16" fill="none" className="text-primary">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.2" />
              <path d="M14 8A6 6 0 0 0 8 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.div>
          {fileName} をインポート中...
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {result.success ? (
              <div className="rounded-[var(--radius-md)] bg-positive-bg px-4 py-3">
                <p className="text-sm font-medium text-positive">
                  インポート完了
                </p>
                <p className="mt-1 text-xs text-positive">
                  {result.imported}件を取り込みました
                  {result.skipped > 0 && `（${result.skipped}件スキップ）`}
                </p>
              </div>
            ) : (
              <div className="rounded-[var(--radius-md)] bg-negative-bg px-4 py-3">
                <p className="text-sm font-medium text-negative">
                  インポートに失敗しました
                </p>
                {result.errors.map((err, i) => (
                  <p key={i} className="mt-1 text-xs text-negative">{err}</p>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Format guide */}
      <details className="text-xs text-ink-subtle">
        <summary className="cursor-pointer hover:text-ink-muted">対応フォーマット</summary>
        <div className="mt-2 rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] px-3 py-2">
          <p className="font-medium text-ink-muted">必須列:</p>
          <p>日付（日付/date）、金額（金額/amount）</p>
          <p className="mt-1 font-medium text-ink-muted">任意列:</p>
          <p>内容（内容/摘要）、カテゴリ（カテゴリ/分類）、種別（収支/type）</p>
          <p className="mt-2 font-medium text-ink-muted">例:</p>
          <code className="block mt-1 font-mono text-[11px]">
            日付,金額,内容,カテゴリ<br />
            2026-03-01,-80000,3月分家賃,住居<br />
            2026-03-15,500000,3月給与,給与
          </code>
        </div>
      </details>
    </div>
  );
}

function UploadIcon(): React.ReactElement {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-ink-subtle" aria-hidden="true">
      <path d="M16 22V10M16 10L11 15M16 10L21 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 22V24C6 25.1 6.9 26 8 26H24C25.1 26 26 25.1 26 24V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
