/**
 * 金融サービスマスターデータ
 *
 * 将来的にはDBから取得する。現在はハードコードされたサンプルデータ。
 */

export const SERVICE_CATEGORIES = [
  'credit_card',
  'insurance',
  'loan',
  'utility',
  'telecom',
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  credit_card: 'クレジットカード',
  insurance: '保険',
  loan: 'ローン',
  utility: '電力・ガス',
  telecom: '通信',
};

export const CATEGORY_ICONS: Record<ServiceCategory, string> = {
  credit_card: '💳',
  insurance: '🛡️',
  loan: '🏦',
  utility: '⚡',
  telecom: '📱',
};

export interface ServiceData {
  id: string;
  category: ServiceCategory;
  name: string;
  provider: string;
  description: string;
  monthlyFee: number;
  annualFee: number;
  features: Array<{ label: string; value: string }>;
  highlights: string[];
  rating: number;
  bestFor: string;
}

// ============================================================
// クレジットカード
// ============================================================

export const CREDIT_CARDS: ServiceData[] = [
  {
    id: 'cc-rakuten',
    category: 'credit_card',
    name: '楽天カード',
    provider: '楽天カード',
    description: '年会費無料で楽天市場でポイント3倍。基本還元率1%。',
    monthlyFee: 0,
    annualFee: 0,
    features: [
      { label: '年会費', value: '無料' },
      { label: '基本還元率', value: '1.0%' },
      { label: '楽天市場', value: '3.0%' },
      { label: 'ブランド', value: 'VISA/Master/JCB/AMEX' },
    ],
    highlights: ['年会費無料', '楽天市場3倍', 'ポイント使いやすい'],
    rating: 4.2,
    bestFor: '楽天ユーザー',
  },
  {
    id: 'cc-jcbw',
    category: 'credit_card',
    name: 'JCB CARD W',
    provider: 'JCB',
    description: '39歳以下限定。年会費無料で基本還元率1%。Amazon・セブンで2%。',
    monthlyFee: 0,
    annualFee: 0,
    features: [
      { label: '年会費', value: '無料' },
      { label: '基本還元率', value: '1.0%' },
      { label: 'Amazon', value: '2.0%' },
      { label: '対象年齢', value: '18〜39歳' },
    ],
    highlights: ['年会費無料', 'Amazon高還元', '若者向け'],
    rating: 4.3,
    bestFor: 'Amazonユーザー（39歳以下）',
  },
  {
    id: 'cc-amex-gold',
    category: 'credit_card',
    name: 'アメックスゴールド',
    provider: 'American Express',
    description: '高ステータス。空港ラウンジ無料。マイル還元率高い。',
    monthlyFee: 0,
    annualFee: 31_900,
    features: [
      { label: '年会費', value: '¥31,900' },
      { label: '基本還元率', value: '0.5%' },
      { label: 'マイル換算', value: '1.0%' },
      { label: '空港ラウンジ', value: '無料' },
    ],
    highlights: ['空港ラウンジ', '海外旅行保険', 'ステータス'],
    rating: 4.0,
    bestFor: '出張・旅行が多い方',
  },
  {
    id: 'cc-three-mitsui',
    category: 'credit_card',
    name: '三井住友カード(NL)',
    provider: '三井住友カード',
    description: '年会費無料。対象コンビニ・飲食店で最大7%還元。',
    monthlyFee: 0,
    annualFee: 0,
    features: [
      { label: '年会費', value: '無料' },
      { label: '基本還元率', value: '0.5%' },
      { label: 'コンビニ等', value: '最大7.0%' },
      { label: 'SBI証券', value: '積立0.5%' },
    ],
    highlights: ['年会費無料', 'コンビニ高還元', 'SBI証券連携'],
    rating: 4.1,
    bestFor: 'コンビニ利用が多い方',
  },
];

// ============================================================
// 保険
// ============================================================

