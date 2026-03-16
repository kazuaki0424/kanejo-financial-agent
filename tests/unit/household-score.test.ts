import { describe, it, expect } from 'vitest';
import { calculateHouseholdScore, type ScoreInput } from '@/lib/utils/household-score';

function makeInput(overrides: Partial<ScoreInput> = {}): ScoreInput {
  return {
    monthlyIncome: 500000,
    monthlyExpenses: 350000,
    annualIncome: 6000000,
    totalLiabilities: 0,
    liquidAssets: 3000000,
    assetCategoryCount: 3,
    insuranceCoverage: 600000,
    tier: 'middle',
    ...overrides,
  };
}

describe('calculateHouseholdScore', () => {
  describe('total score and grade', () => {
    it('returns score between 0 and 100', () => {
      const result = calculateHouseholdScore(makeInput());
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('assigns grade S for score >= 90', () => {
      // Max everything
      const result = calculateHouseholdScore(makeInput({
        monthlyIncome: 1000000,
        monthlyExpenses: 300000,
        liquidAssets: 5000000,
        assetCategoryCount: 5,
        insuranceCoverage: 600000,
      }));
      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.grade).toBe('S');
    });

    it('assigns grade D for very poor finances', () => {
      const result = calculateHouseholdScore(makeInput({
        monthlyIncome: 200000,
        monthlyExpenses: 300000,
        totalLiabilities: 50000000,
        liquidAssets: 0,
        assetCategoryCount: 0,
        insuranceCoverage: 0,
      }));
      expect(result.score).toBeLessThan(35);
      expect(result.grade).toBe('D');
    });

    it('returns all zeros for zero income zero assets', () => {
      const result = calculateHouseholdScore(makeInput({
        monthlyIncome: 0,
        monthlyExpenses: 0,
        annualIncome: 0,
        totalLiabilities: 0,
        liquidAssets: 0,
        assetCategoryCount: 0,
        insuranceCoverage: 0,
      }));
      // Only debt score gives points (no debt = full debt score)
      expect(result.breakdown.savingsScore).toBe(0);
      expect(result.breakdown.diversityScore).toBe(0);
      expect(result.breakdown.bufferScore).toBe(0);
      expect(result.breakdown.insuranceScore).toBe(0);
      expect(result.breakdown.debtScore).toBe(result.breakdown.debtMax);
    });
  });

  describe('savings score', () => {
    it('gives full score for 25%+ savings rate (middle tier)', () => {
      const result = calculateHouseholdScore(makeInput({
        monthlyIncome: 500000,
        monthlyExpenses: 375000, // 25% savings
        tier: 'middle',
      }));
      expect(result.breakdown.savingsScore).toBe(result.breakdown.savingsMax);
    });

    it('gives full score for 20%+ savings rate (basic tier)', () => {
      const result = calculateHouseholdScore(makeInput({
        monthlyIncome: 500000,
        monthlyExpenses: 400000, // 20% savings
        tier: 'basic',
      }));
      expect(result.breakdown.savingsScore).toBe(result.breakdown.savingsMax);
    });

    it('gives full score for 30%+ savings rate (high_end tier)', () => {
      const result = calculateHouseholdScore(makeInput({
        monthlyIncome: 500000,
        monthlyExpenses: 350000, // 30% savings
        tier: 'high_end',
      }));
      expect(result.breakdown.savingsScore).toBe(result.breakdown.savingsMax);
    });

    it('gives 0 when expenses exceed income', () => {
      const result = calculateHouseholdScore(makeInput({
        monthlyIncome: 300000,
        monthlyExpenses: 400000,
      }));
      expect(result.breakdown.savingsScore).toBe(0);
    });

    it('gives partial score for partial savings', () => {
      // 10% savings rate on middle tier (target 25%) → ~40%
      const result = calculateHouseholdScore(makeInput({
        monthlyIncome: 500000,
        monthlyExpenses: 450000,
        tier: 'middle',
      }));
      expect(result.breakdown.savingsScore).toBeGreaterThan(0);
      expect(result.breakdown.savingsScore).toBeLessThan(result.breakdown.savingsMax);
    });
  });

  describe('debt score', () => {
    it('gives full score for zero liabilities', () => {
      const result = calculateHouseholdScore(makeInput({ totalLiabilities: 0 }));
      expect(result.breakdown.debtScore).toBe(result.breakdown.debtMax);
    });

    it('gives 0 for extremely high debt (basic tier, 3x+ income)', () => {
      const result = calculateHouseholdScore(makeInput({
        totalLiabilities: 20000000,
        annualIncome: 6000000,
        tier: 'basic',
      }));
      expect(result.breakdown.debtScore).toBe(0);
    });

    it('tolerates higher debt for high_end (mortgage + investment)', () => {
      // 4x income debt: basic=0, high_end=still has points
      const result = calculateHouseholdScore(makeInput({
        totalLiabilities: 24000000,
        annualIncome: 6000000,
        tier: 'high_end',
      }));
      expect(result.breakdown.debtScore).toBeGreaterThan(0);
    });

    it('middle tier tolerates moderate debt', () => {
      // 2x income debt
      const result = calculateHouseholdScore(makeInput({
        totalLiabilities: 12000000,
        annualIncome: 6000000,
        tier: 'middle',
      }));
      expect(result.breakdown.debtScore).toBeGreaterThan(0);
    });
  });

  describe('diversity score', () => {
    it('gives full score for 3+ categories (middle tier)', () => {
      const result = calculateHouseholdScore(makeInput({
        assetCategoryCount: 3,
        tier: 'middle',
      }));
      expect(result.breakdown.diversityScore).toBe(result.breakdown.diversityMax);
    });

    it('gives full score for 2+ categories (basic tier)', () => {
      const result = calculateHouseholdScore(makeInput({
        assetCategoryCount: 2,
        tier: 'basic',
      }));
      expect(result.breakdown.diversityScore).toBe(result.breakdown.diversityMax);
    });

    it('requires 4+ categories for full score (high_end tier)', () => {
      const partial = calculateHouseholdScore(makeInput({
        assetCategoryCount: 3,
        tier: 'high_end',
      }));
      const full = calculateHouseholdScore(makeInput({
        assetCategoryCount: 4,
        tier: 'high_end',
      }));
      expect(partial.breakdown.diversityScore).toBeLessThan(full.breakdown.diversityScore);
      expect(full.breakdown.diversityScore).toBe(full.breakdown.diversityMax);
    });

    it('gives 0 for no assets', () => {
      const result = calculateHouseholdScore(makeInput({ assetCategoryCount: 0 }));
      expect(result.breakdown.diversityScore).toBe(0);
    });
  });

  describe('buffer score', () => {
    it('gives full score for 6+ months buffer (middle tier)', () => {
      const result = calculateHouseholdScore(makeInput({
        monthlyExpenses: 300000,
        liquidAssets: 1800000, // 6 months
        tier: 'middle',
      }));
      expect(result.breakdown.bufferScore).toBe(result.breakdown.bufferMax);
    });

    it('gives full score for 3+ months buffer (basic tier)', () => {
      const result = calculateHouseholdScore(makeInput({
        monthlyExpenses: 300000,
        liquidAssets: 900000, // 3 months
        tier: 'basic',
      }));
      expect(result.breakdown.bufferScore).toBe(result.breakdown.bufferMax);
    });

    it('requires 12+ months for full score (high_end tier)', () => {
      const result = calculateHouseholdScore(makeInput({
        monthlyExpenses: 300000,
        liquidAssets: 3600000, // 12 months
        tier: 'high_end',
      }));
      expect(result.breakdown.bufferScore).toBe(result.breakdown.bufferMax);
    });

    it('gives 0 for zero liquid assets', () => {
      const result = calculateHouseholdScore(makeInput({ liquidAssets: 0 }));
      expect(result.breakdown.bufferScore).toBe(0);
    });

    it('gives 0 for zero expenses (edge case)', () => {
      const result = calculateHouseholdScore(makeInput({
        monthlyExpenses: 0,
        liquidAssets: 1000000,
      }));
      expect(result.breakdown.bufferScore).toBe(0);
    });
  });

  describe('insurance score', () => {
    it('gives full score for 10-20% coverage', () => {
      // 10% of 6M = 600K
      const result = calculateHouseholdScore(makeInput({
        insuranceCoverage: 600000,
        annualIncome: 6000000,
      }));
      expect(result.breakdown.insuranceScore).toBe(result.breakdown.insuranceMax);
    });

    it('gives 0 for no insurance', () => {
      const result = calculateHouseholdScore(makeInput({ insuranceCoverage: 0 }));
      expect(result.breakdown.insuranceScore).toBe(0);
    });

    it('gives partial score for low coverage (5%)', () => {
      const result = calculateHouseholdScore(makeInput({
        insuranceCoverage: 300000, // 5% of 6M
        annualIncome: 6000000,
      }));
      expect(result.breakdown.insuranceScore).toBeGreaterThan(0);
      expect(result.breakdown.insuranceScore).toBeLessThan(result.breakdown.insuranceMax);
    });

    it('reduces score for excessive insurance (30%+)', () => {
      const optimal = calculateHouseholdScore(makeInput({
        insuranceCoverage: 900000, // 15%
        annualIncome: 6000000,
      }));
      const excessive = calculateHouseholdScore(makeInput({
        insuranceCoverage: 2400000, // 40%
        annualIncome: 6000000,
      }));
      expect(excessive.breakdown.insuranceScore).toBeLessThan(optimal.breakdown.insuranceScore);
    });
  });

  describe('tier-based weight differences', () => {
    it('basic tier weights savings + buffer higher', () => {
      const basic = calculateHouseholdScore(makeInput({ tier: 'basic' }));
      expect(basic.breakdown.savingsMax).toBe(30);
      expect(basic.breakdown.bufferMax).toBe(30);
      expect(basic.breakdown.diversityMax).toBe(10);
    });

    it('middle tier has balanced weights', () => {
      const middle = calculateHouseholdScore(makeInput({ tier: 'middle' }));
      expect(middle.breakdown.savingsMax).toBe(25);
      expect(middle.breakdown.debtMax).toBe(25);
      expect(middle.breakdown.bufferMax).toBe(20);
    });

    it('high_end tier weights diversity + debt higher', () => {
      const highEnd = calculateHouseholdScore(makeInput({ tier: 'high_end' }));
      expect(highEnd.breakdown.diversityMax).toBe(25);
      expect(highEnd.breakdown.debtMax).toBe(25);
      expect(highEnd.breakdown.savingsMax).toBe(20);
    });

    it('all tier weights sum to 100', () => {
      for (const tier of ['basic', 'middle', 'high_end'] as const) {
        const result = calculateHouseholdScore(makeInput({ tier }));
        const totalMax = result.breakdown.savingsMax + result.breakdown.debtMax +
          result.breakdown.diversityMax + result.breakdown.bufferMax + result.breakdown.insuranceMax;
        expect(totalMax, `${tier} weights should sum to 100`).toBe(100);
      }
    });
  });

  describe('realistic scenarios', () => {
    it('fresh graduate (basic tier)', () => {
      const result = calculateHouseholdScore(makeInput({
        monthlyIncome: 250000,
        monthlyExpenses: 200000,
        annualIncome: 3000000,
        totalLiabilities: 2000000, // student loan
        liquidAssets: 500000,
        assetCategoryCount: 1,
        insuranceCoverage: 0,
        tier: 'basic',
      }));
      expect(result.score).toBeGreaterThan(20);
      expect(result.score).toBeLessThan(85);
      expect(result.grade).toMatch(/[ABC]/);
    });

    it('mid-career homeowner (middle tier)', () => {
      const result = calculateHouseholdScore(makeInput({
        monthlyIncome: 600000,
        monthlyExpenses: 400000,
        annualIncome: 7200000,
        totalLiabilities: 25000000, // mortgage
        liquidAssets: 3000000,
        assetCategoryCount: 3,
        insuranceCoverage: 800000,
        tier: 'middle',
      }));
      expect(result.score).toBeGreaterThan(40);
      expect(result.score).toBeLessThan(85);
    });

    it('wealthy investor (high_end tier)', () => {
      const result = calculateHouseholdScore(makeInput({
        monthlyIncome: 2000000,
        monthlyExpenses: 800000,
        annualIncome: 24000000,
        totalLiabilities: 50000000, // investment property loans
        liquidAssets: 30000000,
        assetCategoryCount: 5,
        insuranceCoverage: 3000000,
        tier: 'high_end',
      }));
      expect(result.score).toBeGreaterThan(60);
      expect(result.grade).toMatch(/[SAB]/);
    });
  });
});
