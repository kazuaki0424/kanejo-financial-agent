/**
 * 補助金・給付金マスターデータ
 *
 * 将来的にはDBに移行し、scripts/seed-subsidies.ts で更新する設計。
 * 現在はハードコードされたサンプルデータ。
 */

export interface Subsidy {
  id: string;
  name: string;
  category: SubsidyCategory;
  provider: string;
  summary: string;
  amount: string;
  conditions: SubsidyCondition[];
  applicationDeadline: string | null;
  url: string;
  tags: string[];
}

export interface SubsidyCondition {
  type: 'age' | 'income' | 'family' | 'prefecture' | 'occupation' | 'custom';
  label: string;
  check: (profile: MatchProfile) => boolean;
}

export interface MatchProfile {
  age: number;
  annualIncome: number;
  prefecture: string;
  maritalStatus: string;
  dependents: number;
  occupation: string;
  hasChildren: boolean;
}

export const SUBSIDY_CATEGORIES = [
  'child',
  'housing',
  'medical',
  'education',
  'employment',
  'tax',
  'other',
] as const;

export type SubsidyCategory = (typeof SUBSIDY_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<SubsidyCategory, string> = {
  child: '子育て・出産',
  housing: '住宅',
  medical: '医療・健康',
  education: '教育・学び',
  employment: '就労・起業',
  tax: '税制優遇',
  other: 'その他',
};

export const CATEGORY_ICONS: Record<SubsidyCategory, string> = {
  child: '👶',
  housing: '🏠',
  medical: '🏥',
  education: '📚',
  employment: '💼',
  tax: '💰',
  other: '📋',
};

// ============================================================
// サンプル補助金データ
// ============================================================

export const SUBSIDIES: Subsidy[] = [
  // --- 子育て ---
  {
    id: 'child-allowance',
    name: '児童手当',
    category: 'child',
    provider: '国（厚生労働省）',
    summary: '中学校卒業まで（15歳の誕生日後の最初の3月31日まで）の児童を養育している方に支給',
    amount: '月額10,000〜15,000円/人',
    conditions: [
      { type: 'family', label: '子どもがいる', check: (p) => p.hasChildren || p.dependents > 0 },
    ],
    applicationDeadline: null,
    url: '',
    tags: ['全国', '毎月支給'],
  },
  {
    id: 'child-medical',
    name: '子ども医療費助成',
    category: 'child',
    provider: '各自治体',
    summary: '子どもの医療費の自己負担分を助成。対象年齢・所得制限は自治体により異なる',
    amount: '医療費の自己負担分（全額〜一部）',
    conditions: [
      { type: 'family', label: '子どもがいる', check: (p) => p.hasChildren || p.dependents > 0 },
    ],
    applicationDeadline: null,
    url: '',
    tags: ['自治体', '医療費'],
  },
  {
    id: 'maternity-lump',
    name: '出産育児一時金',
    category: 'child',
    provider: '健康保険組合',
    summary: '出産時に健康保険から支給される一時金',
    amount: '500,000円',
    conditions: [
      { type: 'custom', label: '健康保険加入者', check: () => true },
    ],
    applicationDeadline: null,
    url: '',
    tags: ['全国', '出産'],
  },

  // --- 住宅 ---
  {
    id: 'housing-loan-deduction',
    name: '住宅ローン控除',
    category: 'housing',
    provider: '国（国税庁）',
    summary: '住宅ローンの年末残高の0.7%を最大13年間、所得税から控除',
    amount: '最大35万円/年（新築・省エネ）',
    conditions: [
      { type: 'income', label: '合計所得2,000万円以下', check: (p) => p.annualIncome <= 20_000_000 },
    ],
    applicationDeadline: '確定申告期間（2-3月）',
    url: '',
    tags: ['全国', '税額控除', '住宅ローン'],
  },
  {
    id: 'sumai-benefit',
    name: '子育てエコホーム支援事業',
    category: 'housing',
    provider: '国土交通省',
    summary: '省エネ住宅の新築・リフォームに対する補助金',
    amount: '最大100万円',
    conditions: [
      { type: 'custom', label: '住宅の新築・リフォーム', check: () => true },
    ],
    applicationDeadline: '予算上限に達し次第終了',
    url: '',
    tags: ['全国', '省エネ', '新築・リフォーム'],
  },

  // --- 医療 ---
  {
    id: 'high-cost-medical',
    name: '高額療養費制度',
    category: 'medical',
    provider: '健康保険組合',
    summary: '1ヶ月の医療費が自己負担限度額を超えた場合、超過分が払い戻される',
    amount: '自己負担限度額を超えた分',
    conditions: [
      { type: 'custom', label: '健康保険加入者', check: () => true },
    ],
    applicationDeadline: '診療月の翌月1日から2年以内',
    url: '',
    tags: ['全国', '医療費'],
  },
  {
    id: 'medical-deduction',
    name: '医療費控除',
    category: 'medical',
    provider: '国（国税庁）',
    summary: '年間医療費が10万円を超えた場合、確定申告で所得控除が受けられる',
    amount: '所得控除（税率に応じた還付）',
    conditions: [
      { type: 'custom', label: '年間医療費10万円超', check: () => true },
    ],
    applicationDeadline: '確定申告期間（2-3月）',
    url: '',
    tags: ['全国', '確定申告'],
  },

  // --- 教育 ---
  {
    id: 'tuition-free',
    name: '高等教育の修学支援新制度',
    category: 'education',
    provider: '文部科学省',
    summary: '住民税非課税世帯等の学生の授業料減免と給付型奨学金',
    amount: '最大年間約91万円',
    conditions: [
      { type: 'income', label: '世帯年収約380万円以下', check: (p) => p.annualIncome <= 3_800_000 },
      { type: 'family', label: '子どもがいる', check: (p) => p.hasChildren || p.dependents > 0 },
    ],
    applicationDeadline: '各大学の定める期限',
    url: '',
    tags: ['全国', '大学・専門学校'],
  },

  // --- 就労 ---
  {
    id: 'employment-adjustment',
    name: '教育訓練給付金',
    category: 'employment',
    provider: 'ハローワーク',
    summary: '厚労大臣指定の教育訓練を受講・修了した場合に受講費用の一部が支給',
    amount: '受講費用の20〜70%（上限あり）',
    conditions: [
      { type: 'occupation', label: '雇用保険加入者', check: (p) => p.occupation === 'employee' || p.occupation === 'part_time' },
    ],
    applicationDeadline: '受講開始日の1ヶ月前まで',
    url: '',
    tags: ['全国', 'スキルアップ'],
  },
  {
    id: 'startup-subsidy',
    name: '小規模事業者持続化補助金',
    category: 'employment',
    provider: '中小企業庁',
    summary: '小規模事業者の販路開拓等の経費の一部を補助',
    amount: '最大50〜200万円',
    conditions: [
      { type: 'occupation', label: '自営業・経営者', check: (p) => p.occupation === 'self_employed' },
    ],
    applicationDeadline: '公募期間中',
    url: '',
    tags: ['自営業', '補助金'],
  },

  // --- 税制優遇 ---
  {
    id: 'furusato-tax',
    name: 'ふるさと納税',
    category: 'tax',
    provider: '総務省',
    summary: '自治体への寄付により、自己負担2,000円で返礼品を受け取りながら税控除',
    amount: '年収・家族構成により上限額が決まる',
    conditions: [
      { type: 'income', label: '住民税を納めている', check: (p) => p.annualIncome > 0 },
    ],
    applicationDeadline: '12月31日（年末）',
    url: '',
    tags: ['全国', '節税'],
  },
  {
    id: 'ideco-deduction',
    name: 'iDeCo（個人型確定拠出年金）',
    category: 'tax',
    provider: '国民年金基金連合会',
    summary: '掛金が全額所得控除。運用益非課税。受取時にも控除あり',
    amount: '月額5,000〜68,000円（職業による）',
    conditions: [
      { type: 'age', label: '65歳未満', check: (p) => p.age < 65 },
    ],
    applicationDeadline: null,
    url: '',
    tags: ['全国', '年金', '節税'],
  },
];

// ============================================================
// マッチング関数
// ============================================================

export interface MatchResult {
  subsidy: Subsidy;
  matchScore: number;
  matchedConditions: string[];
  unmatchedConditions: string[];
}

export function matchSubsidies(profile: MatchProfile): MatchResult[] {
  const results: MatchResult[] = [];

  for (const subsidy of SUBSIDIES) {
    const matched: string[] = [];
    const unmatched: string[] = [];

    for (const condition of subsidy.conditions) {
      if (condition.check(profile)) {
        matched.push(condition.label);
      } else {
        unmatched.push(condition.label);
      }
    }

    // Include if at least one condition matches or no conditions
    const totalConditions = subsidy.conditions.length;
    const matchScore = totalConditions > 0 ? matched.length / totalConditions : 1;

    if (matchScore > 0) {
      results.push({
        subsidy,
        matchScore,
        matchedConditions: matched,
        unmatchedConditions: unmatched,
      });
    }
  }

  // Sort: full matches first, then by score descending
  return results.sort((a, b) => b.matchScore - a.matchScore);
}
