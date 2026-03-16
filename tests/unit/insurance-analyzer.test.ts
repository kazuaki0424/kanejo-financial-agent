import { describe, it, expect } from 'vitest';
import { analyzeInsurance, type InsuranceProfile, type CurrentInsurance } from '@/lib/utils/insurance-analyzer';

function makeProfile(overrides: Partial<InsuranceProfile> = {}): InsuranceProfile {
  return {
    age: 35,
    maritalStatus: 'married',
    dependents: 1,
    dependentAges: [5],
    annualIncome: 6_000_000,
    monthlyExpenses: 350_000,
    totalAssets: 5_000_000,
    totalLiabilities: 0,
    currentInsurance: [],
    ...overrides,
  };
}

describe('analyzeInsurance', () => {
  describe('life stage detection', () => {
    it('detects single_young', () => {
      const r = analyzeInsurance(makeProfile({ age: 28, maritalStatus: 'single', dependents: 0 }));
      expect(r.lifeStage).toBe('single_young');
    });

    it('detects single_mid', () => {
      const r = analyzeInsurance(makeProfile({ age: 42, maritalStatus: 'single', dependents: 0 }));
      expect(r.lifeStage).toBe('single_mid');
    });

    it('detects married_no_kids', () => {
      const r = analyzeInsurance(makeProfile({ maritalStatus: 'married', dependents: 0 }));
      expect(r.lifeStage).toBe('married_no_kids');
    });

    it('detects married_young_kids', () => {
      const r = analyzeInsurance(makeProfile({ dependents: 1, dependentAges: [3] }));
      expect(r.lifeStage).toBe('married_young_kids');
    });

    it('detects married_school_kids', () => {
      const r = analyzeInsurance(makeProfile({ dependents: 1, dependentAges: [12] }));
      expect(r.lifeStage).toBe('married_school_kids');
    });

    it('detects pre_retirement', () => {
      const r = analyzeInsurance(makeProfile({ age: 58 }));
      expect(r.lifeStage).toBe('pre_retirement');
    });

    it('detects retired', () => {
      const r = analyzeInsurance(makeProfile({ age: 68 }));
      expect(r.lifeStage).toBe('retired');
    });
  });

  describe('coverage needs', () => {
    it('families need higher life insurance than singles', () => {
      const single = analyzeInsurance(makeProfile({ maritalStatus: 'single', dependents: 0, dependentAges: [] }));
      const family = analyzeInsurance(makeProfile({ maritalStatus: 'married', dependents: 2, dependentAges: [3, 7] }));

      const singleLife = single.needs.find((n) => n.type === 'life');
      const familyLife = family.needs.find((n) => n.type === 'life');

      expect(familyLife!.requiredAmount).toBeGreaterThan(singleLife!.requiredAmount);
    });

    it('marks coverage as insufficient when gap is positive', () => {
      const r = analyzeInsurance(makeProfile());
      const life = r.needs.find((n) => n.type === 'life');
      // No current insurance = gap should be positive for family
      expect(life!.status).toBe('insufficient');
      expect(life!.gap).toBeGreaterThan(0);
    });

    it('marks coverage as sufficient or excessive with adequate insurance', () => {
      // First check what the actual need is, then match it
      const baseline = analyzeInsurance(makeProfile());
      const lifeNeed = baseline.needs.find((n) => n.type === 'life')!.requiredAmount;

      const insurance: CurrentInsurance[] = [
        { type: 'life', name: '定期保険', coverage: lifeNeed, monthlyPremium: 3_000 },
        { type: 'medical', name: '医療保険', coverage: 10_000_000, monthlyPremium: 2_000 },
      ];
      const r = analyzeInsurance(makeProfile({ currentInsurance: insurance }));
      const life = r.needs.find((n) => n.type === 'life');
      expect(['sufficient', 'excessive']).toContain(life!.status);
      expect(life!.gap).toBeLessThanOrEqual(1_000_000);
    });

    it('marks coverage as excessive when way over needed', () => {
      const insurance: CurrentInsurance[] = [
        { type: 'life', name: '高額保険', coverage: 200_000_000, monthlyPremium: 20_000 },
      ];
      const r = analyzeInsurance(makeProfile({
        maritalStatus: 'single',
        dependents: 0,
        dependentAges: [],
        currentInsurance: insurance,
      }));
      const life = r.needs.find((n) => n.type === 'life');
      expect(life!.status).toBe('excessive');
    });
  });

  describe('premium analysis', () => {
    it('calculates total monthly premium', () => {
      const insurance: CurrentInsurance[] = [
        { type: 'life', name: 'A', coverage: 10_000_000, monthlyPremium: 3_000 },
        { type: 'medical', name: 'B', coverage: 5_000_000, monthlyPremium: 2_000 },
      ];
      const r = analyzeInsurance(makeProfile({ currentInsurance: insurance }));
      expect(r.totalMonthlyPremium).toBe(5_000);
    });

    it('recommends ~7% of monthly income as budget', () => {
      const r = analyzeInsurance(makeProfile({ annualIncome: 6_000_000 }));
      expect(r.recommendedMonthlyBudget).toBe(35_000); // 500K * 0.07
    });

    it('flags high premium ratio', () => {
      const insurance: CurrentInsurance[] = [
        { type: 'life', name: 'A', coverage: 50_000_000, monthlyPremium: 80_000 },
      ];
      const r = analyzeInsurance(makeProfile({ currentInsurance: insurance }));
      expect(r.premiumRatio).toBeGreaterThan(0.10);
      expect(r.suggestions.some((s) => s.title.includes('割合'))).toBe(true);
    });
  });

  describe('suggestions', () => {
    it('suggests adding coverage when insufficient', () => {
      const r = analyzeInsurance(makeProfile());
      expect(r.suggestions.some((s) => s.title.includes('追加'))).toBe(true);
    });

    it('suggests reducing when excessive', () => {
      const insurance: CurrentInsurance[] = [
        { type: 'life', name: 'A', coverage: 200_000_000, monthlyPremium: 30_000 },
      ];
      const r = analyzeInsurance(makeProfile({
        maritalStatus: 'single', dependents: 0, dependentAges: [],
        currentInsurance: insurance,
      }));
      expect(r.suggestions.some((s) => s.title.includes('過剰'))).toBe(true);
    });

    it('suggestions are sorted by priority', () => {
      const r = analyzeInsurance(makeProfile());
      const order = { high: 0, medium: 1, low: 2 };
      for (let i = 1; i < r.suggestions.length; i++) {
        expect(order[r.suggestions[i].priority]).toBeGreaterThanOrEqual(order[r.suggestions[i - 1].priority]);
      }
    });
  });

  describe('overall score', () => {
    it('score is between 0 and 100', () => {
      const r = analyzeInsurance(makeProfile());
      expect(r.overallScore).toBeGreaterThanOrEqual(0);
      expect(r.overallScore).toBeLessThanOrEqual(100);
    });

    it('adequate coverage gets higher score', () => {
      const noInsurance = analyzeInsurance(makeProfile());
      const withInsurance = analyzeInsurance(makeProfile({
        currentInsurance: [
          { type: 'life', name: 'A', coverage: 30_000_000, monthlyPremium: 3_000 },
          { type: 'medical', name: 'B', coverage: 5_000_000, monthlyPremium: 2_000 },
        ],
      }));
      expect(withInsurance.overallScore).toBeGreaterThan(noInsurance.overallScore);
    });
  });
});
