'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ManualEntryForm } from './manual-entry-form';
import { CsvImport } from './csv-import';
import { cn } from '@/lib/utils/cn';

type Tab = 'manual' | 'csv';

export function DataEntrySection(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<Tab>('manual');

  return (
    <Card>
      <CardHeader>
        <CardTitle>データ入力</CardTitle>
      </CardHeader>

      {/* Tab bar */}
      <div className="mb-4 flex gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] p-1">
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={cn(
            'flex-1 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition-colors',
            activeTab === 'manual' ? 'bg-surface text-foreground shadow-sm' : 'text-ink-muted hover:text-foreground',
          )}
        >
          手動入力
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('csv')}
          className={cn(
            'flex-1 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition-colors',
            activeTab === 'csv' ? 'bg-surface text-foreground shadow-sm' : 'text-ink-muted hover:text-foreground',
          )}
        >
          CSV取込
        </button>
      </div>

      {/* Content */}
      {activeTab === 'manual' && <ManualEntryForm />}
      {activeTab === 'csv' && <CsvImport />}
    </Card>
  );
}
