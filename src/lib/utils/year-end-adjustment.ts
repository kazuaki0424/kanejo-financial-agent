/**
 * 年末調整ウィザード計算エンジン
 *
 * 会社員が年末調整で提出する各種申告書の記入サポートと、
 * 控除の最適化提案を行う。
 */

import { calculateTax, calculateSalaryDeduction, type Deduction } from '@/lib/utils/calculations';
import { formatCurrency } from '@/lib/utils/format';

// ============================================================
// Types
// ============================================================

export interface YearEndProfile {
  annualSalary: number;
  maritalStatus: string;
  spouseIncome: number;
  dependents: number;
  dependentAges: number[];
  lifeInsurancePremium: number;
  earthquakeInsurancePremium: number;
  housingLoanBalance: number;
  housingLoanFirstYear: boolean;
  idecoAmount: number;
  medicalExpenses: number;
  furusatoAmount: number;
}

export interface YearEndStep {
  id: string;
  title: string;
  formName: string;
  description: string;
  applicable: boolean;
  fields: FormField[];
  tips: string[];
}

export interface FormField {
  label: string;
  value: string;
  hint?: string;
}

export interface YearEndResult {
  steps: YearEndStep[];
  summary: {
    totalDeductions: number;
    estimatedTaxSaving: number;
    estimatedRefund: number;
  };
  optimizations: Optimization[];
}

export interface Optimization {
  title: string;
  description: string;
  potentialSaving: number;
  priority: 'high' | 'medium' | 'low';
}

// ============================================================
// Wizard logic
// ============================================================

