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

describe('runSimulation', () => {
  describe('basic projection', () => {
    it('returns correct number of years', () => {
      const result = runSimulation(makeParams({ years: 30 }));
      expect(result.projections).toHaveLength(30);
    });

    it('first year age matches currentAge', () => {
      const result = runSimulation(makeParams({ currentAge: 35 }));
      expect(result.projections[0].age).toBe(35);
    });

    it('last year age is currentAge + years - 1', () => {
      const result = runSimulation(makeParams({ currentAge: 30, years: 30 }));
      expect(result.projections[29].age).toBe(59);
    });

    it('assets grow over time with positive savings', () => {
      const result = runSimulation(makeParams({ years: 10 }));
      expect(result.projections[9].totalAssets).toBeGreaterThan(result.projections[0].totalAssets);
    });

    it('net worth equals assets minus liabilities', () => {
      const result = runSimulation(makeParams({
        totalAssets: 5_000_000,
        totalLiabilities: 2_000_000,
      }));
      for (const p of result.projections) {
        expect(p.netWorth).toBe(p.totalAssets - p.totalLiabilities);
      }
    });
  });

  describe('salary growth', () => {
    it('income increases each year before retirement', () => {
      const result = runSimulation(makeParams({
        salaryGrowthRate: 0.03,
        years: 5,
        retirementAge: 65,
      }));
      for (let i = 1; i < 5; i++) {
        expect(result.projections[i].income).toBeGreaterThan(result.projections[i - 1].income);
      }
    });

    it('zero salary growth keeps income flat', () => {
      const result = runSimulation(makeParams({
        salaryGrowthRate: 0,
        years: 5,
        retirementAge: 65,
      }));
      // Income should be constant (no growth, no events)
      expect(result.projections[0].income).toBe(result.projections[4].income);
    });
  });

  describe('inflation', () => {
    it('expenses increase with inflation', () => {
      const result = runSimulation(makeParams({
        inflationRate: 0.02,
        years: 5,
      }));
      for (let i = 1; i < 5; i++) {
        expect(result.projections[i].expenses).toBeGreaterThan(result.projections[i - 1].expenses);
      }
    });

    it('zero inflation keeps expenses flat', () => {
      const result = runSimulation(makeParams({
        inflationRate: 0,
        years: 5,
        lifeEvents: [],
      }));
      expect(result.projections[0].expenses).toBe(result.projections[4].expenses);
    });
  });

  describe('investment returns', () => {
    it('positive assets earn returns', () => {
      const result = runSimulation(makeParams({
        totalAssets: 10_000_000,
        investmentReturnRate: 0.05,
        years: 1,
      }));
      expect(result.projections[0].investmentReturn).toBe(500_000);
    });

    it('zero assets earn no returns', () => {
      const result = runSimulation(makeParams({
        totalAssets: 0,
        investmentReturnRate: 0.05,
        years: 1,
      }));
      expect(result.projections[0].investmentReturn).toBe(0);
    });

    it('compound growth over time', () => {
      const result = runSimulation(makeParams({
        totalAssets: 10_000_000,
        annualIncome: 0,
        annualExpenses: 0,
        investmentReturnRate: 0.05,
        years: 10,
        retirementAge: 99,
      }));
      // After 10 years at 5%: ~16.29M
      const finalAssets = result.projections[9].totalAssets;
      expect(finalAssets).toBeGreaterThan(16_000_000);
      expect(finalAssets).toBeLessThan(17_000_000);
    });
  });

  describe('retirement', () => {
    it('income drops to zero at retirement age', () => {
      const result = runSimulation(makeParams({
        currentAge: 63,
        retirementAge: 65,
        pensionStartAge: 70,
        years: 5,
      }));
      // Age 63, 64: have income; Age 65, 66, 67: no salary, no pension yet
      expect(result.projections[0].income).toBeGreaterThan(0); // age 63
      expect(result.projections[1].income).toBeGreaterThan(0); // age 64
      expect(result.projections[2].income).toBe(0); // age 65 (retired, no pension yet)
    });

    it('retirement bonus is added to assets', () => {
      const result = runSimulation(makeParams({
        currentAge: 64,
        retirementAge: 65,
        retirementBonus: 20_000_000,
        years: 2,
      }));
      expect(result.projections[1].events).toContain('退職');
      // Assets should jump by retirement bonus
      expect(result.projections[1].totalAssets).toBeGreaterThan(result.projections[0].totalAssets);
    });

    it('pension income starts at pension age', () => {
      const result = runSimulation(makeParams({
        currentAge: 64,
        retirementAge: 65,
        pensionAmount: 2_000_000,
        pensionStartAge: 65,
        years: 3,
      }));
      // Age 64: salary only
      // Age 65: retired + pension
      expect(result.projections[1].income).toBe(2_000_000);
    });
  });

  describe('life events', () => {
    it('one-time cost reduces assets in event year', () => {
      const events: LifeEvent[] = [
        { age: 32, type: 'marriage', name: '結婚', oneTimeCost: 3_000_000, annualCostChange: 0, annualIncomeChange: 0 },
      ];
      const result = runSimulation(makeParams({ currentAge: 30, lifeEvents: events, years: 5 }));
      const eventYear = result.projections[2]; // age 32
      expect(eventYear.events).toContain('結婚');
      expect(eventYear.expenses).toBeGreaterThan(result.projections[1].expenses);
    });

    it('annual cost change persists in subsequent years', () => {
      const events: LifeEvent[] = [
        { age: 31, type: 'childbirth', name: '出産', oneTimeCost: 500_000, annualCostChange: 600_000, annualIncomeChange: 0 },
      ];
      const result = runSimulation(makeParams({
        currentAge: 30,
        lifeEvents: events,
        years: 5,
        inflationRate: 0,
      }));
      // Year 0 (age 30): base expenses
      // Year 1 (age 31): base + one-time + annual change
      // Year 2 (age 32): base + annual change (persists)
      expect(result.projections[2].expenses).toBeGreaterThan(result.projections[0].expenses);
    });

    it('housing purchase adds large one-time cost', () => {
      const events: LifeEvent[] = [
        { age: 35, type: 'housing_purchase', name: '住宅購入', oneTimeCost: 10_000_000, annualCostChange: 0, annualIncomeChange: 0 },
      ];
      const result = runSimulation(makeParams({ currentAge: 30, lifeEvents: events, years: 10 }));
      const eventYear = result.projections[5];
      expect(eventYear.events).toContain('住宅購入');
      expect(eventYear.expenses).toBeGreaterThan(10_000_000);
    });

    it('multiple events in same year', () => {
      const events: LifeEvent[] = [
        { age: 30, type: 'marriage', name: '結婚', oneTimeCost: 3_000_000, annualCostChange: 0, annualIncomeChange: 0 },
        { age: 30, type: 'custom', name: '引越し', oneTimeCost: 500_000, annualCostChange: 0, annualIncomeChange: 0 },
      ];
      const result = runSimulation(makeParams({ currentAge: 30, lifeEvents: events, years: 1 }));
      expect(result.projections[0].events).toHaveLength(2);
      expect(result.projections[0].events).toContain('結婚');
      expect(result.projections[0].events).toContain('引越し');
    });
  });

  describe('loan repayment', () => {
    it('liabilities decrease with loan payments', () => {
      const result = runSimulation(makeParams({
        totalLiabilities: 10_000_000,
        annualLoanPayment: 1_000_000,
        years: 5,
      }));
      expect(result.projections[0].totalLiabilities).toBeLessThan(10_000_000);
      expect(result.projections[4].totalLiabilities).toBeLessThan(result.projections[0].totalLiabilities);
    });

    it('liabilities never go below zero', () => {
      const result = runSimulation(makeParams({
        totalLiabilities: 2_000_000,
        annualLoanPayment: 5_000_000,
        years: 3,
      }));
      for (const p of result.projections) {
        expect(p.totalLiabilities).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('summary', () => {
    it('detects bankruptcy age when net worth goes negative', () => {
      const result = runSimulation(makeParams({
        annualIncome: 3_000_000,
        annualExpenses: 5_000_000,
        totalAssets: 3_000_000,
        totalLiabilities: 0,
        years: 10,
      }));
      expect(result.summary.bankruptcyAge).not.toBeNull();
    });

    it('bankruptcy is null when net worth stays positive', () => {
      const result = runSimulation(makeParams({
        annualIncome: 10_000_000,
        annualExpenses: 3_000_000,
        totalAssets: 50_000_000,
        years: 10,
      }));
      expect(result.summary.bankruptcyAge).toBeNull();
    });

    it('tracks total savings', () => {
      const result = runSimulation(makeParams({ years: 5 }));
      const manualSum = result.projections.reduce((s, p) => s + p.savings, 0);
      expect(result.summary.totalSavings).toBe(manualSum);
    });

    it('tracks total investment returns', () => {
      const result = runSimulation(makeParams({ years: 5 }));
      const manualSum = result.projections.reduce((s, p) => s + p.investmentReturn, 0);
      expect(result.summary.totalInvestmentReturns).toBe(manualSum);
    });

    it('final net worth matches last projection', () => {
      const result = runSimulation(makeParams({ years: 10 }));
      const last = result.projections[result.projections.length - 1];
      expect(result.summary.finalNetWorth).toBe(last.netWorth);
    });
  });

  describe('realistic scenarios', () => {
    it('typical salaryman: age 30 to 60', () => {
      const events: LifeEvent[] = [
        { age: 32, type: 'marriage', name: '結婚', oneTimeCost: 3_000_000, annualCostChange: 200_000, annualIncomeChange: 0 },
        { age: 34, type: 'childbirth', name: '第一子', oneTimeCost: 500_000, annualCostChange: 600_000, annualIncomeChange: 0 },
        { age: 38, type: 'housing_purchase', name: 'マンション購入', oneTimeCost: 8_000_000, annualCostChange: 0, annualIncomeChange: 0 },
      ];

      const result = runSimulation(makeParams({
        currentAge: 30,
        annualIncome: 5_500_000,
        annualExpenses: 3_800_000,
        totalAssets: 3_000_000,
        totalLiabilities: 0,
        annualLoanPayment: 0,
        salaryGrowthRate: 0.025,
        inflationRate: 0.01,
        investmentReturnRate: 0.03,
        retirementAge: 65,
        retirementBonus: 15_000_000,
        pensionAmount: 2_000_000,
        pensionStartAge: 65,
        years: 30,
        lifeEvents: events,
      }));

      expect(result.projections).toHaveLength(30);
      // Should still be positive at 59
      expect(result.summary.finalNetWorth).toBeGreaterThan(0);
      // Marriage event at age 32
      expect(result.projections[2].events).toContain('結婚');
      // Housing at age 38
      expect(result.projections[8].events).toContain('マンション購入');
    });

    it('early retirement at 50', () => {
      const result = runSimulation(makeParams({
        currentAge: 40,
        annualIncome: 12_000_000,
        annualExpenses: 6_000_000,
        totalAssets: 30_000_000,
        retirementAge: 50,
        retirementBonus: 10_000_000,
        pensionAmount: 1_500_000,
        pensionStartAge: 65,
        investmentReturnRate: 0.04,
        years: 30,
      }));

      // After retirement at 50, 15 years until pension
      // Should the assets last?
      const atRetirement = result.projections[10]; // age 50
      expect(atRetirement.events).toContain('退職');
      expect(result.summary.netWorthAtRetirement).toBeGreaterThan(0);
    });
  });
});
