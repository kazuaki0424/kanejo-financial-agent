import { describe, it, expect } from 'vitest';

// Extract tier determination logic (same as in save-profile.ts)
function determineTier(annualIncome: number): 'basic' | 'middle' | 'high_end' {
  if (annualIncome >= 15_000_000) return 'high_end';
  if (annualIncome >= 5_000_000) return 'middle';
  return 'basic';
}

describe('determineTier', () => {
  it('returns basic for 0 income', () => {
    expect(determineTier(0)).toBe('basic');
  });

  it('returns basic for income under 5M', () => {
    expect(determineTier(3_000_000)).toBe('basic');
    expect(determineTier(4_999_999)).toBe('basic');
  });

  it('returns middle for income at 5M boundary', () => {
    expect(determineTier(5_000_000)).toBe('middle');
  });

  it('returns middle for income between 5M and 15M', () => {
    expect(determineTier(8_000_000)).toBe('middle');
    expect(determineTier(14_999_999)).toBe('middle');
  });

  it('returns high_end for income at 15M boundary', () => {
    expect(determineTier(15_000_000)).toBe('high_end');
  });

  it('returns high_end for income above 15M', () => {
    expect(determineTier(20_000_000)).toBe('high_end');
    expect(determineTier(100_000_000)).toBe('high_end');
  });
});
