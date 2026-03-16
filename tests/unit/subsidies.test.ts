import { describe, it, expect } from 'vitest';
import { matchSubsidies, SUBSIDIES, type MatchProfile } from '@/lib/constants/subsidies';

function makeProfile(overrides: Partial<MatchProfile> = {}): MatchProfile {
  return {
    age: 35,
    annualIncome: 6_000_000,
    prefecture: '東京都',
    maritalStatus: 'married',
    dependents: 1,
    occupation: 'employee',
    hasChildren: true,
    ...overrides,
  };
}

describe('matchSubsidies', () => {
  it('returns results for a typical family profile', () => {
    const results = matchSubsidies(makeProfile());
    expect(results.length).toBeGreaterThan(0);
  });

  it('includes child-related subsidies for parents', () => {
    const results = matchSubsidies(makeProfile({ hasChildren: true, dependents: 2 }));
    const childSubsidies = results.filter((r) => r.subsidy.category === 'child');
    expect(childSubsidies.length).toBeGreaterThan(0);
  });

  it('has fewer child full-matches for childless profiles', () => {
    const withChildren = matchSubsidies(makeProfile({ hasChildren: true, dependents: 2 }));
    const withoutChildren = matchSubsidies(makeProfile({ hasChildren: false, dependents: 0 }));

    const withCount = withChildren.filter((r) => r.subsidy.category === 'child' && r.matchScore === 1).length;
    const withoutCount = withoutChildren.filter((r) => r.subsidy.category === 'child' && r.matchScore === 1).length;
    expect(withCount).toBeGreaterThan(withoutCount);
  });

  it('includes employment subsidies for employees', () => {
    const results = matchSubsidies(makeProfile({ occupation: 'employee' }));
    const training = results.find((r) => r.subsidy.id === 'employment-adjustment');
    expect(training).toBeDefined();
    expect(training?.matchScore).toBe(1);
  });

  it('includes self-employed subsidies for self_employed', () => {
    const results = matchSubsidies(makeProfile({ occupation: 'self_employed' }));
    const startup = results.find((r) => r.subsidy.id === 'startup-subsidy');
    expect(startup).toBeDefined();
    expect(startup?.matchScore).toBe(1);
  });

  it('excludes self-employed subsidies for employees', () => {
    const results = matchSubsidies(makeProfile({ occupation: 'employee' }));
    const startup = results.find((r) => r.subsidy.id === 'startup-subsidy');
    // Should not fully match
    expect(startup?.matchScore ?? 0).toBeLessThan(1);
  });

  it('includes iDeCo for users under 65', () => {
    const results = matchSubsidies(makeProfile({ age: 40 }));
    const ideco = results.find((r) => r.subsidy.id === 'ideco-deduction');
    expect(ideco).toBeDefined();
    expect(ideco?.matchScore).toBe(1);
  });

  it('excludes iDeCo for users 65+', () => {
    const results = matchSubsidies(makeProfile({ age: 66 }));
    const ideco = results.find((r) => r.subsidy.id === 'ideco-deduction');
    expect(ideco).toBeUndefined();
  });

  it('includes housing loan deduction for income under 20M', () => {
    const results = matchSubsidies(makeProfile({ annualIncome: 15_000_000 }));
    const housing = results.find((r) => r.subsidy.id === 'housing-loan-deduction');
    expect(housing?.matchScore).toBe(1);
  });

  it('excludes housing loan deduction for income over 20M', () => {
    const results = matchSubsidies(makeProfile({ annualIncome: 25_000_000 }));
    const housing = results.find((r) => r.subsidy.id === 'housing-loan-deduction');
    expect(housing?.matchScore ?? 0).toBeLessThan(1);
  });

  it('includes education support for low income families', () => {
    const results = matchSubsidies(makeProfile({
      annualIncome: 3_000_000,
      hasChildren: true,
      dependents: 1,
    }));
    const education = results.find((r) => r.subsidy.id === 'tuition-free');
    expect(education?.matchScore).toBe(1);
  });

  it('returns results sorted by match score descending', () => {
    const results = matchSubsidies(makeProfile());
    for (let i = 1; i < results.length; i++) {
      expect(results[i].matchScore).toBeLessThanOrEqual(results[i - 1].matchScore);
    }
  });

  it('all subsidies have valid category', () => {
    for (const s of SUBSIDIES) {
      expect(['child', 'housing', 'medical', 'education', 'employment', 'tax', 'other']).toContain(s.category);
    }
  });

  it('matchedConditions + unmatchedConditions equals total conditions', () => {
    const results = matchSubsidies(makeProfile());
    for (const r of results) {
      expect(r.matchedConditions.length + r.unmatchedConditions.length).toBe(r.subsidy.conditions.length);
    }
  });
});
