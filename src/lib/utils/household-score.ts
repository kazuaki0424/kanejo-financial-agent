/**
 * 家計スコアエンジン
 *
 * 5つの指標から0-100の総合スコアを算出する。
 * 各指標のウェイトはユーザーのティアに応じて調整される。
 *
 * 指標:
 *   1. 貯蓄率 — 月収に対する貯蓄の割合
 *   2. 負債比率 — 年収に対する総負債の割合
 *   3. 資産分散度 — 資産カテゴリの多様性
 *   4. 緊急資金バッファ — 月支出に対する流動資産の月数
 *   5. 保険カバー率 — 年収に対する保険解約返戻金+保険料支出の比率
 */

export interface ScoreInput {
  monthlyIncome: number;
  monthlyExpenses: number;
  annualIncome: number;
  totalLiabilities: number;
  liquidAssets: number;
  assetCategoryCount: number;
  insuranceCoverage: number; // 保険関連の金額（保険解約返戻金 + 年間保険料支出）
  tier: 'basic' | 'middle' | 'high_end';
}

export interface ScoreBreakdown {
  savingsScore: number;
  savingsMax: number;
  debtScore: number;
  debtMax: number;
  diversityScore: number;
  diversityMax: number;
  bufferScore: number;
  bufferMax: number;
  insuranceScore: number;
  insuranceMax: number;
}

export interface ScoreResult {
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  breakdown: ScoreBreakdown;
}

/**
 * ティア別ウェイト配分（合計100）
 *
 * basic:    家計管理重視 → 貯蓄率・緊急資金を重視
 * middle:   バランス型 → 全指標均等に近い
 * high_end: 資産運用重視 → 分散度・負債管理を重視
 */
const TIER_WEIGHTS = {
  basic: {
    savings: 30,
    debt: 20,
    diversity: 10,
    buffer: 30,
    insurance: 10,
  },
  middle: {
    savings: 25,
    debt: 25,
    diversity: 15,
    buffer: 20,
    insurance: 15,
  },
  high_end: {
    savings: 20,
    debt: 25,
    diversity: 25,
    buffer: 15,
    insurance: 15,
  },
} as const;

/**
 * 貯蓄率スコア (0.0 〜 1.0)
 *
 * - 20%以上で満点（basic）
 * - 25%以上で満点（middle）
 * - 30%以上で満点（high_end）
 */
function calcSavingsRatio(input: ScoreInput): number {
  if (input.monthlyIncome <= 0) return 0;

  const savingsRate = (input.monthlyIncome - input.monthlyExpenses) / input.monthlyIncome;
  if (savingsRate <= 0) return 0;

  const targetRate = input.tier === 'high_end' ? 0.30 : input.tier === 'middle' ? 0.25 : 0.20;
  return Math.min(1, savingsRate / targetRate);
}

/**
 * 負債比率スコア (0.0 〜 1.0)
 *
 * 年収に対する総負債の割合が低いほど高得点。
 * - 0倍 = 満点
 * - basic: 3倍以上で0点
 * - middle: 5倍以上で0点（住宅ローン考慮）
 * - high_end: 8倍以上で0点（不動産投資考慮）
 */
function calcDebtRatio(input: ScoreInput): number {
  if (input.totalLiabilities <= 0) return 1;
  if (input.annualIncome <= 0) return 0;

  const ratio = input.totalLiabilities / input.annualIncome;
  const maxRatio = input.tier === 'high_end' ? 8 : input.tier === 'middle' ? 5 : 3;

  return Math.max(0, 1 - ratio / maxRatio);
}

/**
 * 資産分散度スコア (0.0 〜 1.0)
 *
 * 異なる資産カテゴリ数に応じてスコア付け。
 * - basic: 2カテゴリで満点（預金+投信など）
 * - middle: 3カテゴリで満点
 * - high_end: 4カテゴリで満点（より高い分散を要求）
 */
function calcDiversityRatio(input: ScoreInput): number {
  const target = input.tier === 'high_end' ? 4 : input.tier === 'middle' ? 3 : 2;
  return Math.min(1, input.assetCategoryCount / target);
}

/**
 * 緊急資金バッファスコア (0.0 〜 1.0)
 *
 * 月支出の何ヶ月分の流動資産があるか。
 * - basic: 3ヶ月で満点
 * - middle: 6ヶ月で満点
 * - high_end: 12ヶ月で満点
 */
function calcBufferRatio(input: ScoreInput): number {
  if (input.monthlyExpenses <= 0) return 0;

  const months = input.liquidAssets / input.monthlyExpenses;
  const targetMonths = input.tier === 'high_end' ? 12 : input.tier === 'middle' ? 6 : 3;

  return Math.min(1, months / targetMonths);
}

/**
 * 保険カバー率スコア (0.0 〜 1.0)
 *
 * 年収に対する保険関連金額の割合。
 * 適切な保険カバーを持っているかを評価。
 * - 年収の5-15%程度が理想的（中間値10%で満点）
 * - 0%や過剰（30%超）は減点
 */
function calcInsuranceRatio(input: ScoreInput): number {
  if (input.annualIncome <= 0) return 0;

  const coverage = input.insuranceCoverage / input.annualIncome;

  // 0% → 0点、10% → 満点、30%以上 → 低下
  if (coverage <= 0) return 0;
  if (coverage <= 0.10) return coverage / 0.10;
  if (coverage <= 0.20) return 1;
  // 過剰な保険は減点
  return Math.max(0, 1 - (coverage - 0.20) / 0.20);
}

/**
 * グレード判定
 */
function determineGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (score >= 90) return 'S';
  if (score >= 75) return 'A';
  if (score >= 55) return 'B';
  if (score >= 35) return 'C';
  return 'D';
}

/**
 * 家計スコアを算出する
 */
export function calculateHouseholdScore(input: ScoreInput): ScoreResult {
  const weights = TIER_WEIGHTS[input.tier];

  const savingsRatio = calcSavingsRatio(input);
  const debtRatio = calcDebtRatio(input);
  const diversityRatio = calcDiversityRatio(input);
  const bufferRatio = calcBufferRatio(input);
  const insuranceRatio = calcInsuranceRatio(input);

  const savingsScore = Math.round(savingsRatio * weights.savings);
  const debtScore = Math.round(debtRatio * weights.debt);
  const diversityScore = Math.round(diversityRatio * weights.diversity);
  const bufferScore = Math.round(bufferRatio * weights.buffer);
  const insuranceScore = Math.round(insuranceRatio * weights.insurance);

  const score = Math.min(100, savingsScore + debtScore + diversityScore + bufferScore + insuranceScore);

  return {
    score,
    grade: determineGrade(score),
    breakdown: {
      savingsScore,
      savingsMax: weights.savings,
      debtScore,
      debtMax: weights.debt,
      diversityScore,
      diversityMax: weights.diversity,
      bufferScore,
      bufferMax: weights.buffer,
      insuranceScore,
      insuranceMax: weights.insurance,
    },
  };
}
