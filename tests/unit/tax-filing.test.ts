import { describe, it, expect } from 'vitest';
import { assessFilingNeed, type FilingProfile } from '@/lib/utils/tax-filing';

function makeProfile(overrides: Partial<FilingProfile> = {}): FilingProfile {
  return {
    annualSalary: 6_000_000,
    occupation: 'employee',
    hasSideIncome: false,
    sideIncomeAmount: 0,
    hasMultipleEmployers: false,
    hasMedicalExpenses: false,
    medicalExpenseAmount: 0,
    hasHousingLoan: false,
    housingLoanFirstYear: false,
    hasFurusato: false,
    furusatoCount: 0,
    hasStockIncome: false,
    hasRentalIncome: false,
    leftJobMidYear: false,
    ...overrides,
  };
}

describe('assessFilingNeed', () => {
  describe('not needed cases', () => {
    it('standard employee with no special circumstances', () => {
      const result = assessFilingNeed(makeProfile());
      expect(result.filingType).toBe('not_needed');
      expect(result.required).toBe(false);
      expect(result.beneficial).toBe(false);
    });
  });

  describe('required cases', () => {
    it('high income (> 20M)', () => {
      const result = assessFilingNeed(makeProfile({ annualSalary: 25_000_000 }));
      expect(result.filingType).toBe('required');
      expect(result.reasons.some((r) => r.id === 'high_income')).toBe(true);
    });

    it('side income over 200K', () => {
      const result = assessFilingNeed(makeProfile({
        hasSideIncome: true,
        sideIncomeAmount: 300_000,
      }));
      expect(result.required).toBe(true);
      expect(result.reasons.some((r) => r.id === 'side_income')).toBe(true);
    });

    it('side income under 200K is NOT required', () => {
      const result = assessFilingNeed(makeProfile({
        hasSideIncome: true,
        sideIncomeAmount: 150_000,
      }));
      expect(result.reasons.some((r) => r.id === 'side_income')).toBe(false);
    });

    it('multiple employers', () => {
      const result = assessFilingNeed(makeProfile({ hasMultipleEmployers: true }));
      expect(result.required).toBe(true);
      expect(result.reasons.some((r) => r.id === 'multiple_employers')).toBe(true);
    });

    it('stock income', () => {
      const result = assessFilingNeed(makeProfile({ hasStockIncome: true }));
      expect(result.required).toBe(true);
      expect(result.reasons.some((r) => r.id === 'stock_income')).toBe(true);
    });

    it('rental income', () => {
      const result = assessFilingNeed(makeProfile({ hasRentalIncome: true }));
      expect(result.required).toBe(true);
      expect(result.reasons.some((r) => r.id === 'rental_income')).toBe(true);
    });

    it('mid-year resignation', () => {
      const result = assessFilingNeed(makeProfile({ leftJobMidYear: true }));
      expect(result.required).toBe(true);
      expect(result.reasons.some((r) => r.id === 'mid_year_resignation')).toBe(true);
    });

    it('self-employed', () => {
      const result = assessFilingNeed(makeProfile({ occupation: 'self_employed' }));
      expect(result.required).toBe(true);
      expect(result.reasons.some((r) => r.id === 'self_employed')).toBe(true);
    });
  });

  describe('recommended cases', () => {
    it('medical expenses over 100K', () => {
      const result = assessFilingNeed(makeProfile({
        hasMedicalExpenses: true,
        medicalExpenseAmount: 200_000,
      }));
      expect(result.beneficial).toBe(true);
      expect(result.reasons.some((r) => r.id === 'medical_deduction')).toBe(true);
    });

    it('medical expenses under 100K is NOT recommended', () => {
      const result = assessFilingNeed(makeProfile({
        hasMedicalExpenses: true,
        medicalExpenseAmount: 50_000,
      }));
      expect(result.reasons.some((r) => r.id === 'medical_deduction')).toBe(false);
    });

    it('housing loan first year', () => {
      const result = assessFilingNeed(makeProfile({
        hasHousingLoan: true,
        housingLoanFirstYear: true,
      }));
      expect(result.beneficial).toBe(true);
      expect(result.reasons.some((r) => r.id === 'housing_loan_first')).toBe(true);
    });

    it('furusato 6+ municipalities', () => {
      const result = assessFilingNeed(makeProfile({
        hasFurusato: true,
        furusatoCount: 8,
      }));
      expect(result.beneficial).toBe(true);
      expect(result.reasons.some((r) => r.id === 'furusato_many')).toBe(true);
    });

    it('furusato 5 or fewer is NOT flagged', () => {
      const result = assessFilingNeed(makeProfile({
        hasFurusato: true,
        furusatoCount: 5,
      }));
      expect(result.reasons.some((r) => r.id === 'furusato_many')).toBe(false);
    });
  });

  describe('steps', () => {
    it('returns 1 step for not-needed', () => {
      const result = assessFilingNeed(makeProfile());
      expect(result.steps.length).toBe(1);
    });

    it('returns 4+ steps when filing is needed', () => {
      const result = assessFilingNeed(makeProfile({ hasStockIncome: true }));
      expect(result.steps.length).toBeGreaterThanOrEqual(4);
    });

    it('adds bookkeeping step for self-employed', () => {
      const result = assessFilingNeed(makeProfile({ occupation: 'self_employed' }));
      const hasBookkeeping = result.steps.some((s) => s.title.includes('帳簿'));
      expect(hasBookkeeping).toBe(true);
    });

    it('steps are ordered sequentially', () => {
      const result = assessFilingNeed(makeProfile({ hasStockIncome: true }));
      for (let i = 0; i < result.steps.length; i++) {
        expect(result.steps[i].order).toBe(i + 1);
      }
    });
  });

  describe('documents', () => {
    it('always includes source tax slip and MyNumber card', () => {
      const result = assessFilingNeed(makeProfile());
      expect(result.documents.some((d) => d.name.includes('源泉徴収票'))).toBe(true);
      expect(result.documents.some((d) => d.name.includes('マイナンバー'))).toBe(true);
    });

    it('includes medical receipt for medical deduction', () => {
      const result = assessFilingNeed(makeProfile({
        hasMedicalExpenses: true,
        medicalExpenseAmount: 200_000,
      }));
      expect(result.documents.some((d) => d.name.includes('医療費'))).toBe(true);
    });

    it('includes housing loan docs for first year', () => {
      const result = assessFilingNeed(makeProfile({
        hasHousingLoan: true,
        housingLoanFirstYear: true,
      }));
      expect(result.documents.some((d) => d.name.includes('住宅借入金'))).toBe(true);
      expect(result.documents.some((d) => d.name.includes('残高証明'))).toBe(true);
    });

    it('no duplicate documents', () => {
      const result = assessFilingNeed(makeProfile({
        hasSideIncome: true,
        sideIncomeAmount: 500_000,
        hasStockIncome: true,
        hasMedicalExpenses: true,
        medicalExpenseAmount: 200_000,
      }));
      const names = result.documents.map((d) => d.name);
      const unique = new Set(names);
      expect(names.length).toBe(unique.size);
    });
  });

  describe('combined scenarios', () => {
    it('required overrides recommended', () => {
      const result = assessFilingNeed(makeProfile({
        hasSideIncome: true,
        sideIncomeAmount: 500_000,
        hasMedicalExpenses: true,
        medicalExpenseAmount: 200_000,
      }));
      expect(result.filingType).toBe('required');
      expect(result.reasons.length).toBeGreaterThanOrEqual(2);
    });
  });
});