export function generateYearEndGuide(profile: YearEndProfile): YearEndResult {
  const steps: YearEndStep[] = [];
  const optimizations: Optimization[] = [];
  const deductions: Deduction[] = [];

  // --- Step 1: 基礎控除申告書 ---
  steps.push({
    id: 'basic',
    title: '基礎控除申告書',
    formName: '給与所得者の基礎控除申告書',
    description: '全員が提出する申告書。給与所得と基礎控除額を記入します。',
    applicable: true,
    fields: [
      { label: '給与収入', value: `¥${formatCurrency(profile.annualSalary)}`, hint: '源泉徴収票の「支払金額」' },
      { label: '給与所得控除', value: `¥${formatCurrency(calculateSalaryDeduction(profile.annualSalary))}` },
      { label: '給与所得', value: `¥${formatCurrency(Math.max(0, profile.annualSalary - calculateSalaryDeduction(profile.annualSalary)))}` },
      { label: '基礎控除額', value: profile.annualSalary <= 24_000_000 ? '¥480,000' : '¥0', hint: '合計所得2,400万円以下で48万円' },
    ],
    tips: [
      '基礎控除は合計所得2,400万円以下で48万円が適用されます',
      '給与所得控除は自動計算されるため、給与収入額のみ記入すればOKです',
    ],
  });

  // --- Step 2: 配偶者控除等申告書 ---
  const hasSpouse = profile.maritalStatus === 'married';
  const spouseDeductionApplicable = hasSpouse && profile.spouseIncome <= 2_015_000;

  if (hasSpouse) {
    const spouseDeductionAmount = profile.spouseIncome <= 480_000 ? 380_000
      : profile.spouseIncome <= 1_000_000 ? 380_000
      : profile.spouseIncome <= 1_330_000 ? 360_000
      : profile.spouseIncome <= 1_710_000 ? 310_000
      : profile.spouseIncome <= 2_015_000 ? 210_000
      : 0;

    steps.push({
      id: 'spouse',
      title: '配偶者控除等申告書',
      formName: '給与所得者の配偶者控除等申告書',
      description: '配偶者の収入に応じた控除を受けるための申告書です。',
      applicable: spouseDeductionApplicable,
      fields: [
        { label: '配偶者の給与収入', value: `¥${formatCurrency(profile.spouseIncome)}` },
        { label: '配偶者控除額', value: `¥${formatCurrency(spouseDeductionAmount)}` },
      ],
      tips: [
        '配偶者の年収が103万円以下なら配偶者控除（38万円）が適用されます',
        '103万円超〜201.5万円以下なら配偶者特別控除が段階的に適用されます',
      ],
    });

    if (spouseDeductionApplicable) {
      deductions.push({ type: 'spouse', amount: 1 });
    }
  }

  // --- Step 3: 扶養控除申告書 ---
  if (profile.dependents > 0) {
    const generalDeps = profile.dependentAges.filter((a) => a >= 16 && (a < 19 || a > 22)).length;
    const specialDeps = profile.dependentAges.filter((a) => a >= 19 && a <= 22).length;
    const under16 = profile.dependentAges.filter((a) => a < 16).length;

    const depFields: FormField[] = [
      { label: '扶養人数', value: `${profile.dependents}人` },
    ];

    if (generalDeps > 0) {
      depFields.push({ label: '一般扶養親族（16歳以上）', value: `${generalDeps}人 × ¥380,000`, hint: '16歳以上19歳未満、23歳以上' });
      deductions.push({ type: 'dependent_general', amount: generalDeps });
    }
    if (specialDeps > 0) {
      depFields.push({ label: '特定扶養親族（19〜22歳）', value: `${specialDeps}人 × ¥630,000`, hint: '大学生年齢は控除額UP' });
      deductions.push({ type: 'dependent_special', amount: specialDeps });
    }
    if (under16 > 0) {
      depFields.push({ label: '16歳未満', value: `${under16}人（扶養控除対象外）`, hint: '児童手当の対象' });
    }

    steps.push({
      id: 'dependents',
      title: '扶養控除申告書',
      formName: '給与所得者の扶養控除等（異動）申告書',
      description: '扶養家族がいる場合に提出。16歳以上の扶養親族が控除対象です。',
      applicable: true,
      fields: depFields,
      tips: [
        '16歳未満の子どもは扶養控除の対象外ですが、児童手当の申告欄に記入します',
        '19〜22歳の特定扶養親族は控除額が63万円にアップします',
        '別居の親も扶養に入れられる場合があります（仕送り等の条件あり）',
      ],
    });

    // Optimization: check if parents could be dependents
    if (profile.dependentAges.every((a) => a < 60)) {
      optimizations.push({
        title: '親の扶養を検討',
        description: '別居の親でも、年間収入が48万円以下で仕送りをしている場合は扶養に入れられます。70歳以上なら老人扶養控除（48万円〜58万円）が適用されます。',
        potentialSaving: 380_000 * 0.20,
        priority: 'medium',
      });
    }
  }

  // --- Step 4: 保険料控除申告書 ---
  const hasInsurance = profile.lifeInsurancePremium > 0 || profile.earthquakeInsurancePremium > 0;

  if (hasInsurance) {
    const lifeInsDeduction = Math.min(profile.lifeInsurancePremium, 40_000);
    const eqInsDeduction = Math.min(profile.earthquakeInsurancePremium, 50_000);

    steps.push({
      id: 'insurance',
      title: '保険料控除申告書',
      formName: '給与所得者の保険料控除申告書',
      description: '生命保険料・地震保険料の控除を受けるための申告書です。',
      applicable: true,
      fields: [
        { label: '生命保険料控除', value: `¥${formatCurrency(lifeInsDeduction)}`, hint: '証明書を添付' },
        { label: '地震保険料控除', value: `¥${formatCurrency(eqInsDeduction)}`, hint: '証明書を添付' },
      ],
      tips: [
        '10月頃に届く保険料控除証明書が必要です',
        '新契約（2012年以降）は一般・介護医療・個人年金の各枠で最大4万円',
        '地震保険は最大5万円の控除が受けられます',
      ],
    });

    deductions.push({ type: 'life_insurance', amount: profile.lifeInsurancePremium });
  }

  // --- Step 5: iDeCo ---
  if (profile.idecoAmount > 0) {
    steps.push({
      id: 'ideco',
      title: '小規模企業共済等掛金控除',
      formName: '保険料控除申告書（小規模企業共済等掛金控除欄）',
      description: 'iDeCoの掛金は全額が所得控除の対象です。',
      applicable: true,
      fields: [
        { label: 'iDeCo掛金（年額）', value: `¥${formatCurrency(profile.idecoAmount)}`, hint: '掛金払込証明書を添付' },
      ],
      tips: [
        '国民年金基金連合会から届く「掛金払込証明書」が必要です',
        '掛金の全額が所得控除となるため、非常に節税効果が高い制度です',
      ],
    });

    deductions.push({ type: 'ideco', amount: profile.idecoAmount });
  }

  // --- Step 6: 住宅ローン控除（2年目以降） ---
  if (profile.housingLoanBalance > 0 && !profile.housingLoanFirstYear) {
    const credit = Math.min(Math.floor(profile.housingLoanBalance * 0.007), 350_000);

    steps.push({
      id: 'housing_loan',
      title: '住宅ローン控除',
      formName: '住宅借入金等特別控除申告書',
      description: '2年目以降は年末調整で住宅ローン控除を適用できます。',
      applicable: true,
      fields: [
        { label: '年末ローン残高', value: `¥${formatCurrency(profile.housingLoanBalance)}` },
        { label: '控除額', value: `¥${formatCurrency(credit)}`, hint: '残高 × 0.7%' },
      ],
      tips: [
        '金融機関から届く「年末残高証明書」と、税務署から届く「控除申告書」が必要です',
        '初年度は確定申告が必要ですが、2年目以降は年末調整で適用できます',
      ],
    });

    deductions.push({ type: 'housing_loan', amount: profile.housingLoanBalance });
  }

  // --- 計算 ---
  const withDeductions = calculateTax({ annualSalary: profile.annualSalary, deductions });
  const withoutDeductions = calculateTax({ annualSalary: profile.annualSalary, deductions: [] });

  const totalDeductions = withDeductions.totalDeductions - 480_000; // Exclude basic deduction (always applied)
  const estimatedTaxSaving = withoutDeductions.totalTax - withDeductions.totalTax;
  const estimatedRefund = Math.max(0, estimatedTaxSaving);

  // --- 最適化提案 ---
  if (profile.idecoAmount === 0) {
    optimizations.push({
      title: 'iDeCoへの加入を検討',
      description: 'iDeCoに加入すると、掛金の全額が所得控除となります。会社員の場合、月額最大23,000円（年額276,000円）まで掛け金を拠出できます。',
      potentialSaving: Math.floor(276_000 * 0.30),
      priority: 'high',
    });
  }

  if (!hasInsurance) {
    optimizations.push({
      title: '生命保険料控除の活用',
      description: '生命保険に加入している場合、保険料控除証明書を提出することで最大12万円の所得控除が受けられます。',
      potentialSaving: Math.floor(120_000 * 0.20),
      priority: 'low',
    });
  }

  if (profile.furusatoAmount === 0 && profile.annualSalary > 3_000_000) {
    optimizations.push({
      title: 'ふるさと納税の活用',
      description: '年末調整とは別に、ふるさと納税を行うことで実質2,000円の自己負担で返礼品を受け取れます。ワンストップ特例なら確定申告不要です。',
      potentialSaving: 0,
      priority: 'medium',
    });
  }

  optimizations.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  return {
    steps: steps.filter((s) => s.applicable),
    summary: { totalDeductions, estimatedTaxSaving: estimatedRefund, estimatedRefund },
    optimizations,
  };
}