export const INSURANCES: ServiceData[] = [
  {
    id: 'ins-lifenet-term',
    category: 'insurance',
    name: 'かぞくへの保険',
    provider: 'ライフネット生命',
    description: 'ネット完結型の定期死亡保険。割安な保険料が特徴。',
    monthlyFee: 1_068,
    annualFee: 12_816,
    features: [
      { label: '保険金額', value: '1,000万円' },
      { label: '保険期間', value: '10年' },
      { label: '月額（30歳男性）', value: '¥1,068' },
      { label: '申込方法', value: 'ネット完結' },
    ],
    highlights: ['割安', 'ネット完結', 'シンプル'],
    rating: 4.0,
    bestFor: '必要最低限の保障が欲しい方',
  },
  {
    id: 'ins-orix-medical',
    category: 'insurance',
    name: '新キュア',
    provider: 'オリックス生命',
    description: '三大疾病一時金特約付き医療保険。入院日額5,000円〜。',
    monthlyFee: 1_531,
    annualFee: 18_372,
    features: [
      { label: '入院日額', value: '¥5,000' },
      { label: '手術給付', value: '10万円' },
      { label: '月額（30歳男性）', value: '¥1,531' },
      { label: '先進医療', value: '通算2,000万円' },
    ],
    highlights: ['三大疾病対応', '先進医療', '保険料控除対象'],
    rating: 4.2,
    bestFor: '医療保険を検討中の方',
  },
];

// ============================================================
// 通信
// ============================================================

export const TELECOMS: ServiceData[] = [
  {
    id: 'tel-ahamo',
    category: 'telecom',
    name: 'ahamo',
    provider: 'NTTドコモ',
    description: 'ドコモ回線の格安プラン。20GB+5分かけ放題。',
    monthlyFee: 2_970,
    annualFee: 35_640,
    features: [
      { label: '月額', value: '¥2,970' },
      { label: 'データ', value: '20GB' },
      { label: '通話', value: '5分無料' },
      { label: '回線', value: 'ドコモ' },
    ],
    highlights: ['シンプル', 'ドコモ品質', '海外対応'],
    rating: 4.1,
    bestFor: '20GBで足りる方',
  },
  {
    id: 'tel-linemo',
    category: 'telecom',
    name: 'LINEMO ミニプラン',
    provider: 'ソフトバンク',
    description: '3GB 990円の最安クラス。LINEギガフリー。',
    monthlyFee: 990,
    annualFee: 11_880,
    features: [
      { label: '月額', value: '¥990' },
      { label: 'データ', value: '3GB' },
      { label: 'LINE', value: 'ギガフリー' },
      { label: '回線', value: 'ソフトバンク' },
    ],
    highlights: ['最安クラス', 'LINEギガフリー', 'eSIM対応'],
    rating: 4.0,
    bestFor: 'データ使用量が少ない方',
  },
  {
    id: 'tel-rakuten',
    category: 'telecom',
    name: '楽天モバイル',
    provider: '楽天モバイル',
    description: '使った分だけ。3GBまで1,078円、無制限3,278円。',
    monthlyFee: 1_078,
    annualFee: 12_936,
    features: [
      { label: '月額', value: '¥1,078〜3,278' },
      { label: 'データ', value: '段階制〜無制限' },
      { label: '通話', value: 'Rakuten Linkで無料' },
      { label: '回線', value: '楽天' },
    ],
    highlights: ['段階制', '通話無料', '楽天ポイント'],
    rating: 3.8,
    bestFor: '月によって使用量が変わる方',
  },
];

// ============================================================
// 電力
// ============================================================

export const UTILITIES: ServiceData[] = [
  {
    id: 'elec-tokyo-ep',
    category: 'utility',
    name: '東京電力EP スタンダードS',
    provider: '東京電力EP',
    description: '従来の従量電灯Bに相当。安定の大手。',
    monthlyFee: 8_500,
    annualFee: 102_000,
    features: [
      { label: '月額目安', value: '¥8,500（40A/300kWh）' },
      { label: '基本料金', value: '¥1,180.96（40A）' },
      { label: 'セット割', value: 'なし' },
    ],
    highlights: ['大手安心', '安定供給'],
    rating: 3.5,
    bestFor: '変更が面倒な方',
  },
  {
    id: 'elec-looopdenki',
    category: 'utility',
    name: 'Looopでんき',
    provider: 'Looop',
    description: '基本料金0円。使った分だけ支払う従量制。',
    monthlyFee: 7_800,
    annualFee: 93_600,
    features: [
      { label: '月額目安', value: '¥7,800（300kWh）' },
      { label: '基本料金', value: '¥0' },
      { label: '解約金', value: 'なし' },
    ],
    highlights: ['基本料金0円', '解約金なし', 'アプリ管理'],
    rating: 3.9,
    bestFor: '一人暮らし・使用量少なめの方',
  },
];

// ============================================================
// All services
// ============================================================

export const ALL_SERVICES: ServiceData[] = [
  ...CREDIT_CARDS,
  ...INSURANCES,
  ...TELECOMS,
  ...UTILITIES,
];

export function getServicesByCategory(category: ServiceCategory): ServiceData[] {
  return ALL_SERVICES.filter((s) => s.category === category);
}
