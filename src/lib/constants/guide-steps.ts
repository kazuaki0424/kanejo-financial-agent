export interface GuideStep {
  step: number;
  href: string;
  icon: string;
  title: string;
  description: string;
}

export const GUIDE_STEPS: readonly GuideStep[] = [
  {
    step: 1,
    href: '/diagnosis',
    icon: 'diagnosis',
    title: '家計を診断する',
    description: '貯蓄率・負債比率・資産分散など5指標で現状を把握します',
  },
  {
    step: 2,
    href: '/simulation',
    icon: 'simulation',
    title: '将来をシミュレーション',
    description: '結婚・住宅・退職などライフイベントを踏まえ30年後の収支を予測します',
  },
  {
    step: 3,
    href: '/tax',
    icon: 'tax',
    title: '節税・補助金を確認する',
    description: 'ふるさと納税・iDeCo・NISAなど使える制度をまとめて確認します',
  },
  {
    step: 4,
    href: '/compare',
    icon: 'compare',
    title: '金融サービスを比較する',
    description: 'クレカ・保険・ローンを支出パターンに合わせて最適化します',
  },
  {
    step: 5,
    href: '/agent',
    icon: 'agent',
    title: 'エージェントに相談する',
    description: 'AIが家計の改善提案を行い、必要な手続きをサポートします',
  },
  {
    step: 6,
    href: '/alerts',
    icon: 'alerts',
    title: 'アラートを設定する',
    description: '節税機会・支出異常・金利変動を自動で通知します',
  },
] as const;
