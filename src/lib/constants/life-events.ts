import type { LifeEvent, LifeEventType } from '@/lib/utils/cashflow-engine';

// ============================================================
// Single event templates
// ============================================================
export interface CostBreakdownItem {
  label: string;
  amount: number;
}

export interface LifeEventTemplate {
  type: LifeEventType;
  label: string;
  icon: string;
  color: string;
  defaultOneTimeCost: number;
  defaultAnnualCostChange: number;
  defaultAnnualIncomeChange: number;
  description: string;
  costBreakdown: CostBreakdownItem[];
}

export const LIFE_EVENT_TEMPLATES: LifeEventTemplate[] = [
  {
    type: 'marriage',
    label: '結婚',
    icon: 'ring',
    color: 'var(--chart-3)',
    defaultOneTimeCost: 3_500_000,
    defaultAnnualCostChange: 200_000,
    defaultAnnualIncomeChange: 0,
    description: '挙式・披露宴・新居準備等',
    costBreakdown: [
      { label: '挙式・披露宴', amount: 2_000_000 },
      { label: '新居準備・引越し', amount: 800_000 },
      { label: '新婚旅行', amount: 500_000 },
      { label: '結納・指輪等', amount: 200_000 },
    ],
  },
  {
    type: 'childbirth',
    label: '出産・育児',
    icon: 'baby',
    color: 'var(--chart-2)',
    defaultOneTimeCost: 500_000,
    defaultAnnualCostChange: 800_000,
    defaultAnnualIncomeChange: 0,
    description: '出産費用・育児用品・教育費増',
    costBreakdown: [
      { label: '出産費用（自己負担分）', amount: 200_000 },
      { label: 'ベビー用品・家具', amount: 300_000 },
    ],
  },
  {
    type: 'housing_purchase',
    label: '住宅購入',
    icon: 'home',
    color: 'var(--chart-1)',
    defaultOneTimeCost: 8_000_000,
    defaultAnnualCostChange: 0,
    defaultAnnualIncomeChange: 0,
    description: '頭金・諸費用（ローンは別途設定）',
    costBreakdown: [
      { label: '頭金（物件価格の20%想定）', amount: 6_000_000 },
      { label: '仲介手数料', amount: 1_000_000 },
      { label: '登記費用・税金', amount: 500_000 },
      { label: '引越し・家具', amount: 500_000 },
    ],
  },
  {
    type: 'housing_rent',
    label: '賃貸引越し',
    icon: 'home',
    color: 'var(--chart-1)',
    defaultOneTimeCost: 600_000,
    defaultAnnualCostChange: 0,
    defaultAnnualIncomeChange: 0,
    description: '敷金・礼金・引越し費用',
    costBreakdown: [
      { label: '敷金・礼金', amount: 300_000 },
      { label: '引越し費用', amount: 150_000 },
      { label: '家具・家電', amount: 150_000 },
    ],
  },
  {
    type: 'car_purchase',
    label: '自動車購入',
    icon: 'car',
    color: 'var(--chart-5)',
    defaultOneTimeCost: 3_000_000,
    defaultAnnualCostChange: 300_000,
    defaultAnnualIncomeChange: 0,
    description: '車両代・維持費（保険・駐車場・車検）',
    costBreakdown: [
      { label: '車両本体', amount: 2_500_000 },
      { label: '税金・保険・登録', amount: 300_000 },
      { label: 'オプション・用品', amount: 200_000 },
    ],
  },
  {
    type: 'education',
    label: '子の進学（私立）',
    icon: 'school',
    color: 'var(--chart-4)',
    defaultOneTimeCost: 1_000_000,
    defaultAnnualCostChange: 1_200_000,
    defaultAnnualIncomeChange: 0,
    description: '入学金・年間学費（私立想定）',
    costBreakdown: [
      { label: '入学金', amount: 300_000 },
      { label: '制服・教材', amount: 200_000 },
      { label: '受験費用', amount: 500_000 },
    ],
  },
  {
    type: 'retirement',
    label: '退職',
    icon: 'sunset',
    color: 'var(--chart-6)',
    defaultOneTimeCost: 0,
    defaultAnnualCostChange: -1_000_000,
    defaultAnnualIncomeChange: 0,
    description: '退職後の生活費減少',
    costBreakdown: [],
  },
  {
    type: 'custom',
    label: 'カスタム',
    icon: 'plus',
    color: 'var(--color-ink-subtle)',
    defaultOneTimeCost: 0,
    defaultAnnualCostChange: 0,
    defaultAnnualIncomeChange: 0,
    description: '自由に設定',
    costBreakdown: [],
  },
];

