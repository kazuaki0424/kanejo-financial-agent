'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  retry?: () => void;
}

export function ErrorDisplay({
  title = 'エラーが発生しました',
  message = '予期しないエラーが発生しました。もう一度お試しください。',
  retry,
}: ErrorDisplayProps): React.ReactElement {
  return (
    <div className="flex min-h-[300px] items-center justify-center px-4">
      <Card className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-negative-bg">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-negative" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 8V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
        </div>
        <h2 className="text-lg font-medium text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-ink-muted">{message}</p>
        {retry && (
          <Button onClick={retry} variant="secondary" size="sm" className="mt-4">
            再試行
          </Button>
        )}
      </Card>
    </div>
  );
}
