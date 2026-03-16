export const NAV_ITEMS = [
  {
    label: 'ダッシュボード',
    href: '/',
    icon: 'dashboard',
  },
  {
    label: '家計診断',
    href: '/diagnosis',
    icon: 'diagnosis',
  },
  {
    label: 'シミュレーション',
    href: '/simulation',
    icon: 'simulation',
  },
  {
    label: '節税・補助金',
    href: '/tax',
    icon: 'tax',
  },
  {
    label: 'サービス比較',
    href: '/compare',
    icon: 'compare',
  },
  {
    label: 'エージェント',
    href: '/agent',
    icon: 'agent',
  },
  {
    label: '学習',
    href: '/learn',
    icon: 'learn',
  },
  {
    label: 'アラート',
    href: '/alerts',
    icon: 'alerts',
  },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];

export const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 5) as readonly NavItem[];