// ============================================================
// Pre-built scenario templates
// ============================================================
export interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  tags: string[];
  buildEvents: (currentAge: number) => LifeEvent[];
}

export const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  {
    id: 'typical-family',
    name: '標準的な家庭',
    description: '結婚→出産→マイホーム購入→子の進学→退職の王道プラン',
    tags: ['ファミリー', '持ち家'],
    buildEvents: (age) => [
      { age: Math.max(age + 2, 30), type: 'marriage', name: '結婚', oneTimeCost: 3_500_000, annualCostChange: 200_000, annualIncomeChange: 0 },
      { age: Math.max(age + 4, 32), type: 'childbirth', name: '第一子', oneTimeCost: 500_000, annualCostChange: 800_000, annualIncomeChange: 0 },
      { age: Math.max(age + 7, 35), type: 'housing_purchase', name: 'マンション購入', oneTimeCost: 8_000_000, annualCostChange: 0, annualIncomeChange: 0 },
      { age: Math.max(age + 10, 38), type: 'car_purchase', name: '自動車購入', oneTimeCost: 3_000_000, annualCostChange: 300_000, annualIncomeChange: 0 },
      { age: Math.max(age + 19, 47), type: 'education', name: '子の大学進学', oneTimeCost: 1_000_000, annualCostChange: 1_500_000, annualIncomeChange: 0 },
    ],
  },
  {
    id: 'dinks',
    name: 'DINKS（共働き夫婦）',
    description: '結婚のみ。子なし。賃貸継続で資産運用重視',
    tags: ['共働き', '賃貸'],
    buildEvents: (age) => [
      { age: Math.max(age + 2, 30), type: 'marriage', name: '結婚', oneTimeCost: 2_500_000, annualCostChange: 100_000, annualIncomeChange: 3_000_000 },
      { age: Math.max(age + 5, 33), type: 'housing_rent', name: '都心マンション引越し', oneTimeCost: 800_000, annualCostChange: 360_000, annualIncomeChange: 0 },
    ],
  },
  {
    id: 'housing-comparison',
    name: '持ち家 vs 賃貸',
    description: '住宅購入シナリオ。比較モードで賃貸と比べてみましょう',
    tags: ['住宅', '比較向け'],
    buildEvents: (age) => [
      { age: Math.max(age + 3, 33), type: 'housing_purchase', name: 'マンション購入', oneTimeCost: 8_000_000, annualCostChange: -600_000, annualIncomeChange: 0 },
    ],
  },
  {
    id: 'rent-continue',
    name: '賃貸継続',
    description: '住宅を買わず賃貸を続けるプラン。比較用',
    tags: ['賃貸', '比較向け'],
    buildEvents: () => [],
  },
  {
    id: 'early-retirement',
    name: 'FIRE（早期退職）',
    description: '50歳でセミリタイア。支出を抑えて投資収入で生活',
    tags: ['FIRE', '投資'],
    buildEvents: (age) => [
      { age: 50, type: 'retirement', name: 'セミリタイア', oneTimeCost: 0, annualCostChange: -2_000_000, annualIncomeChange: 0 },
      { age: 50, type: 'custom', name: '投資収入開始', oneTimeCost: 0, annualCostChange: 0, annualIncomeChange: 1_200_000 },
    ],
  },
  {
    id: 'two-children',
    name: '子ども2人プラン',
    description: '2人の子どもを育てる場合の教育費シミュレーション',
    tags: ['ファミリー', '教育'],
    buildEvents: (age) => [
      { age: Math.max(age + 2, 30), type: 'childbirth', name: '第一子', oneTimeCost: 500_000, annualCostChange: 800_000, annualIncomeChange: 0 },
      { age: Math.max(age + 5, 33), type: 'childbirth', name: '第二子', oneTimeCost: 400_000, annualCostChange: 600_000, annualIncomeChange: 0 },
      { age: Math.max(age + 18, 46), type: 'education', name: '第一子 大学', oneTimeCost: 1_000_000, annualCostChange: 1_500_000, annualIncomeChange: 0 },
      { age: Math.max(age + 21, 49), type: 'education', name: '第二子 大学', oneTimeCost: 1_000_000, annualCostChange: 1_500_000, annualIncomeChange: 0 },
    ],
  },
];
