/**
 * iDeCo / NISA 制度データ（2024年〜）
 */

// ============================================================
// iDeCo
// ============================================================

export interface IDecoLimitRule {
  occupation: string;
  label: string;
  monthlyLimit: number;
  annualLimit: number;
  notes: string;
}

export const IDECO_LIMITS: IDecoLimitRule[] = [
  {
    occupation: 'employee',
    label: '会社員（企業年金なし）',
    monthlyLimit: 23_000,
    annualLimit: 276_000,
    notes: '企業型DCなし・DB等なしの場合',
  },
  {
    occupation: 'employee_dc',
    label: '会社員（企業型DCあり）',
    monthlyLimit: 20_000,
    annualLimit: 240_000,
    notes: '企業型DC加入者',
  },
  {
    occupation: 'employee_db',
    label: '会社員（DB等あり）',
    monthlyLimit: 12_000,
    annualLimit: 144_000,
    notes: 'DB・厚生年金基金加入者',
  },
  {
    occupation: 'self_employed',
    label: '自営業・フリーランス',
    monthlyLimit: 68_000,
    annualLimit: 816_000,
    notes: '国民年金基金等と合算',
  },
  {
    occupation: 'part_time',
    label: 'パート・専業主婦(夫)',
    monthlyLimit: 23_000,
    annualLimit: 276_000,
    notes: '第3号被保険者',
  },
  {
    occupation: 'civil_servant',
    label: '公務員',
    monthlyLimit: 12_000,
    annualLimit: 144_000,
    notes: '',
  },
];

// ============================================================
// NISA（新NISA 2024年〜）
// ============================================================

export const NISA_TSUMITATE_ANNUAL = 1_200_000; // つみたて投資枠: 年120万円
export const NISA_GROWTH_ANNUAL = 2_400_000;     // 成長投資枠: 年240万円
export const NISA_TOTAL_ANNUAL = 3_600_000;      // 年間投資枠合計: 360万円
export const NISA_LIFETIME_LIMIT = 18_000_000;   // 生涯非課税限度額: 1,800万円
export const NISA_GROWTH_LIFETIME_LIMIT = 12_000_000; // うち成長投資枠: 1,200万円

// ============================================================
// 想定利回り
// ============================================================

export const RETURN_RATES = {
  conservative: { label: '安定型', rate: 0.02, description: '国内債券中心' },
  balanced: { label: 'バランス型', rate: 0.04, description: '株式50%+債券50%' },
  growth: { label: '成長型', rate: 0.06, description: '全世界株式中心' },
  aggressive: { label: '積極型', rate: 0.08, description: '先進国株式+新興国' },
} as const;

export type ReturnRateKey = keyof typeof RETURN_RATES;

// ============================================================
// 計算関数
// ============================================================

export interface InvestmentSimResult {
  /** 積立総額 */
  totalContribution: number;
  /** 運用益 */
  totalReturn: number;
  /** 最終評価額 */
  finalValue: number;
  /** 節税効果（iDeCoのみ） */
  taxSaving: number;
  /** 年次推移 */
  yearly: Array<{
    year: number;
    contribution: number;
    cumulativeContribution: number;
    value: number;
    returnAmount: number;
  }>;
}

/**
 * 積立投資のシミュレーション（複利計算）
 */
export function simulateInvestment(
  monthlyAmount: number,
  years: number,
  annualReturnRate: number,
): InvestmentSimResult {
  const yearly: InvestmentSimResult['yearly'] = [];
  let cumulativeContribution = 0;
  let currentValue = 0;

  for (let y = 1; y <= years; y++) {
    const annualContribution = monthlyAmount * 12;
    cumulativeContribution += annualContribution;

    // 毎月積立の複利計算（簡易版: 年初一括投資として近似）
    currentValue = (currentValue + annualContribution) * (1 + annualReturnRate);
    const returnAmount = Math.round(currentValue - cumulativeContribution);

    yearly.push({
      year: y,
      contribution: annualContribution,
      cumulativeContribution,
      value: Math.round(currentValue),
      returnAmount,
    });
  }

  return {
    totalContribution: cumulativeContribution,
    totalReturn: Math.round(currentValue - cumulativeContribution),
    finalValue: Math.round(currentValue),
    taxSaving: 0,
    yearly,
  };
}

/**
 * iDeCoの節税効果を計算
 * iDeCo掛金は全額所得控除 → 所得税+住民税の軽減
 */
export function calculateIdecoTaxSaving(
  annualContribution: number,
  incomeTaxRate: number,
): number {
  // 所得税軽減 + 住民税軽減(10%)
  const incomeTaxSaving = Math.floor(annualContribution * incomeTaxRate);
  const residentTaxSaving = Math.floor(annualContribution * 0.10);
  return incomeTaxSaving + residentTaxSaving;
}

/**
 * NISA運用益の非課税メリットを計算
 */
export function calculateNisaTaxSaving(totalReturn: number): number {
  // 通常の譲渡所得税率: 20.315%
  return Math.floor(totalReturn * 0.20315);
}
