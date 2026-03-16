/**
 * 日本の税率・控除データ（2024年度ベース）
 *
 * 注: 税制は毎年変更される可能性があります。
 *     scripts/update-tax-rates.ts で更新可能な設計としています。
 */

// ============================================================
// 所得税 — 累進課税テーブル
// ============================================================
export interface TaxBracket {
  /** 課税所得の下限（以上） */
  min: number;
  /** 課税所得の上限（以下、Infinityで上限なし） */
  max: number;
  /** 税率（0.05 = 5%） */
  rate: number;
  /** 控除額 */
  deduction: number;
}

/**
 * 所得税の速算表（令和6年分）
 * 国税庁: https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm
 */
export const INCOME_TAX_BRACKETS: TaxBracket[] = [
  { min: 0,         max: 1_950_000,   rate: 0.05,  deduction: 0 },
  { min: 1_950_001, max: 3_300_000,   rate: 0.10,  deduction: 97_500 },
  { min: 3_300_001, max: 6_950_000,   rate: 0.20,  deduction: 427_500 },
  { min: 6_950_001, max: 9_000_000,   rate: 0.23,  deduction: 636_000 },
  { min: 9_000_001, max: 18_000_000,  rate: 0.33,  deduction: 1_536_000 },
  { min: 18_000_001, max: 40_000_000, rate: 0.40,  deduction: 2_796_000 },
  { min: 40_000_001, max: Infinity,   rate: 0.45,  deduction: 4_796_000 },
];

/** 復興特別所得税率 */
export const RECONSTRUCTION_TAX_RATE = 0.021;

// ============================================================
// 住民税
// ============================================================
/** 住民税の所得割税率（一律10%: 都道府県4% + 市区町村6%） */
export const RESIDENT_TAX_RATE = 0.10;

/** 住民税の均等割（標準） */
export const RESIDENT_TAX_FLAT = 5_000;

// ============================================================
// 給与所得控除
// ============================================================
export interface SalaryDeductionBracket {
  min: number;
  max: number;
  rate: number;
  base: number;
}

/**
 * 給与所得控除の速算表（令和6年分）
 */
export const SALARY_DEDUCTION_BRACKETS: SalaryDeductionBracket[] = [
  { min: 0,           max: 1_625_000,   rate: 0,    base: 550_000 },
  { min: 1_625_001,   max: 1_800_000,   rate: 0.40, base: -100_000 },
  { min: 1_800_001,   max: 3_600_000,   rate: 0.30, base: 80_000 },
  { min: 3_600_001,   max: 6_600_000,   rate: 0.20, base: 440_000 },
  { min: 6_600_001,   max: 8_500_000,   rate: 0.10, base: 1_100_000 },
  { min: 8_500_001,   max: Infinity,    rate: 0,    base: 1_950_000 },
];

// ============================================================
// 各種控除額
// ============================================================

/** 基礎控除（所得税: 合計所得2,400万円以下） */
export const BASIC_DEDUCTION_INCOME_TAX = 480_000;

/** 基礎控除（住民税） */
export const BASIC_DEDUCTION_RESIDENT_TAX = 430_000;

/** 配偶者控除（一般） */
export const SPOUSE_DEDUCTION = 380_000;

/** 配偶者特別控除の上限 */
export const SPOUSE_SPECIAL_DEDUCTION_MAX = 380_000;

/** 扶養控除（一般: 16歳以上） */
export const DEPENDENT_DEDUCTION_GENERAL = 380_000;

/** 扶養控除（特定: 19-22歳） */
export const DEPENDENT_DEDUCTION_SPECIAL = 630_000;

/** 社会保険料率の概算（健康保険+厚生年金+雇用保険） */
export const SOCIAL_INSURANCE_RATE = 0.15;

/** 生命保険料控除の上限（新契約） */
export const LIFE_INSURANCE_DEDUCTION_MAX = 40_000;

/** 地震保険料控除の上限 */
export const EARTHQUAKE_INSURANCE_DEDUCTION_MAX = 50_000;

/** 医療費控除の足切り額 */
export const MEDICAL_DEDUCTION_THRESHOLD = 100_000;

/** 医療費控除の上限 */
export const MEDICAL_DEDUCTION_MAX = 2_000_000;

/** 住宅ローン控除率 */
export const HOUSING_LOAN_DEDUCTION_RATE = 0.007;

/** 住宅ローン控除の上限（新築・省エネ住宅） */
export const HOUSING_LOAN_DEDUCTION_MAX = 350_000;

// ============================================================
// ふるさと納税
// ============================================================

/** ふるさと納税の自己負担額 */
export const FURUSATO_SELF_PAY = 2_000;
