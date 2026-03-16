import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: '設定 — Kanejo',
};

const SETTINGS_ITEMS = [
  {
    href: '/settings/profile',
    label: 'プロフィール',
    description: '基本情報・収入・目標の確認と編集',
    icon: 'user',
  },
  {
    href: '/settings/connections',
    label: '外部サービス連携',
    description: '銀行口座・クレジットカードの接続管理',
    icon: 'link',
  },
] as const;

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl text-foreground">設定</h1>

      <div className="space-y-3">
        {SETTINGS_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="block">
            <Card className="transition-colors hover:bg-[var(--color-surface-hover)]">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-alt)]">
                  <SettingsIcon name={item.icon} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-ink-muted">{item.description}</p>
                </div>
                <ChevronRight />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SettingsIcon({ name }: { name: string }): React.ReactElement {
  if (name === 'user') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 1 0-16 0" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function ChevronRight(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-auto text-ink-subtle" aria-hidden="true">
      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
