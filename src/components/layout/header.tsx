'use client';

import { useSidebar } from '@/hooks/use-sidebar';
import { NavIcon } from './nav-icon';
import { Breadcrumb } from './breadcrumb';
import { UserMenu } from './user-menu';

interface HeaderProps {
  userEmail?: string;
}

export function Header({ userEmail }: HeaderProps): React.ReactElement {
  const { setMobileOpen } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-surface px-4 sm:px-6">
      {/* モバイルメニューボタン */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-ink-muted hover:bg-[var(--color-surface-hover)] hover:text-foreground transition-colors lg:hidden"
        aria-label="メニューを開く"
      >
        <NavIcon name="menu" className="h-5 w-5" />
      </button>

      {/* パンくず */}
      <div className="flex-1">
        <Breadcrumb />
      </div>

      {/* 右側アクション */}
      <div className="flex items-center gap-2">
        {/* 検索 */}
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-ink-muted hover:bg-[var(--color-surface-hover)] hover:text-foreground transition-colors"
          aria-label="検索"
        >
          <NavIcon name="search" className="h-5 w-5" />
        </button>

        {/* 通知 */}
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-ink-muted hover:bg-[var(--color-surface-hover)] hover:text-foreground transition-colors"
          aria-label="通知"
        >
          <NavIcon name="bell" className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-negative" />
        </button>

        {/* アカウントメニュー */}
        <UserMenu email={userEmail} />
      </div>
    </header>
  );
}
