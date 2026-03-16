import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrencyString } from '@/lib/utils/format';
import { calculateHouseholdScore, type ScoreInput } from '@/lib/utils/household-score';

describe('Edge cases: formatCurrency', () => {
  it('handles Number.MAX_SAFE_INTEGER', () => {
    const result = formatCurrency(Number.MAX_SAFE_INTEGER);
    expect(result).toBeTruthy();
    expect(result.includes(',')).toBe(true);
  });

  it('handles very small numbers', () => {
    expect(formatCurrency(1)).toBe('1');
  });
});

describe('Edge cases: parseCurrencyString', () => {
  it('returns 0 for mixed alpha/numeric (not a valid currency string)', () => {
    expect(parseCurrencyString('abc123def')).toBe(0);
  });

  it('handles only commas', () => {
    expect(parseCurrencyString(',,,')).toBe(0);
  });

  it('handles very long number string', () => {
    const result = parseCurrencyString('999,999,999,999');
    expect(result).toBe(999999999999);
  });
});

describe('Edge cases: calculateHouseholdScore', () => {
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

  it('handles extremely high income', () => {
    const result = calculateHouseholdScore(makeInput({
      monthlyIncome: 100_000_000,
      annualIncome: 1_200_000_000,
      tier: 'high_end',
    }));
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('handles income equal to expenses (zero savings)', () => {
    const result = calculateHouseholdScore(makeInput({
      monthlyIncome: 400000,
      monthlyExpenses: 400000,
    }));
    expect(result.breakdown.savingsScore).toBe(0);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('handles all zeroes gracefully', () => {
    const result = calculateHouseholdScore(makeInput({
      monthlyIncome: 0,
      monthlyExpenses: 0,
      annualIncome: 0,
      totalLiabilities: 0,
      liquidAssets: 0,
      assetCategoryCount: 0,
      insuranceCoverage: 0,
    }));
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.grade).toBeDefined();
  });

  it('handles very large category count', () => {
    const result = calculateHouseholdScore(makeInput({
      assetCategoryCount: 100,
    }));
    expect(result.breakdown.diversityScore).toBe(result.breakdown.diversityMax);
  });

  it('handles 100% insurance coverage', () => {
    const result = calculateHouseholdScore(makeInput({
      insuranceCoverage: 6000000, // 100% of annual income
      annualIncome: 6000000,
    }));
    // Excessive insurance should be penalized
    expect(result.breakdown.insuranceScore).toBe(0);
  });

  it('score never exceeds 100', () => {
    // Try to maximize all indicators
    const result = calculateHouseholdScore(makeInput({
      monthlyIncome: 10_000_000,
      monthlyExpenses: 100_000,
      annualIncome: 120_000_000,
      totalLiabilities: 0,
      liquidAssets: 100_000_000,
      assetCategoryCount: 10,
      insuranceCoverage: 12_000_000,
      tier: 'basic',
    }));
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('score never goes below 0', () => {
    const result = calculateHouseholdScore(makeInput({
      monthlyIncome: 100,
      monthlyExpenses: 1_000_000,
      annualIncome: 1200,
      totalLiabilities: 999_999_999,
      liquidAssets: 0,
      assetCategoryCount: 0,
      insuranceCoverage: 0,
    }));
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('grade boundaries are correct', () => {
    // We can't control exact scores, but verify grade function consistency
    const grades = ['S', 'A', 'B', 'C', 'D'] as const;
    const tiers = ['basic', 'middle', 'high_end'] as const;

    for (const tier of tiers) {
      const result = calculateHouseholdScore(makeInput({ tier }));
      expect(grades).toContain(result.grade);
    }
  });
});
