'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/hooks/use-sidebar';
import { NAV_ITEMS } from '@/lib/constants/navigation';
import { NavIcon } from './nav-icon';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 72;

export function Sidebar(): React.ReactElement {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const pathname = usePathname();

  return (
    <>
      {/* モバイルオーバーレイ */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* サイドバー */}
      <motion.aside
        animate={{
          width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          'fixed top-0 left-0 z-50 flex h-full flex-col border-r border-border bg-surface',
          'max-lg:hidden',
        )}
      >
        {/* ロゴ */}
        <div className="flex h-16 items-center justify-between px-4">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="font-display text-xl text-foreground"
              >
                Kanejo
              </motion.span>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)]',
              'text-ink-muted hover:bg-[var(--color-surface-hover)] hover:text-foreground transition-colors',
            )}
            aria-label={collapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
          >
            <NavIcon name={collapsed ? 'chevron-right' : 'chevron-left'} className="h-4 w-4" />
          </button>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="メインナビゲーション">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex h-10 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm transition-colors',
                      isActive
                        ? 'bg-primary-light text-primary font-medium'
                        : 'text-ink-muted hover:bg-[var(--color-surface-hover)] hover:text-foreground',
                      collapsed && 'justify-center px-0',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
                    <AnimatePresence mode="wait">
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.15 }}
                          className="truncate"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* フッター: 設定 + ティア */}
        <div className="border-t border-border px-3 py-3">
          <Link
            href="/settings"
            className={cn(
              'flex h-10 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm text-ink-muted transition-colors',
              'hover:bg-[var(--color-surface-hover)] hover:text-foreground',
              collapsed && 'justify-center px-0',
            )}
          >
            <NavIcon name="settings" className="h-5 w-5 shrink-0" />
            {!collapsed && <span>設定</span>}
          </Link>
          {!collapsed && (
            <div className="mt-2 px-3">
              <Badge variant="primary">ベーシック</Badge>
            </div>
          )}
        </div>
      </motion.aside>

      {/* モバイルサイドバー（ドロワー） */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -SIDEBAR_WIDTH }}
            animate={{ x: 0 }}
            exit={{ x: -SIDEBAR_WIDTH }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="fixed top-0 left-0 z-50 flex h-full w-60 flex-col border-r border-border bg-surface lg:hidden"
          >
            <div className="flex h-16 items-center justify-between px-4">
              <span className="font-display text-xl text-foreground">Kanejo</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-ink-muted hover:text-foreground"
                aria-label="メニューを閉じる"
              >
                <NavIcon name="close" className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="モバイルナビゲーション">
              <ul className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex h-10 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm transition-colors',
                          isActive
                            ? 'bg-primary-light text-primary font-medium'
                            : 'text-ink-muted hover:bg-[var(--color-surface-hover)] hover:text-foreground',
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="border-t border-border px-3 py-3">
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex h-10 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm text-ink-muted hover:text-foreground"
              >
                <NavIcon name="settings" className="h-5 w-5 shrink-0" />
                <span>設定</span>
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
