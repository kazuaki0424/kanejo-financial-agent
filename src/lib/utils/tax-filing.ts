/**
 * 確定申告の要否判定エンジン
 *
 * 給与所得者が確定申告を行う必要があるかを判定し、
 * 必要な場合のステップと書類リストを生成する。
 */

// ============================================================
// Types
// ============================================================

export interface FilingProfile {
  annualSalary: number;
  occupation: string;
  hasSideIncome: boolean;
  sideIncomeAmount: number;
  hasMultipleEmployers: boolean;
  hasMedicalExpenses: boolean;
  medicalExpenseAmount: number;
  hasHousingLoan: boolean;
  housingLoanFirstYear: boolean;
  hasFurusato: boolean;
  furusatoCount: number;
  hasStockIncome: boolean;
  hasRentalIncome: boolean;
  leftJobMidYear: boolean;
}

export interface FilingReason {
  id: string;
  title: string;
  description: string;
  required: boolean; // true=必須, false=任意（メリットあり）
}

export interface FilingStep {
  order: number;
  title: string;
  description: string;
  deadline?: string;
}

export interface FilingDocument {
  name: string;
  source: string;
  required: boolean;
  notes?: string;
}

export interface FilingResult {
  required: boolean;
  beneficial: boolean;
  reasons: FilingReason[];
  steps: FilingStep[];
  documents: FilingDocument[];
  filingType: 'not_needed' | 'required' | 'recommended';
}

// ============================================================
// 判定ロジック
// ============================================================

export function assessFilingNeed(profile: FilingProfile): FilingResult {
  const reasons: FilingReason[] = [];
  const documents: FilingDocument[] = [];
  let required = false;
  let beneficial = false;

  // --- 必須ケース ---

  // 1. 年収2,000万円超
  if (profile.annualSalary > 20_000_000) {
    required = true;
    reasons.push({
      id: 'high_income',
      title: '給与収入が2,000万円を超える',
      description: '年間の給与収入が2,000万円を超える場合、年末調整の対象外となるため確定申告が必要です。',
      required: true,
    });
  }

  // 2. 副業収入20万円超
  if (profile.hasSideIncome && profile.sideIncomeAmount > 200_000) {
    required = true;
    reasons.push({
      id: 'side_income',
      title: '副業の所得が20万円を超える',
      description: `副業の所得が${Math.floor(profile.sideIncomeAmount / 10000)}万円あります。給与以外の所得が20万円を超える場合は確定申告が必要です。`,
      required: true,
    });
    documents.push({
      name: '副業の収支内訳書',
      source: '自身で作成',
      required: true,
      notes: '事業所得の場合は青色申告も検討',
    });
  }

  // 3. 2ヶ所以上から給与
  if (profile.hasMultipleEmployers) {
    required = true;
    reasons.push({
      id: 'multiple_employers',
      title: '2ヶ所以上から給与を受けている',
      description: '主たる給与以外の給与と各種所得の合計が20万円を超える場合は確定申告が必要です。',
      required: true,
    });
    documents.push({
      name: '各勤務先の源泉徴収票',
      source: '各勤務先',
      required: true,
    });
  }

  // 4. 株式等の譲渡所得（特定口座・源泉徴収なし）
  if (profile.hasStockIncome) {
    required = true;
    reasons.push({
      id: 'stock_income',
      title: '株式等の譲渡所得がある',
      description: '特定口座（源泉徴収なし）や一般口座での取引がある場合は確定申告が必要です。特定口座（源泉徴収あり）の場合は不要ですが、損益通算のために申告するメリットがあります。',
      required: true,
    });
    documents.push({
      name: '年間取引報告書',
      source: '証券会社',
      required: true,
    });
  }

  // 5. 不動産所得
  if (profile.hasRentalIncome) {
    required = true;
    reasons.push({
      id: 'rental_income',
      title: '不動産所得がある',
      description: '賃貸収入がある場合は確定申告が必要です。',
      required: true,
    });
    documents.push({
      name: '不動産収支内訳書',
      source: '自身で作成',
      required: true,
    });
  }

  // 6. 年の途中で退職
  if (profile.leftJobMidYear) {
    required = true;
    reasons.push({
      id: 'mid_year_resignation',
      title: '年の途中で退職し年末調整を受けていない',
      description: '年末調整を受けていない場合、確定申告で税金の精算が必要です。多くの場合、還付を受けられます。',
      required: true,
    });
  }

  // --- 任意だがメリットがあるケース ---

  // 7. 医療費控除
  if (profile.hasMedicalExpenses && profile.medicalExpenseAmount > 100_000) {
    beneficial = true;
    reasons.push({
      id: 'medical_deduction',
      title: '医療費が10万円を超える',
      description: `年間医療費が${Math.floor(profile.medicalExpenseAmount / 10000)}万円あります。確定申告で医療費控除を受けると税金の還付が見込めます。`,
      required: false,
    });
    documents.push({
      name: '医療費の明細書',
      source: '自身で作成（領収書を元に）',
      required: false,
      notes: 'マイナポータル連携で自動取得も可能',
    });
  }

  // 8. 住宅ローン控除（初年度）
  if (profile.hasHousingLoan && profile.housingLoanFirstYear) {
    beneficial = true;
    reasons.push({
      id: 'housing_loan_first',
      title: '住宅ローン控除の初年度',
      description: '住宅ローン控除を受ける初年度は確定申告が必要です。2年目以降は年末調整で適用できます。',
      required: false,
    });
    documents.push(
      { name: '住宅借入金等特別控除額の計算明細書', source: '税務署', required: false },
      { name: '住宅ローンの年末残高証明書', source: '金融機関', required: false },
      { name: '登記事項証明書', source: '法務局', required: false },
      { name: '売買契約書の写し', source: '自身で保管', required: false },
    );
  }

  // 9. ふるさと納税（6自治体以上）
  if (profile.hasFurusato && profile.furusatoCount > 5) {
    beneficial = true;
    reasons.push({
      id: 'furusato_many',
      title: 'ふるさと納税の寄付先が6自治体以上',
      description: `${profile.furusatoCount}自治体に寄付しています。ワンストップ特例の対象は5自治体までのため、確定申告が必要です。`,
      required: false,
    });
    documents.push({
      name: '寄付金受領証明書',
      source: '各自治体',
      required: false,
      notes: 'マイナポータル連携で一括取得可能',
    });
  }

  // --- 共通書類 ---
  documents.unshift(
    { name: '源泉徴収票', source: '勤務先', required: true },
    { name: 'マイナンバーカード（または通知カード＋本人確認書類）', source: '本人', required: true },
  );

  // 自営業
  if (profile.occupation === 'self_employed') {
    required = true;
    reasons.push({
      id: 'self_employed',
      title: '自営業・フリーランス',
      description: '給与所得以外の事業所得がある場合は確定申告が必要です。青色申告で最大65万円の控除が受けられます。',
      required: true,
    });
    documents.push(
      { name: '青色申告決算書（または収支内訳書）', source: '自身で作成', required: true },
      { name: '帳簿書類', source: '自身で作成', required: true },
    );
  }

  // --- ステップ生成 ---
  const steps = generateSteps(required || beneficial, profile);

  const filingType: FilingResult['filingType'] = required
    ? 'required'
    : beneficial
      ? 'recommended'
      : 'not_needed';

  return {
    required,
    beneficial,
    reasons,
    steps,
    documents: deduplicateDocuments(documents),
    filingType,
  };
}

