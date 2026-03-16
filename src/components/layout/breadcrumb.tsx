'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ROUTE_LABELS: Record<string, string> = {
  '': 'ダッシュボード',
  'diagnosis': '家計診断',
  'simulation': 'シミュレーション',
  'tax': '節税・補助金',
  'furusato': 'ふるさと納税',
  'ideco-nisa': 'iDeCo・NISA',
  'subsidies': '補助金',
  'compare': 'サービス比較',
  'agent': 'エージェント',
  'learn': '学習',
  'alerts': 'アラート',
  'settings': '設定',
  'profile': 'プロフィール',
  'connections': '外部連携',
};

export function Breadcrumb(): React.ReactElement {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return (
      <nav aria-label="パンくずリスト">
        <span className="text-sm font-medium text-foreground">ダッシュボード</span>
      </nav>
    );
  }

  return (
    <nav aria-label="パンくずリスト">
      <ol className="flex items-center gap-1.5 text-sm">
        <li>
          <Link href="/" className="text-ink-muted hover:text-foreground transition-colors">
            ホーム
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const isLast = index === segments.length - 1;
          const label = ROUTE_LABELS[segment] ?? segment;

          return (
            <li key={href} className="flex items-center gap-1.5">
              <span className="text-ink-subtle" aria-hidden="true">/</span>
              {isLast ? (
                <span className="font-medium text-foreground">{label}</span>
              ) : (
                <Link href={href} className="text-ink-muted hover:text-foreground transition-colors">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
