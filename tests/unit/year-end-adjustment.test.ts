import { describe, it, expect } from 'vitest';
import { generateYearEndGuide, type YearEndProfile } from '@/lib/utils/year-end-adjustment';

function makeProfile(overrides: Partial<YearEndProfile> = {}): YearEndProfile {
  return {
    annualSalary: 6_000_000,
    maritalStatus: 'single',
    spouseIncome: 0,
    dependents: 0,
    dependentAges: [],
    lifeInsurancePremium: 0,
    earthquakeInsurancePremium: 0,
    housingLoanBalance: 0,
    housingLoanFirstYear: false,
    idecoAmount: 0,
    medicalExpenses: 0,
    furusatoAmount: 0,
    ...overrides,
  };
}

describe('generateYearEndGuide', () => {
  describe('steps generation', () => {
    it('always includes basic deduction step', () => {
      const result = generateYearEndGuide(makeProfile());
      expect(result.steps.some((s) => s.id === 'basic')).toBe(true);
    });

    it('includes spouse step for married', () => {
      const result = generateYearEndGuide(makeProfile({
        maritalStatus: 'married',
        spouseIncome: 500_000,
      }));
      expect(result.steps.some((s) => s.id === 'spouse')).toBe(true);
    });

    it('excludes spouse step for single', () => {
      const result = generateYearEndGuide(makeProfile({ maritalStatus: 'single' }));
      expect(result.steps.some((s) => s.id === 'spouse')).toBe(false);
    });

    it('includes dependents step when dependents > 0', () => {
      const result = generateYearEndGuide(makeProfile({
        dependents: 2,
        dependentAges: [10, 20],
      }));
      expect(result.steps.some((s) => s.id === 'dependents')).toBe(true);
    });

    it('includes insurance step when premiums > 0', () => {
      const result = generateYearEndGuide(makeProfile({
        lifeInsurancePremium: 50_000,
      }));
      expect(result.steps.some((s) => s.id === 'insurance')).toBe(true);
    });

    it('includes iDeCo step when amount > 0', () => {
      const result = generateYearEndGuide(makeProfile({
        idecoAmount: 276_000,
      }));
      expect(result.steps.some((s) => s.id === 'ideco')).toBe(true);
    });

    it('includes housing loan step for 2nd year onwards', () => {
      const result = generateYearEndGuide(makeProfile({
        housingLoanBalance: 30_000_000,
        housingLoanFirstYear: false,
      }));
      expect(result.steps.some((s) => s.id === 'housing_loan')).toBe(true);
    });

    it('excludes housing loan step for first year', () => {
      const result = generateYearEndGuide(makeProfile({
        housingLoanBalance: 30_000_000,
        housingLoanFirstYear: true,
      }));
      expect(result.steps.some((s) => s.id === 'housing_loan')).toBe(false);
    });
  });

  describe('summary', () => {
    it('estimates positive refund with deductions', () => {
      const result = generateYearEndGuide(makeProfile({
        idecoAmount: 276_000,
        lifeInsurancePremium: 80_000,
      }));
      expect(result.summary.estimatedRefund).toBeGreaterThan(0);
    });

    it('refund is zero with no deductions', () => {
      const result = generateYearEndGuide(makeProfile());
      expect(result.summary.estimatedRefund).toBe(0);
    });

    it('more deductions = higher refund', () => {
      const basic = generateYearEndGuide(makeProfile({ idecoAmount: 276_000 }));
      const full = generateYearEndGuide(makeProfile({
        maritalStatus: 'married',
        spouseIncome: 500_000,
        idecoAmount: 276_000,
        lifeInsurancePremium: 80_000,
        housingLoanBalance: 30_000_000,
      }));
      expect(full.summary.estimatedRefund).toBeGreaterThan(basic.summary.estimatedRefund);
    });
  });

  describe('optimizations', () => {
    it('suggests iDeCo when not enrolled', () => {
      const result = generateYearEndGuide(makeProfile({ idecoAmount: 0 }));
      expect(result.optimizations.some((o) => o.title.includes('iDeCo'))).toBe(true);
    });

    it('does not suggest iDeCo when enrolled', () => {
      const result = generateYearEndGuide(makeProfile({ idecoAmount: 276_000 }));
      expect(result.optimizations.some((o) => o.title.includes('iDeCo'))).toBe(false);
    });

    it('suggests furusato when not used and salary > 3M', () => {
      const result = generateYearEndGuide(makeProfile({
        annualSalary: 6_000_000,
        furusatoAmount: 0,
      }));
      expect(result.optimizations.some((o) => o.title.includes('ふるさと'))).toBe(true);
    });

    it('optimizations are sorted by priority', () => {
      const result = generateYearEndGuide(makeProfile());
      const priorities = result.optimizations.map((o) => o.priority);
      const order = { high: 0, medium: 1, low: 2 };
      for (let i = 1; i < priorities.length; i++) {
        expect(order[priorities[i]]).toBeGreaterThanOrEqual(order[priorities[i - 1]]);
      }
    });
  });

  describe('dependent ages', () => {
    it('distinguishes general and special dependents', () => {
      const result = generateYearEndGuide(makeProfile({
        dependents: 2,
        dependentAges: [17, 20], // 17 = general, 20 = special
      }));
      const depStep = result.steps.find((s) => s.id === 'dependents');
      expect(depStep).toBeDefined();
      expect(depStep?.fields.some((f) => f.label.includes('一般'))).toBe(true);
      expect(depStep?.fields.some((f) => f.label.includes('特定'))).toBe(true);
    });

    it('notes under-16 as not eligible for deduction', () => {
      const result = generateYearEndGuide(makeProfile({
        dependents: 1,
        dependentAges: [5],
      }));
      const depStep = result.steps.find((s) => s.id === 'dependents');
      expect(depStep?.fields.some((f) => f.label.includes('16歳未満'))).toBe(true);
    });
  });
});
