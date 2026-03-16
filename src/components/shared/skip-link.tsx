/**
 * スキップリンク — キーボードユーザーがナビゲーションをスキップしてメインコンテンツにジャンプするためのリンク
 */
export function SkipLink(): React.ReactElement {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[var(--radius-md)] focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:outline-none"
    >
      メインコンテンツにスキップ
    </a>
  );
}
