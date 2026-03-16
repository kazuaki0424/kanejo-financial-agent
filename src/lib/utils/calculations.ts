/**
 * 日本の税額計算エンジン
 *
 * 所得税・住民税・ふるさと納税上限を算出する。
 * 給与所得者を前提としたシンプルな計算モデル。
 */

import {
  INCOME_TAX_BRACKETS,
  RECONSTRUCTION_TAX_RATE,
  RESIDENT_TAX_RATE,
  RESIDENT_TAX_FLAT,
  SALARY_DEDUCTION_BRACKETS,
  BASIC_DEDUCTION_INCOME_TAX,
  BASIC_DEDUCTION_RESIDENT_TAX,
  SPOUSE_DEDUCTION,
  DEPENDENT_DEDUCTION_GENERAL,
  DEPENDENT_DEDUCTION_SPECIAL,
  SOCIAL_INSURANCE_RATE,
  LIFE_INSURANCE_DEDUCTION_MAX,
  MEDICAL_DEDUCTION_THRESHOLD,
  MEDICAL_DEDUCTION_MAX,
  HOUSING_LOAN_DEDUCTION_RATE,
  HOUSING_LOAN_DEDUCTION_MAX,
  FURUSATO_SELF_PAY,
} from '@/lib/constants/tax-rates';

// ============================================================
// Types
// ============================================================

export interface Deduction {
  type: DeductionType;
  amount: number;
}

export const DEDUCTION_TYPES = [
  'spouse',
  'dependent_general',
  'dependent_special',
  'social_insurance',
  'life_insurance',
  'medical',
  'housing_loan',
  'ideco',
  'furusato',
] as const;

export type DeductionType = (typeof DEDUCTION_TYPES)[number];

export interface TaxInput {
  /** 年間給与収入（税込） */
  annualSalary: number;
  /** 控除リスト */
  deductions: Deduction[];
}

export interface TaxResult {
  /** 給与所得（給与収入 - 給与所得控除） */
  salaryIncome: number;
  /** 給与所得控除額 */
  salaryDeduction: number;
  /** 所得控除合計 */
  totalDeductions: number;
  /** 課税所得（所得税用） */
  taxableIncomeForIncomeTax: number;
  /** 課税所得（住民税用） */
  taxableIncomeForResidentTax: number;
  /** 所得税額（復興特別所得税含む） */
  incomeTax: number;
  /** 住民税額（所得割+均等割） */
  residentTax: number;
  /** 税額控除（住宅ローン控除等） */
  taxCredits: number;
  /** 最終所得税額 */
  finalIncomeTax: number;
  /** 最終住民税額 */
  finalResidentTax: number;
  /** 合計税額 */
  totalTax: number;
  /** 手取り（概算） */
  takeHome: number;
  /** 実効税率 */
  effectiveRate: number;
  /** 控除内訳 */
  deductionBreakdown: Record<string, number>;
}

// ============================================================
// Calculation functions
// ============================================================

/**
 * 給与所得控除を計算する
 */
export function calculateSalaryDeduction(annualSalary: number): number {
  if (annualSalary <= 0) return 0;

  for (const bracket of SALARY_DEDUCTION_BRACKETS) {
    if (annualSalary >= bracket.min && annualSalary <= bracket.max) {
      const deduction = Math.floor(annualSalary * bracket.rate) + bracket.base;
      return Math.max(550_000, deduction);
    }
  }

  return 1_950_000; // Maximum
}

/**
 * 所得控除合計を計算する
 */
export function calculateDeductions(
  salaryIncome: number,
  deductions: Deduction[],
): { total: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};
  let total = 0;

  // 基礎控除（所得税）
  breakdown['basic'] = BASIC_DEDUCTION_INCOME_TAX;
  total += BASIC_DEDUCTION_INCOME_TAX;

  for (const d of deductions) {
    let amount = 0;

    switch (d.type) {
      case 'spouse':
        amount = SPOUSE_DEDUCTION;
        break;
      case 'dependent_general':
        amount = DEPENDENT_DEDUCTION_GENERAL * d.amount;
        break;
      case 'dependent_special':
        amount = DEPENDENT_DEDUCTION_SPECIAL * d.amount;
        break;
      case 'social_insurance':
        // 社会保険料は全額控除
        amount = d.amount > 0 ? d.amount : Math.floor(salaryIncome * SOCIAL_INSURANCE_RATE);
        break;
      case 'life_insurance':
        amount = Math.min(d.amount, LIFE_INSURANCE_DEDUCTION_MAX);
        break;
      case 'medical':
        amount = Math.min(
          Math.max(0, d.amount - MEDICAL_DEDUCTION_THRESHOLD),
          MEDICAL_DEDUCTION_MAX,
        );
        break;
      case 'ideco':
        // iDeCo掛金は全額控除（小規模企業共済等掛金控除）
        amount = d.amount;
        break;
      case 'furusato':
        // ふるさと納税は寄付金控除（自己負担2000円を除く）
        amount = Math.max(0, d.amount - FURUSATO_SELF_PAY);
        break;
      case 'housing_loan':
        // 住宅ローン控除は税額控除なので、ここでは0
        amount = 0;
        break;
    }

    if (amount > 0) {
      breakdown[d.type] = (breakdown[d.type] ?? 0) + amount;
      total += amount;
    }
  }

  return { total, breakdown };
}

/**
 * 所得税を計算する（速算表方式）
 */
