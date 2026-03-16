import { describe, it, expect } from 'vitest';
import {
  calculateSalaryDeduction,
  calculateIncomeTax,
  calculateResidentTax,
  calculateTax,
  calculateFurusatoLimit,
  type Deduction,
} from '@/lib/utils/calculations';
import { calculateTaxSavings } from '@/lib/utils/tax-savings';
import { assessFilingNeed } from '@/lib/utils/tax-filing';
import { generateYearEndGuide } from '@/lib/utils/year-end-adjustment';

// ============================================================
// 所得税 速算表照合（±1の丸め誤差を許容）
// ============================================================
describe('Income tax brackets accuracy (速算表照合)', () => {
  const cases = [
    { taxable: 500_000,    rate: 0.05, deduction: 0 },
    { taxable: 1_950_000,  rate: 0.05, deduction: 0 },
    { taxable: 2_000_000,  rate: 0.10, deduction: 97_500 },
    { taxable: 3_300_000,  rate: 0.10, deduction: 97_500 },
    { taxable: 5_000_000,  rate: 0.20, deduction: 427_500 },
    { taxable: 6_950_000,  rate: 0.20, deduction: 427_500 },
    { taxable: 8_000_000,  rate: 0.23, deduction: 636_000 },
    { taxable: 9_000_000,  rate: 0.23, deduction: 636_000 },
    { taxable: 15_000_000, rate: 0.33, deduction: 1_536_000 },
    { taxable: 18_000_000, rate: 0.33, deduction: 1_536_000 },
    { taxable: 30_000_000, rate: 0.40, deduction: 2_796_000 },
    { taxable: 40_000_000, rate: 0.40, deduction: 2_796_000 },
    { taxable: 50_000_000, rate: 0.45, deduction: 4_796_000 },
  ];

  for (const { taxable, rate, deduction } of cases) {
    it(`taxable ¥${taxable.toLocaleString()} at ${rate * 100}%`, () => {
      const expected = Math.floor((taxable * rate - deduction) * 1.021);
      const actual = calculateIncomeTax(taxable);
      expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
    });
  }
});

// ============================================================
// 給与所得控除 照合
// ============================================================
describe('Salary deduction accuracy (給与所得控除)', () => {
  const cases = [
    { salary: 1_000_000,  expected: 550_000 },
    { salary: 1_625_000,  expected: 550_000 },
    { salary: 1_800_000,  expected: 620_000 },
    { salary: 3_600_000,  expected: 1_160_000 },
    { salary: 6_600_000,  expected: 1_760_000 },
    { salary: 8_500_000,  expected: 1_950_000 },
    { salary: 10_000_000, expected: 1_950_000 },
  ];

  for (const { salary, expected } of cases) {
    it(`salary ¥${salary.toLocaleString()} → ¥${expected.toLocaleString()}`, () => {
      expect(calculateSalaryDeduction(salary)).toBe(expected);
    });
  }
});

// ============================================================
// 住民税 照合
// ============================================================
describe('Resident tax accuracy', () => {
  it('10% income + 5000 flat', () => {
    for (const taxable of [1_000_000, 3_000_000, 5_000_000, 10_000_000]) {
      expect(calculateResidentTax(taxable)).toBe(Math.floor(taxable * 0.10) + 5_000);
    }
  });
});

// ============================================================
// 手取りの妥当性（社会保険料15%概算含む）
// ============================================================
describe('Take-home pay reasonableness', () => {
  function getTakeHome(salary: number): number {
    return calculateTax({ annualSalary: salary, deductions: [] }).takeHome;
  }

  // Our model includes 15% social insurance, which is slightly aggressive.
  // Adjust ranges accordingly.
  const ranges = [
    { salary: 3_000_000,  minRate: 0.70, maxRate: 0.85 },
    { salary: 5_000_000,  minRate: 0.68, maxRate: 0.82 },
    { salary: 8_000_000,  minRate: 0.65, maxRate: 0.80 },
    { salary: 12_000_000, minRate: 0.60, maxRate: 0.78 },
    { salary: 20_000_000, minRate: 0.48, maxRate: 0.65 },
  ];

  for (const { salary, minRate, maxRate } of ranges) {
    it(`salary ¥${(salary / 10000).toFixed(0)}万 → take-home ratio ${(minRate * 100).toFixed(0)}-${(maxRate * 100).toFixed(0)}%`, () => {
      const takeHome = getTakeHome(salary);
      const ratio = takeHome / salary;
      expect(ratio).toBeGreaterThan(minRate);
      expect(ratio).toBeLessThan(maxRate);
    });
  }

  it('take-home increases with salary', () => {
    const salaries = [3_000_000, 5_000_000, 8_000_000, 12_000_000, 20_000_000];
    const takeHomes = salaries.map(getTakeHome);
    for (let i = 1; i < takeHomes.length; i++) {
      expect(takeHomes[i]).toBeGreaterThan(takeHomes[i - 1]);
    }
  });

  it('effective rate increases with salary', () => {
    const salaries = [3_000_000, 5_000_000, 8_000_000, 12_000_000, 20_000_000];
    const rates = salaries.map((s) => calculateTax({ annualSalary: s, deductions: [] }).effectiveRate);
    for (let i = 1; i < rates.length; i++) {
      expect(rates[i]).toBeGreaterThanOrEqual(rates[i - 1]);
    }
  });
});

