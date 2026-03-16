import { describe, it, expect } from 'vitest';
import { runSimulation, DEFAULT_PARAMS, type SimulationParams, type LifeEvent } from '@/lib/utils/cashflow-engine';

function makeParams(overrides: Partial<SimulationParams> = {}): SimulationParams {
  return {
    currentAge: 30,
    annualIncome: 6_000_000,
    annualExpenses: 4_200_000,
    totalAssets: 5_000_000,
    totalLiabilities: 0,
    ...DEFAULT_PARAMS,
    ...overrides,
  };
}

describe('Cashflow edge cases', () => {
  describe('extreme parameters', () => {
    it('handles zero income gracefully', () => {
      const result = runSimulation(makeParams({ annualIncome: 0, years: 10 }));
      expect(result.projections).toHaveLength(10);
      // Should deplete assets
      expect(result.projections[9].totalAssets).toBeLessThan(5_000_000);
    });

    it('handles zero expenses gracefully', () => {
      const result = runSimulation(makeParams({ annualExpenses: 0, years: 5 }));
      expect(result.projections[4].totalAssets).toBeGreaterThan(5_000_000);
      for (const p of result.projections) {
        expect(p.savings).toBeGreaterThanOrEqual(0);
      }
    });

    it('handles very high inflation (10%)', () => {
      const result = runSimulation(makeParams({ inflationRate: 0.10, years: 20 }));
      // Expenses should grow massively
      expect(result.projections[19].expenses).toBeGreaterThan(result.projections[0].expenses * 5);
      expect(result.projections).toHaveLength(20);
    });

    it('handles negative starting assets', () => {
      const result = runSimulation(makeParams({
        totalAssets: -1_000_000,
        annualIncome: 0,
        annualExpenses: 500_000,
        years: 3,
      }));
      // With no income and expenses, assets should stay negative
      expect(result.projections[0].totalAssets).toBeLessThan(0);
      // No investment returns on negative assets
      expect(result.projections[0].investmentReturn).toBe(0);
    });

    it('handles very large starting assets', () => {
      const result = runSimulation(makeParams({
        totalAssets: 1_000_000_000,
        investmentReturnRate: 0.05,
        years: 5,
      }));
      expect(result.projections[0].investmentReturn).toBe(50_000_000);
    });

    it('handles 100% savings rate', () => {
      const result = runSimulation(makeParams({
        annualIncome: 10_000_000,
        annualExpenses: 0,
        years: 5,
      }));
      for (const p of result.projections) {
        expect(p.savings).toBeGreaterThan(0);
      }
    });

    it('handles very long simulation (50 years)', () => {
      const result = runSimulation(makeParams({ years: 50 }));
      expect(result.projections).toHaveLength(50);
      expect(result.projections[49].age).toBe(79);
    });

    it('handles minimum simulation (1 year)', () => {
      const result = runSimulation(makeParams({ years: 1 }));
      expect(result.projections).toHaveLength(1);
      expect(result.summary.finalNetWorth).toBeDefined();
    });

    it('handles zero investment return rate', () => {
      const result = runSimulation(makeParams({ investmentReturnRate: 0, years: 5 }));
      for (const p of result.projections) {
        expect(p.investmentReturn).toBe(0);
      }
    });

    it('handles zero salary growth', () => {
      const result = runSimulation(makeParams({
        salaryGrowthRate: 0,
        inflationRate: 0,
        years: 5,
        lifeEvents: [],
      }));
      // Income should be constant
      expect(result.projections[0].income).toBe(result.projections[4].income);
    });
  });

  describe('retirement edge cases', () => {
    it('handles retirement at current age', () => {
      const result = runSimulation(makeParams({
        currentAge: 65,
        retirementAge: 65,
        pensionStartAge: 65,
        pensionAmount: 2_000_000,
        years: 5,
      }));
      // Should have pension income from year 1
      expect(result.projections[0].income).toBe(2_000_000);
      expect(result.projections[0].events).toContain('退職');
    });

    it('handles retirement age beyond simulation period', () => {
      const result = runSimulation(makeParams({
        currentAge: 30,
        retirementAge: 70,
        years: 10, // Only simulate to age 39
      }));
      // Should have salary income throughout
      for (const p of result.projections) {
        expect(p.income).toBeGreaterThan(0);
      }
      // No retirement event
      expect(result.summary.netWorthAtRetirement).toBe(0);
    });

    it('handles pension start age after retirement', () => {
      const result = runSimulation(makeParams({
        currentAge: 60,
        retirementAge: 65,
        pensionStartAge: 70,
        pensionAmount: 2_000_000,
        years: 15,
      }));
      // Age 65-69: no income (retired, no pension)
      expect(result.projections[5].income).toBe(0); // age 65
      expect(result.projections[9].income).toBe(0); // age 69
      // Age 70+: pension
      expect(result.projections[10].income).toBe(2_000_000); // age 70
    });

    it('handles very large retirement bonus', () => {
      const result = runSimulation(makeParams({
        currentAge: 64,
        retirementAge: 65,
        retirementBonus: 100_000_000,
        years: 2,
      }));
      expect(result.projections[1].totalAssets).toBeGreaterThan(100_000_000);
    });
  });

  describe('life event edge cases', () => {
    it('handles event at first year', () => {
      const events: LifeEvent[] = [
        { age: 30, type: 'marriage', name: '結婚', oneTimeCost: 3_000_000, annualCostChange: 0, annualIncomeChange: 0 },
      ];
      const result = runSimulation(makeParams({ currentAge: 30, lifeEvents: events, years: 3 }));
      expect(result.projections[0].events).toContain('結婚');
    });

    it('handles event at last year', () => {
      const events: LifeEvent[] = [
        { age: 34, type: 'custom', name: 'テスト', oneTimeCost: 1_000_000, annualCostChange: 0, annualIncomeChange: 0 },
      ];
      const result = runSimulation(makeParams({ currentAge: 30, lifeEvents: events, years: 5 }));
      expect(result.projections[4].events).toContain('テスト');
    });

    it('handles event beyond simulation period (ignored)', () => {
      const events: LifeEvent[] = [
        { age: 99, type: 'custom', name: '遠い未来', oneTimeCost: 1_000_000, annualCostChange: 0, annualIncomeChange: 0 },
      ];
      const result = runSimulation(makeParams({ currentAge: 30, years: 10, lifeEvents: events }));
      // Event should not appear
      for (const p of result.projections) {
        expect(p.events).not.toContain('遠い未来');
      }
    });

    it('handles many events in same year', () => {
      const events: LifeEvent[] = Array.from({ length: 10 }, (_, i) => ({
        age: 30,
        type: 'custom' as const,
        name: `イベント${i + 1}`,
        oneTimeCost: 100_000,
        annualCostChange: 0,
        annualIncomeChange: 0,
      }));
      const result = runSimulation(makeParams({ currentAge: 30, lifeEvents: events, years: 1 }));
      expect(result.projections[0].events).toHaveLength(10);
      // Total one-time cost should be 1M
      expect(result.projections[0].expenses).toBeGreaterThanOrEqual(4_200_000 + 1_000_000);
    });

    it('handles income-increasing event', () => {
      const events: LifeEvent[] = [
        { age: 31, type: 'custom', name: '昇進', oneTimeCost: 0, annualCostChange: 0, annualIncomeChange: 2_000_000 },
      ];
      const result = runSimulation(makeParams({ currentAge: 30, lifeEvents: events, years: 5 }));
      // After age 31, income should be higher
      expect(result.projections[2].income).toBeGreaterThan(result.projections[0].income + 1_500_000);
    });

    it('handles expense-reducing event', () => {
      const events: LifeEvent[] = [
        { age: 31, type: 'custom', name: 'ローン完済', oneTimeCost: 0, annualCostChange: -1_200_000, annualIncomeChange: 0 },
      ];
      const result = runSimulation(makeParams({
        currentAge: 30,
        lifeEvents: events,
        years: 5,
        inflationRate: 0,
      }));
      // After age 31, expenses should be lower
      expect(result.projections[2].expenses).toBeLessThan(result.projections[0].expenses);
    });
  });

  describe('loan repayment edge cases', () => {
    it('handles loan fully paid off mid-simulation', () => {
      const result = runSimulation(makeParams({
        totalLiabilities: 3_000_000,
        annualLoanPayment: 1_500_000,
        years: 5,
      }));
      // Should be paid off by year 2
      expect(result.projections[2].totalLiabilities).toBe(0);
      expect(result.projections[4].totalLiabilities).toBe(0);
    });

    it('handles zero loan payment with liabilities', () => {
      const result = runSimulation(makeParams({
        totalLiabilities: 10_000_000,
        annualLoanPayment: 0,
        years: 3,
      }));
      // Liabilities should remain unchanged
      expect(result.projections[0].totalLiabilities).toBe(10_000_000);
      expect(result.projections[2].totalLiabilities).toBe(10_000_000);
    });
  });

  describe('summary accuracy', () => {
    it('total savings approximately equals sum of yearly savings', () => {
      const result = runSimulation(makeParams({ years: 20 }));
      const manualSum = result.projections.reduce((s, p) => s + p.savings, 0);
      // Allow ±10 for rounding accumulation
      expect(Math.abs(result.summary.totalSavings - manualSum)).toBeLessThanOrEqual(10);
    });

    it('total investment returns approximately equals sum of yearly returns', () => {
      const result = runSimulation(makeParams({ years: 20 }));
      const manualSum = result.projections.reduce((s, p) => s + p.investmentReturn, 0);
      expect(Math.abs(result.summary.totalInvestmentReturns - manualSum)).toBeLessThanOrEqual(10);
    });

    it('final net worth matches last projection', () => {
      const result = runSimulation(makeParams({ years: 30 }));
      const last = result.projections[result.projections.length - 1];
      expect(result.summary.finalNetWorth).toBe(last.netWorth);
    });

    it('bankruptcy age is first year where net worth < 0', () => {
      const result = runSimulation(makeParams({
        annualIncome: 2_000_000,
        annualExpenses: 5_000_000,
        totalAssets: 5_000_000,
        years: 10,
      }));
      if (result.summary.bankruptcyAge !== null) {
        const bankruptYear = result.projections.find((p) => p.age === result.summary.bankruptcyAge);
        expect(bankruptYear?.netWorth).toBeLessThan(0);
        // Year before should be positive
        const yearBefore = result.projections.find((p) => p.age === result.summary.bankruptcyAge! - 1);
        if (yearBefore) {
          expect(yearBefore.netWorth).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });
});
