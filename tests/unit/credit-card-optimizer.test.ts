import { describe, it, expect } from 'vitest';
import { optimizeCreditCards, type SpendingPattern } from '@/lib/utils/credit-card-optimizer';

const TYPICAL_SPENDING: SpendingPattern[] = [
  { category: 'food', label: '食費', monthlyAmount: 50_000 },
  { category: 'transportation', label: '交通費', monthlyAmount: 10_000 },
  { category: 'communication', label: '通信費', monthlyAmount: 8_000 },
  { category: 'entertainment', label: '娯楽', monthlyAmount: 30_000 },
  { category: 'subscription', label: 'サブスク', monthlyAmount: 5_000 },
  { category: 'clothing', label: '被服費', monthlyAmount: 15_000 },
  { category: 'other', label: 'その他', monthlyAmount: 20_000 },
];

describe('optimizeCreditCards', () => {
  it('returns a result with valid structure', () => {
    const result = optimizeCreditCards(TYPICAL_SPENDING);
    expect(result.singleBest).toBeDefined();
    expect(result.singleBest.card).toBeDefined();
    expect(result.singleAnnualReward).toBeGreaterThan(0);
    expect(result.spendingSummary.totalMonthly).toBe(138_000);
    expect(result.spendingSummary.totalAnnual).toBe(138_000 * 12);
  });

  it('single best has positive net benefit for free cards', () => {
    const result = optimizeCreditCards(TYPICAL_SPENDING);
    if (result.singleBest.annualFee === 0) {
      expect(result.singleBest.netBenefit).toBeGreaterThan(0);
    }
  });

  it('combo is at least as good as single', () => {
    const result = optimizeCreditCards(TYPICAL_SPENDING);
    expect(result.comboNetBenefit).toBeGreaterThanOrEqual(result.singleBest.netBenefit);
  });

  it('improvement over single is non-negative', () => {
    const result = optimizeCreditCards(TYPICAL_SPENDING);
    expect(result.improvementOverSingle).toBeGreaterThanOrEqual(0);
  });

  it('all categories are assigned in combo', () => {
    const result = optimizeCreditCards(TYPICAL_SPENDING);
    const allAssigned = result.comboBest.flatMap((r) => r.assignedCategories);
    expect(allAssigned.length).toBe(TYPICAL_SPENDING.length);
  });

  it('higher spending = higher rewards', () => {
    const low = optimizeCreditCards([{ category: 'food', label: '食費', monthlyAmount: 30_000 }]);
    const high = optimizeCreditCards([{ category: 'food', label: '食費', monthlyAmount: 100_000 }]);
    expect(high.singleAnnualReward).toBeGreaterThan(low.singleAnnualReward);
  });

  it('effective rate is between 0 and 10%', () => {
    const result = optimizeCreditCards(TYPICAL_SPENDING);
    expect(result.spendingSummary.effectiveRate).toBeGreaterThan(0);
    expect(result.spendingSummary.effectiveRate).toBeLessThan(0.10);
  });

  it('handles food-heavy spending (三井住友 should rank high)', () => {
    const foodHeavy: SpendingPattern[] = [
      { category: 'food', label: '食費', monthlyAmount: 100_000 },
      { category: 'other', label: 'その他', monthlyAmount: 10_000 },
    ];
    const result = optimizeCreditCards(foodHeavy);
    // 三井住友NL has 7% on food (convenience stores)
    const hasMitsui = result.comboBest.some((r) => r.card.id === 'cc-three-mitsui');
    expect(hasMitsui).toBe(true);
  });

  it('handles empty spending', () => {
    const result = optimizeCreditCards([]);
    expect(result.spendingSummary.totalMonthly).toBe(0);
    expect(result.singleAnnualReward).toBe(0);
  });

  it('handles single category spending', () => {
    const result = optimizeCreditCards([
      { category: 'subscription', label: 'サブスク', monthlyAmount: 20_000 },
    ]);
    expect(result.singleBest).toBeDefined();
    expect(result.singleAnnualReward).toBeGreaterThan(0);
  });
});
