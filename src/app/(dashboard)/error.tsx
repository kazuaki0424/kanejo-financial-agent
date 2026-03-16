'use client';

import { ErrorDisplay } from '@/components/shared/error-boundary';

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay
      title="ダッシュボードの読み込みに失敗しました"
      message="データの取得中にエラーが発生しました。もう一度お試しください。"
      retry={reset}
    />
  );
}