function generateSteps(needsFiling: boolean, profile: FilingProfile): FilingStep[] {
  if (!needsFiling) {
    return [
      { order: 1, title: '年末調整を確認', description: '勤務先の年末調整で税金の精算は完了しています。源泉徴収票の内容を確認しましょう。' },
    ];
  }

  const steps: FilingStep[] = [
    {
      order: 1,
      title: '必要書類を準備する',
      description: '源泉徴収票、マイナンバーカード、各種証明書を準備します。',
      deadline: '2月中旬まで',
    },
    {
      order: 2,
      title: '確定申告書を作成する',
      description: '国税庁の「確定申告書等作成コーナー」でオンライン作成が便利です。e-Taxなら自宅から提出できます。',
    },
    {
      order: 3,
      title: '確定申告書を提出する',
      description: 'e-Tax（オンライン）、郵送、または税務署窓口で提出します。',
      deadline: '3月15日',
    },
    {
      order: 4,
      title: '納税または還付を受ける',
      description: '追加納税がある場合は3月15日までに納付。還付がある場合は1〜2ヶ月程度で口座に振り込まれます。',
    },
  ];

  if (profile.occupation === 'self_employed') {
    steps.splice(1, 0, {
      order: 2,
      title: '帳簿を整理する',
      description: '1年分の収入・経費を集計し、決算書を作成します。会計ソフトの利用をおすすめします。',
      deadline: '2月上旬まで',
    });
    // Re-number
    steps.forEach((s, i) => { s.order = i + 1; });
  }

  return steps;
}

function deduplicateDocuments(docs: FilingDocument[]): FilingDocument[] {
  const seen = new Set<string>();
  return docs.filter((d) => {
    if (seen.has(d.name)) return false;
    seen.add(d.name);
    return true;
  });
}
