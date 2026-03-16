/**
 * 金融リテラシー学習コンテンツ
 */

export interface LearningTopic {
  id: string;
  title: string;
  category: LearningCategory;
  tier: ('basic' | 'middle' | 'high_end')[];
  difficulty: 1 | 2 | 3;
  estimatedMinutes: number;
  summary: string;
  content: string[];
  keyTakeaways: string[];
}

export const LEARNING_CATEGORIES = ['budgeting', 'saving', 'tax', 'investment', 'insurance', 'planning'] as const;
export type LearningCategory = (typeof LEARNING_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<LearningCategory, string> = {
  budgeting: '家計管理',
  saving: '貯蓄',
  tax: '税金',
  investment: '投資',
  insurance: '保険',
  planning: 'ライフプラン',
};

export const CATEGORY_ICONS: Record<LearningCategory, string> = {
  budgeting: '📊',
  saving: '🏦',
  tax: '📝',
  investment: '📈',
  insurance: '🛡️',
  planning: '🗺️',
};

export const LEARNING_TOPICS: LearningTopic[] = [
  // --- 家計管理 ---
  {
    id: 'budget-basics',
    title: '家計管理の基本',
    category: 'budgeting',
    tier: ['basic'],
    difficulty: 1,
    estimatedMinutes: 5,
    summary: '収入と支出を把握し、家計を健全に保つための基礎知識',
    content: [
      '家計管理の第一歩は「見える化」です。毎月の収入と支出を記録し、お金の流れを把握しましょう。',
      '支出は「固定費」と「変動費」に分けて管理すると効果的です。固定費は住居費・通信費・保険料など毎月一定のもの。変動費は食費・交際費など月によって変わるものです。',
      '理想的な家計のバランスは、固定費50%、変動費30%、貯蓄20%と言われています。まずは現状を把握することから始めましょう。',
    ],
    keyTakeaways: ['収入と支出を記録する', '固定費と変動費を分ける', '貯蓄率20%を目指す'],
  },
  {
    id: 'fixed-cost-reduction',
    title: '固定費削減の具体策',
    category: 'budgeting',
    tier: ['basic', 'middle'],
    difficulty: 1,
    estimatedMinutes: 7,
    summary: '毎月の固定費を見直して年間数万円の節約を実現',
    content: [
      '固定費の見直しは、一度実行すれば効果が持続する最も効率的な節約方法です。',
      '通信費: 大手キャリアから格安SIM（ahamo, LINEMO等）に切り替えるだけで月5,000円以上の削減が可能です。',
      '保険料: 必要保障額を見直し、ネット保険への切替を検討しましょう。特に20-30代は定期保険で十分なケースが多いです。',
      'サブスクリプション: 動画配信・音楽・ジムなど、利用頻度の低いサービスを整理しましょう。',
    ],
    keyTakeaways: ['通信費は格安SIMで月5,000円削減', '保険は定期保険を検討', 'サブスクを棚卸しする'],
  },
  // --- 貯蓄 ---
  {
    id: 'emergency-fund',
    title: '緊急資金の作り方',
    category: 'saving',
    tier: ['basic'],
    difficulty: 1,
    estimatedMinutes: 5,
    summary: '生活費3-6ヶ月分の緊急資金を確保する方法',
    content: [
      '緊急資金とは、突然の失業・病気・事故などに備えて、すぐに引き出せる形で保有する資金です。',
      '目安は生活費の3〜6ヶ月分。月30万円の生活費なら90〜180万円が目標です。',
      '貯め方のコツは「先取り貯蓄」。給料日に自動で別口座に振り替える設定をしましょう。',
    ],
    keyTakeaways: ['生活費3-6ヶ月分を確保', '先取り貯蓄を設定', '普通預金で流動性を確保'],
  },
  // --- 税金 ---
  {
    id: 'tax-basics',
    title: '所得税の仕組み',
    category: 'tax',
    tier: ['basic', 'middle'],
    difficulty: 2,
    estimatedMinutes: 8,
    summary: '累進課税の仕組みと所得控除の基本を理解する',
    content: [
      '日本の所得税は累進課税制度を採用しています。所得が高いほど税率が上がる仕組みです。',
      '税率は5%〜45%の7段階。ただし、これは課税所得に対する税率であり、給与収入全体にかかるわけではありません。',
      '「所得控除」を活用することで課税所得を減らし、節税できます。代表的なものは基礎控除（48万円）、配偶者控除、扶養控除、社会保険料控除です。',
      'さらに「税額控除」は税額そのものを減らすもので、住宅ローン控除が代表的です。',
    ],
    keyTakeaways: ['累進課税: 所得が高いほど税率UP', '所得控除で課税所得を減らす', '税額控除は税額を直接減らす'],
  },
  {
    id: 'furusato-guide',
    title: 'ふるさと納税完全ガイド',
    category: 'tax',
    tier: ['basic', 'middle'],
    difficulty: 1,
    estimatedMinutes: 6,
    summary: '自己負担2,000円でお得に返礼品を受け取る方法',
    content: [
      'ふるさと納税は、自治体への寄付を通じて税控除を受けながら返礼品を受け取れる制度です。',
      '自己負担は年間たったの2,000円。控除上限額内であれば、それ以上の負担はありません。',
      '会社員なら「ワンストップ特例制度」を使えば確定申告不要。ただし寄付先は5自治体まで。',
      '上限額は年収・家族構成によって異なります。Kanejoの計算機能で簡単に確認できます。',
    ],
    keyTakeaways: ['自己負担2,000円', 'ワンストップ特例で確定申告不要', '上限額を事前に確認'],
  },
  // --- 投資 ---
  {
    id: 'nisa-basics',
    title: '新NISAの活用法',
    category: 'investment',
    tier: ['basic', 'middle'],
    difficulty: 2,
    estimatedMinutes: 8,
    summary: '非課税で資産運用。つみたて投資枠と成長投資枠の使い分け',
    content: [
      '2024年から始まった新NISAは、運用益が非課税になる制度です。年間360万円、生涯1,800万円まで投資できます。',
      'つみたて投資枠（年120万円）: 長期・分散投資向けの投資信託が対象。初心者はここから始めましょう。',
      '成長投資枠（年240万円）: 個別株やETFも購入可能。投資経験がある方向け。',
      'おすすめは「全世界株式インデックスファンド」への毎月積立。時間分散でリスクを抑えながら長期的なリターンを狙えます。',
    ],
    keyTakeaways: ['運用益が非課税', 'まずはつみたて投資枠から', '全世界株式インデックスが初心者向け'],
  },
  {
    id: 'ideco-guide',
    title: 'iDeCoで節税しながら老後資金',
    category: 'investment',
    tier: ['middle', 'high_end'],
    difficulty: 2,
    estimatedMinutes: 7,
    summary: '掛金全額所得控除。節税しながら年金を増やす方法',
    content: [
      'iDeCo（個人型確定拠出年金）は、掛金が全額所得控除になる強力な節税制度です。',
      '会社員の場合、月額最大23,000円（年276,000円）。所得税率20%なら年間約82,800円の節税効果。',
      '注意点は原則60歳まで引き出せないこと。老後資金として割り切れる金額を設定しましょう。',
      'NISAとiDeCoは併用可能。まずiDeCoで節税メリットを確保し、余裕があればNISAで追加投資がおすすめです。',
    ],
    keyTakeaways: ['掛金全額が所得控除', '60歳まで引き出し不可', 'NISAと併用がベスト'],
  },
  // --- 保険 ---
  {
    id: 'insurance-basics',
    title: '保険の選び方',
    category: 'insurance',
    tier: ['basic'],
    difficulty: 1,
    estimatedMinutes: 6,
    summary: '必要な保険と不要な保険の見分け方',
    content: [
      '保険は「万が一に備えるもの」。貯蓄で対応できるリスクに保険は不要です。',
      '必要性が高い保険: 死亡保険（家族がいる場合）、自動車保険、火災保険。',
      '検討が必要: 医療保険（高額療養費制度があるため）、がん保険。',
      '不要なケースが多い: 学資保険（NISAで代替可）、個人年金保険（iDeCoが有利）。',
    ],
    keyTakeaways: ['貯蓄で対応できるなら保険は不要', '家族がいれば死亡保険は必須', '医療は公的保障を確認'],
  },
  // --- ライフプラン ---
  {
    id: 'retirement-planning',
    title: '老後資金の準備',
    category: 'planning',
    tier: ['middle', 'high_end'],
    difficulty: 2,
    estimatedMinutes: 10,
    summary: '老後2,000万円問題の実態と具体的な準備方法',
    content: [
      '「老後2,000万円問題」は、平均的な高齢夫婦が公的年金だけでは月5万円程度不足するという試算に基づいています。',
      '実際に必要な金額は人それぞれ。生活スタイル、持ち家か賃貸か、年金額によって大きく変わります。',
      '準備方法: ①公的年金を最大化（繰下げ受給で最大42%増）②iDeCo・NISAで資産運用 ③退職金の活用。',
      'Kanejoのシミュレーション機能で、あなたの具体的な数字を確認してみましょう。',
    ],
    keyTakeaways: ['必要額は人による', '年金繰下げで最大42%増', 'iDeCo+NISAで長期運用'],
  },
];

// ============================================================
// 用語集
// ============================================================

export interface GlossaryTerm {
  term: string;
  reading: string;
  definition: string;
  category: LearningCategory;
}

export const GLOSSARY: GlossaryTerm[] = [
  { term: '累進課税', reading: 'るいしんかぜい', definition: '所得が高いほど税率が上がる仕組み。日本の所得税は5%〜45%の7段階。', category: 'tax' },
  { term: '所得控除', reading: 'しょとくこうじょ', definition: '課税所得から差し引ける金額。基礎控除・配偶者控除・扶養控除などがある。', category: 'tax' },
  { term: '税額控除', reading: 'ぜいがくこうじょ', definition: '算出された税額から直接差し引く控除。住宅ローン控除が代表的。', category: 'tax' },
  { term: 'ふるさと納税', reading: 'ふるさとのうぜい', definition: '自治体への寄付で税控除を受けながら返礼品を受け取れる制度。自己負担2,000円。', category: 'tax' },
  { term: 'iDeCo', reading: 'いでこ', definition: '個人型確定拠出年金。掛金全額が所得控除。運用益非課税。原則60歳まで引出不可。', category: 'investment' },
  { term: 'NISA', reading: 'にーさ', definition: '少額投資非課税制度。運用益が非課税。2024年から新NISA（生涯1,800万円枠）。', category: 'investment' },
  { term: 'インデックスファンド', reading: 'いんでっくすふぁんど', definition: '市場全体の値動きに連動する投資信託。低コストで分散投資が可能。', category: 'investment' },
  { term: '複利', reading: 'ふくり', definition: '利息にも利息がつく仕組み。長期運用ほど効果が大きくなる。', category: 'investment' },
  { term: '高額療養費制度', reading: 'こうがくりょうようひせいど', definition: '月の医療費が自己負担限度額を超えた場合、超過分が払い戻される公的制度。', category: 'insurance' },
  { term: '貯蓄率', reading: 'ちょちくりつ', definition: '収入に対する貯蓄の割合。20%以上が理想的とされる。', category: 'saving' },
  { term: '先取り貯蓄', reading: 'さきどりちょちく', definition: '給料日に自動で貯蓄分を別口座に移す方法。確実に貯蓄できる。', category: 'saving' },
  { term: '固定費', reading: 'こていひ', definition: '毎月ほぼ一定額がかかる支出。住居費・通信費・保険料など。', category: 'budgeting' },
];

// ============================================================
// 今日のTips
// ============================================================

export const DAILY_TIPS: string[] = [
  '格安SIMに切り替えるだけで、年間6万円以上の節約になることも。',
  'ふるさと納税は12月31日が期限。早めに手続きしましょう。',
  'iDeCoの掛金は全額所得控除。節税しながら老後資金を準備できます。',
  '保険の見直しは年に1回。ライフステージが変われば必要な保障も変わります。',
  '貯蓄の目安は収入の20%。まずは10%から始めてみましょう。',
  'クレジットカードのポイント還元率1%の差は、年間支出200万円で2万円の差に。',
  '複利の効果: 月3万円を年5%で30年運用すると約2,500万円に。元本は1,080万円。',
  '住居費は収入の30%以下が目安。超えている場合は見直しを検討しましょう。',
  'NISAは非課税で運用できる強力な制度。まずは月1万円から始めてみましょう。',
  '確定申告で医療費控除を申請すると、10万円を超えた分の税金が戻ってきます。',
  '電力会社の切り替えで年間1〜2万円の節約が可能。解約金なしの会社も多いです。',
  '家計簿をつけ始めると、無意識の浪費に気づくことができます。',
];

export function getDailyTip(): string {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}

export function getTopicsForTier(tier: string): LearningTopic[] {
  return LEARNING_TOPICS.filter((t) => t.tier.includes(tier as 'basic' | 'middle' | 'high_end'));
}