export function calculateIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;

  for (const bracket of INCOME_TAX_BRACKETS) {
    if (taxableIncome >= bracket.min && taxableIncome <= bracket.max) {
      const baseTax = Math.floor(taxableIncome * bracket.rate - bracket.deduction);
      // 復興特別所得税を加算
      return Math.floor(baseTax * (1 + RECONSTRUCTION_TAX_RATE));
    }
  }

  // Fallback: highest bracket
  const last = INCOME_TAX_BRACKETS[INCOME_TAX_BRACKETS.length - 1];
  const baseTax = Math.floor(taxableIncome * last.rate - last.deduction);
  return Math.floor(baseTax * (1 + RECONSTRUCTION_TAX_RATE));
}

/**
 * 住民税を計算する
 */
export function calculateResidentTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return RESIDENT_TAX_FLAT;

  const incomeComponent = Math.floor(taxableIncome * RESIDENT_TAX_RATE);
  return incomeComponent + RESIDENT_TAX_FLAT;
}

/**
 * 税額控除（住宅ローン控除）を計算する
 */
function calculateTaxCredits(deductions: Deduction[]): number {
  let credits = 0;

  for (const d of deductions) {
    if (d.type === 'housing_loan' && d.amount > 0) {
      credits += Math.min(
        Math.floor(d.amount * HOUSING_LOAN_DEDUCTION_RATE),
        HOUSING_LOAN_DEDUCTION_MAX,
      );
    }
  }

  return credits;
}

/**
 * 税額を一括計算する
 */
export function calculateTax(input: TaxInput): TaxResult {
  const { annualSalary, deductions } = input;

  // 1. 給与所得控除
  const salaryDeduction = calculateSalaryDeduction(annualSalary);
  const salaryIncome = Math.max(0, annualSalary - salaryDeduction);

  // 2. 所得控除
  const { total: totalDeductions, breakdown } = calculateDeductions(salaryIncome, deductions);

  // 3. 課税所得
  const taxableIncomeForIncomeTax = Math.max(0, salaryIncome - totalDeductions);
  const taxableIncomeForResidentTax = Math.max(
    0,
    salaryIncome - totalDeductions + BASIC_DEDUCTION_INCOME_TAX - BASIC_DEDUCTION_RESIDENT_TAX,
  );

  // 4. 所得税
  const incomeTax = calculateIncomeTax(taxableIncomeForIncomeTax);

  // 5. 住民税
  const residentTax = calculateResidentTax(taxableIncomeForResidentTax);

  // 6. 税額控除
  const taxCredits = calculateTaxCredits(deductions);

  // 7. 最終税額
  const finalIncomeTax = Math.max(0, incomeTax - taxCredits);
  const finalResidentTax = residentTax;
  const totalTax = finalIncomeTax + finalResidentTax;

  // 8. 社会保険料
  const socialInsurance = deductions.find((d) => d.type === 'social_insurance');
  const socialInsuranceAmount = socialInsurance?.amount ?? Math.floor(annualSalary * SOCIAL_INSURANCE_RATE);

  // 9. 手取り
  const takeHome = annualSalary - totalTax - socialInsuranceAmount;

  // 10. 実効税率
  const effectiveRate = annualSalary > 0 ? totalTax / annualSalary : 0;

  return {
    salaryIncome,
    salaryDeduction,
    totalDeductions,
    taxableIncomeForIncomeTax,
    taxableIncomeForResidentTax,
    incomeTax,
    residentTax,
    taxCredits,
    finalIncomeTax,
    finalResidentTax,
    totalTax,
    takeHome,
    effectiveRate,
    deductionBreakdown: breakdown,
  };
}

// ============================================================
// ふるさと納税上限額
// ============================================================

/**
 * ふるさと納税の控除上限額を概算する
 *
 * 計算式（簡易版）:
 *   住民税所得割額 × 20% ÷ (100% - 住民税率 - 所得税率×復興税率) + 2,000円
 */
export function calculateFurusatoLimit(annualSalary: number, deductions: Deduction[]): number {
  if (annualSalary <= 0) return 0;

  const salaryDeduction = calculateSalaryDeduction(annualSalary);
  const salaryIncome = Math.max(0, annualSalary - salaryDeduction);

  // 控除を除くふるさと納税控除を計算
  const nonFurusatoDeductions = deductions.filter((d) => d.type !== 'furusato');
  const { total: totalDeductions } = calculateDeductions(salaryIncome, nonFurusatoDeductions);

  const taxableIncome = Math.max(0, salaryIncome - totalDeductions + BASIC_DEDUCTION_INCOME_TAX - BASIC_DEDUCTION_RESIDENT_TAX);

  // 住民税所得割
  const residentTaxIncome = Math.floor(taxableIncome * RESIDENT_TAX_RATE);

  // 該当する所得税率を取得
  const taxableForIncome = Math.max(0, salaryIncome - totalDeductions);
  let incomeTaxRate = 0.05;
  for (const bracket of INCOME_TAX_BRACKETS) {
    if (taxableForIncome >= bracket.min && taxableForIncome <= bracket.max) {
      incomeTaxRate = bracket.rate;
      break;
    }
  }

  // ふるさと納税上限 = 住民税所得割 × 20% ÷ (1 - 住民税率 - 所得税率×(1+復興税率)) + 2000
  const denominator = 1 - RESIDENT_TAX_RATE - incomeTaxRate * (1 + RECONSTRUCTION_TAX_RATE);
  if (denominator <= 0) return FURUSATO_SELF_PAY;

  const limit = Math.floor(residentTaxIncome * 0.20 / denominator) + FURUSATO_SELF_PAY;

  return Math.max(FURUSATO_SELF_PAY, limit);
}
