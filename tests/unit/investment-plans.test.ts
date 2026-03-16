import { describe, it, expect } from 'vitest';
import {
  simulateInvestment,
  calculateIdecoTaxSaving,
  calculateNisaTaxSaving,
} from '@/lib/constants/investment-plans';

describe('simulateInvestment', () => {
  it('returns correct number of yearly entries', () => {
    const result = simulateInvestment(10_000, 20, 0.03);
    expect(result.yearly).toHaveLength(20);
  });

  it('total contribution equals monthly × 12 × years', () => {
    const result = simulateInvestment(10_000, 10, 0.05);
    expect(result.totalContribution).toBe(10_000 * 12 * 10);
  });

  it('final value exceeds contribution with positive returns', () => {
    const result = simulateInvestment(10_000, 10, 0.05);
    expect(result.finalValue).toBeGreaterThan(result.totalContribution);
  });

  it('final value equals contribution with zero returns', () => {
    const result = simulateInvestment(10_000, 10, 0);
    expect(result.finalValue).toBe(result.totalContribution);
  });

  it('total return is positive with positive rate', () => {
    const result = simulateInvestment(50_000, 20, 0.04);
    expect(result.totalReturn).toBeGreaterThan(0);
  });

  it('compound effect: longer period = proportionally more returns', () => {
    const r10 = simulateInvestment(10_000, 10, 0.05);
    const r20 = simulateInvestment(10_000, 20, 0.05);
    // 20y return should be more than 2x the 10y return (compound effect)
    expect(r20.totalReturn).toBeGreaterThan(r10.totalReturn * 2);
  });

  it('iDeCo full contribution at 23K/month for 30 years at 3%', () => {
    const result = simulateInvestment(23_000, 30, 0.03);
    expect(result.totalContribution).toBe(23_000 * 12 * 30); // 8,280,000
    expect(result.finalValue).toBeGreaterThan(12_000_000); // Should be ~13M+
  });

  it('NISA tsumitate 100K/month for 20 years at 5%', () => {
    const result = simulateInvestment(100_000, 20, 0.05);
    expect(result.totalContribution).toBe(24_000_000);
    expect(result.finalValue).toBeGreaterThan(38_000_000); // ~40M with compound
  });

  it('handles zero monthly amount', () => {
    const result = simulateInvestment(0, 10, 0.05);
    expect(result.totalContribution).toBe(0);
    expect(result.finalValue).toBe(0);
  });

  it('yearly values are monotonically increasing', () => {
    const result = simulateInvestment(10_000, 10, 0.03);
    for (let i = 1; i < result.yearly.length; i++) {
      expect(result.yearly[i].value).toBeGreaterThan(result.yearly[i - 1].value);
    }
  });
});

describe('calculateIdecoTaxSaving', () => {
  it('calculates income tax + resident tax saving', () => {
    // 276,000 annual, 20% income tax rate
    const saving = calculateIdecoTaxSaving(276_000, 0.20);
    // 276,000 × 20% + 276,000 × 10% = 55,200 + 27,600 = 82,800
    expect(saving).toBe(82_800);
  });

  it('higher tax rate = more saving', () => {
    const low = calculateIdecoTaxSaving(276_000, 0.10);
    const high = calculateIdecoTaxSaving(276_000, 0.20);
    expect(high).toBeGreaterThan(low);
  });

  it('returns 0 for zero contribution', () => {
    expect(calculateIdecoTaxSaving(0, 0.20)).toBe(0);
  });

  it('self-employed max (816K) at 20% rate', () => {
    const saving = calculateIdecoTaxSaving(816_000, 0.20);
    expect(saving).toBe(816_000 * 0.20 + 816_000 * 0.10);
  });
});

describe('calculateNisaTaxSaving', () => {
  it('calculates 20.315% tax saving on returns', () => {
    const saving = calculateNisaTaxSaving(1_000_000);
    expect(saving).toBe(Math.floor(1_000_000 * 0.20315));
  });

  it('returns 0 for zero returns', () => {
    expect(calculateNisaTaxSaving(0)).toBe(0);
  });

  it('larger returns = larger saving', () => {
    const small = calculateNisaTaxSaving(500_000);
    const large = calculateNisaTaxSaving(5_000_000);
    expect(large).toBeGreaterThan(small);
  });
});
