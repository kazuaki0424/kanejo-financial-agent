'use client';

import { ErrorDisplay } from '@/components/shared/error-boundary';

export default function SettingsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return (
    <ErrorDisplay
      title="設定の読み込みに失敗しました"
      message="データの取得中にエラーが発生しました。もう一度お試しください。"
      retry={reset}
    />
  );
}