// ============================================================
// ふるさと納税上限の妥当性
// ============================================================
describe('Furusato limit reasonableness', () => {
  it('increases with salary', () => {
    const salaries = [3_000_000, 5_000_000, 7_000_000, 10_000_000];
    const limits = salaries.map((s) => calculateFurusatoLimit(s, []));
    for (let i = 1; i < limits.length; i++) {
      expect(limits[i]).toBeGreaterThan(limits[i - 1]);
    }
  });

  it('married with dependents < single', () => {
    const single = calculateFurusatoLimit(8_000_000, []);
    const married = calculateFurusatoLimit(8_000_000, [
      { type: 'spouse', amount: 1 },
      { type: 'dependent_general', amount: 2 },
    ]);
    expect(married).toBeLessThan(single);
  });

  it('iDeCo reduces limit', () => {
    const without = calculateFurusatoLimit(8_000_000, []);
    const withIdeco = calculateFurusatoLimit(8_000_000, [{ type: 'ideco', amount: 276_000 }]);
    expect(withIdeco).toBeLessThan(without);
  });

  it('limit is always >= 2000 for positive salary', () => {
    expect(calculateFurusatoLimit(1_000_000, [])).toBeGreaterThanOrEqual(2_000);
  });
});

// ============================================================
// エッジケース
// ============================================================
describe('Tax calculation edge cases', () => {
  it('zero salary', () => {
    const r = calculateTax({ annualSalary: 0, deductions: [] });
    expect(r.incomeTax).toBe(0);
    expect(r.residentTax).toBe(5_000);
  });

  it('very low salary has zero income tax', () => {
    const r = calculateTax({ annualSalary: 1_000_000, deductions: [] });
    expect(r.taxableIncomeForIncomeTax).toBe(0);
    expect(r.incomeTax).toBe(0);
  });

  it('housing loan credit floor at zero', () => {
    const r = calculateTax({
      annualSalary: 3_000_000,
      deductions: [{ type: 'housing_loan', amount: 50_000_000 }],
    });
    expect(r.finalIncomeTax).toBeGreaterThanOrEqual(0);
  });

  it('all deductions combined produce valid result', () => {
    const r = calculateTax({
      annualSalary: 10_000_000,
      deductions: [
        { type: 'spouse', amount: 1 },
        { type: 'dependent_general', amount: 2 },
        { type: 'dependent_special', amount: 1 },
        { type: 'ideco', amount: 276_000 },
        { type: 'life_insurance', amount: 80_000 },
        { type: 'medical', amount: 300_000 },
        { type: 'furusato', amount: 150_000 },
        { type: 'housing_loan', amount: 30_000_000 },
      ],
    });
    expect(r.totalTax).toBeGreaterThan(0);
    expect(r.effectiveRate).toBeLessThan(0.15);
  });
});

// ============================================================
// モジュール間の整合性
// ============================================================
describe('Cross-module consistency', () => {
  it('tax savings produces valid items', () => {
    const s = calculateTaxSavings({
      annualSalary: 8_000_000,
      occupation: 'employee',
      maritalStatus: 'married',
      dependents: 1,
      age: 40,
      currentDeductions: [],
    });
    expect(s.items.length).toBeGreaterThan(0);
    expect(s.totalPotentialSaving).toBeGreaterThan(0);
    expect(s.utilizationRate).toBeGreaterThanOrEqual(0);
    expect(s.utilizationRate).toBeLessThanOrEqual(1);
  });

  it('filing assessment and year-end wizard consistent for simple employee', () => {
    const filing = assessFilingNeed({
      annualSalary: 6_000_000, occupation: 'employee',
      hasSideIncome: false, sideIncomeAmount: 0,
      hasMultipleEmployers: false, hasMedicalExpenses: false,
      medicalExpenseAmount: 0, hasHousingLoan: false,
      housingLoanFirstYear: false, hasFurusato: false,
      furusatoCount: 0, hasStockIncome: false,
      hasRentalIncome: false, leftJobMidYear: false,
    });

    const yearEnd = generateYearEndGuide({
      annualSalary: 6_000_000, maritalStatus: 'single',
      spouseIncome: 0, dependents: 0, dependentAges: [],
      lifeInsurancePremium: 0, earthquakeInsurancePremium: 0,
      housingLoanBalance: 0, housingLoanFirstYear: false,
      idecoAmount: 0, medicalExpenses: 0, furusatoAmount: 0,
    });

    expect(filing.filingType).toBe('not_needed');
    expect(yearEnd.steps.length).toBeGreaterThanOrEqual(1);
    expect(yearEnd.summary.estimatedRefund).toBe(0);
  });

  it('deductions reduce both tax and furusato limit', () => {
    const noDeductions = calculateTax({ annualSalary: 8_000_000, deductions: [] });
    const withDeductions = calculateTax({
      annualSalary: 8_000_000,
      deductions: [
        { type: 'spouse', amount: 1 },
        { type: 'ideco', amount: 276_000 },
      ],
    });
    expect(withDeductions.totalTax).toBeLessThan(noDeductions.totalTax);

    const limitNo = calculateFurusatoLimit(8_000_000, []);
    const limitWith = calculateFurusatoLimit(8_000_000, [
      { type: 'spouse', amount: 1 },
      { type: 'ideco', amount: 276_000 },
    ]);
    expect(limitWith).toBeLessThan(limitNo);
  });
});
