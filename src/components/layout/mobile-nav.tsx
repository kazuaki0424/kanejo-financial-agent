'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BOTTOM_NAV_ITEMS } from '@/lib/constants/navigation';
import { NavIcon } from './nav-icon';
import { cn } from '@/lib/utils/cn';

export function MobileNav(): React.ReactElement {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="モバイルナビゲーション"
    >
      <ul className="flex items-center justify-around">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] transition-colors',
                  isActive ? 'text-primary' : 'text-ink-muted',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <NavIcon name={item.icon} className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
