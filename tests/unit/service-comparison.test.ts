import { describe, it, expect } from 'vitest';
import { compareServices, type UserPreferences } from '@/lib/utils/service-comparison';
import { ALL_SERVICES, getServicesByCategory } from '@/lib/constants/financial-services';

function makePrefs(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    annualIncome: 6_000_000,
    monthlySpending: 200_000,
    age: 30,
    priorities: ['cost', 'rewards'],
    ...overrides,
  };
}

describe('compareServices', () => {
  describe('credit cards', () => {
    it('returns scored credit cards sorted by score', () => {
      const result = compareServices('credit_card', makePrefs());
      expect(result.services.length).toBeGreaterThan(0);
      for (let i = 1; i < result.services.length; i++) {
        expect(result.services[i].score).toBeLessThanOrEqual(result.services[i - 1].score);
      }
    });

    it('has a top pick', () => {
      const result = compareServices('credit_card', makePrefs());
      expect(result.topPick).not.toBeNull();
      expect(result.topPick?.isRecommended).toBe(true);
    });

    it('penalizes JCB CARD W for users over 39', () => {
      const young = compareServices('credit_card', makePrefs({ age: 25 }));
      const old = compareServices('credit_card', makePrefs({ age: 45 }));
      const jcbYoung = young.services.find((s) => s.service.id === 'cc-jcbw');
      const jcbOld = old.services.find((s) => s.service.id === 'cc-jcbw');
      expect(jcbOld!.score).toBeLessThan(jcbYoung!.score);
    });

    it('calculates annual benefit from spending', () => {
      const result = compareServices('credit_card', makePrefs({ monthlySpending: 300_000 }));
      const rakuten = result.services.find((s) => s.service.id === 'cc-rakuten');
      // 300K × 12 × 1% = 36,000
      expect(rakuten!.annualBenefit).toBe(36_000);
    });

    it('cost priority favors free cards', () => {
      const result = compareServices('credit_card', makePrefs({ priorities: ['cost'] }));
      const freeCards = result.services.filter((s) => s.annualCost === 0);
      const paidCards = result.services.filter((s) => s.annualCost > 0);
      if (freeCards.length > 0 && paidCards.length > 0) {
        expect(freeCards[0].score).toBeGreaterThan(paidCards[paidCards.length - 1].score);
      }
    });
  });

  describe('telecom', () => {
    it('returns telecom services', () => {
      const result = compareServices('telecom', makePrefs());
      expect(result.services.length).toBeGreaterThan(0);
    });

    it('cost priority ranks cheaper plans higher', () => {
      const result = compareServices('telecom', makePrefs({ priorities: ['cost'] }));
      // Cheapest should be near the top
      const cheapest = [...result.services].sort((a, b) => a.annualCost - b.annualCost)[0];
      expect(cheapest.score).toBeGreaterThan(50);
    });
  });

  describe('insurance', () => {
    it('returns insurance services', () => {
      const result = compareServices('insurance', makePrefs());
      expect(result.services.length).toBeGreaterThan(0);
    });
  });

  describe('utility', () => {
    it('returns utility services', () => {
      const result = compareServices('utility', makePrefs());
      expect(result.services.length).toBeGreaterThan(0);
    });
  });

  describe('potential savings', () => {
    it('calculates savings when switching from expensive to cheap', () => {
      const result = compareServices('telecom', makePrefs(), 'tel-ahamo');
      // If top pick is cheaper than ahamo, savings > 0
      if (result.topPick && result.topPick.service.id !== 'tel-ahamo') {
        expect(result.potentialSavings).toBeGreaterThan(0);
      }
    });

    it('zero savings when already using top pick', () => {
      const result = compareServices('telecom', makePrefs());
      if (result.topPick) {
        const sameResult = compareServices('telecom', makePrefs(), result.topPick.service.id);
        expect(sameResult.potentialSavings).toBe(0);
      }
    });
  });

  describe('data integrity', () => {
    it('all services have valid category', () => {
      for (const s of ALL_SERVICES) {
        expect(['credit_card', 'insurance', 'loan', 'utility', 'telecom']).toContain(s.category);
      }
    });

    it('all services have non-empty name and provider', () => {
      for (const s of ALL_SERVICES) {
        expect(s.name.length).toBeGreaterThan(0);
        expect(s.provider.length).toBeGreaterThan(0);
      }
    });

    it('all services have features', () => {
      for (const s of ALL_SERVICES) {
        expect(s.features.length).toBeGreaterThan(0);
      }
    });

    it('getServicesByCategory returns correct category', () => {
      const cards = getServicesByCategory('credit_card');
      for (const c of cards) {
        expect(c.category).toBe('credit_card');
      }
    });

    it('scores are between 0 and 100', () => {
      const result = compareServices('credit_card', makePrefs());
      for (const s of result.services) {
        expect(s.score).toBeGreaterThanOrEqual(0);
        expect(s.score).toBeLessThanOrEqual(100);
      }
    });
  });
});
