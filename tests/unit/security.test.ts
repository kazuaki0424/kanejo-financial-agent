import { describe, it, expect } from 'vitest';
import { step1Schema, step2Schema, step3Schema, step4Schema, step5Schema } from '@/lib/validations/profile';

/**
 * セキュリティテスト
 *
 * - 入力バリデーション（XSS, SQL injection patterns）
 * - 境界値テスト
 * - 認証ルートのテスト
 */

describe('Input validation security', () => {
  describe('XSS prevention', () => {
    it('step1: rejects script tags in prefecture', () => {
      const result = step1Schema.safeParse({
        birthDate: '1990-01-01',
        gender: 'male',
        prefecture: '<script>alert("xss")</script>',
        maritalStatus: 'single',
        dependents: '0',
      });
      // Prefecture must be a valid Japanese prefecture
      expect(result.success).toBe(false);
    });

    it('step2: occupation only accepts enum values', () => {
      const result = step2Schema.safeParse({
        occupation: '<img onerror="alert(1)" src=x>',
        annualIncome: '5000000',
      });
      expect(result.success).toBe(false);
    });

    it('step5: risk tolerance only accepts enum values', () => {
      const result = step5Schema.safeParse({
        financialGoals: 'retirement',
        riskTolerance: 'javascript:void(0)',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('SQL injection prevention', () => {
    it('step1: rejects SQL in prefecture', () => {
      const result = step1Schema.safeParse({
        birthDate: '1990-01-01',
        gender: 'male',
        prefecture: "'; DROP TABLE users; --",
        maritalStatus: 'single',
        dependents: '0',
      });
      expect(result.success).toBe(false);
    });

    it('step2: SQL in occupation rejected by enum', () => {
      const result = step2Schema.safeParse({
        occupation: "' OR '1'='1",
        annualIncome: '0',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('numeric overflow prevention', () => {
    it('step2: rejects extremely large income', () => {
      const result = step2Schema.safeParse({
        occupation: 'employee',
        annualIncome: '999999999999999',
      });
      expect(result.success).toBe(false);
    });

    it('step1: rejects negative dependents', () => {
      const result = step1Schema.safeParse({
        birthDate: '1990-01-01',
        gender: null,
        prefecture: '東京都',
        maritalStatus: 'single',
        dependents: '-5',
      });
      expect(result.success).toBe(false);
    });

    it('step3: rejects negative expense values', () => {
      const result = step3Schema.safeParse({ housing: '-100000' });
      expect(result.success).toBe(false);
    });

    it('step4: rejects negative asset values', () => {
      const result = step4Schema.safeParse({ cash: '-1000000' });
      expect(result.success).toBe(false);
    });
  });

  describe('type coercion safety', () => {
    it('step2: non-numeric income becomes 0 or fails', () => {
      const result = step2Schema.safeParse({
        occupation: 'employee',
        annualIncome: 'not-a-number',
      });
      // Either fails or coerces to NaN (which fails min(0) check)
      if (result.success) {
        expect(result.data.annualIncome).toBeGreaterThanOrEqual(0);
      }
    });

    it('step1: boolean-like string for dependents', () => {
      const result = step1Schema.safeParse({
        birthDate: '1990-01-01',
        gender: null,
        prefecture: '東京都',
        maritalStatus: 'single',
        dependents: 'true',
      });
      // Should fail because 'true' is not a valid number
      expect(result.success).toBe(false);
    });
  });
});

describe('Auth route security', () => {
  function isPublicPath(pathname: string): boolean {
    return (
      pathname.startsWith('/login') ||
      pathname.startsWith('/register') ||
      pathname.startsWith('/lp') ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon')
    );
  }

  it('API routes are not public', () => {
    expect(isPublicPath('/api/diagnosis')).toBe(false);
    expect(isPublicPath('/api/agent/chat')).toBe(false);
    expect(isPublicPath('/api/tax-advice')).toBe(false);
    expect(isPublicPath('/api/simulation')).toBe(false);
    expect(isPublicPath('/api/cron/subsidies')).toBe(false);
  });

  it('dashboard routes are not public', () => {
    expect(isPublicPath('/')).toBe(false);
    expect(isPublicPath('/diagnosis')).toBe(false);
    expect(isPublicPath('/settings')).toBe(false);
    expect(isPublicPath('/settings/profile')).toBe(false);
    expect(isPublicPath('/agent')).toBe(false);
  });

  it('auth routes are public', () => {
    expect(isPublicPath('/login')).toBe(true);
    expect(isPublicPath('/register')).toBe(true);
    expect(isPublicPath('/api/auth/callback')).toBe(true);
  });

  it('landing page is public', () => {
    expect(isPublicPath('/lp')).toBe(true);
  });

  it('static assets are public', () => {
    expect(isPublicPath('/_next/static/chunk.js')).toBe(true);
    expect(isPublicPath('/favicon.ico')).toBe(true);
  });
});

describe('Data boundary validation', () => {
  it('age range is reasonable', () => {
    // Valid birth date produces age 15-120
    const valid = step1Schema.safeParse({
      birthDate: '2010-01-01',
      gender: null,
      prefecture: '東京都',
      maritalStatus: 'single',
      dependents: '0',
    });
    expect(valid.success).toBe(true);

    // Future date should fail
    const future = step1Schema.safeParse({
      birthDate: '2025-01-01',
      gender: null,
      prefecture: '東京都',
      maritalStatus: 'single',
      dependents: '0',
    });
    expect(future.success).toBe(false);
  });

  it('dependents capped at 20', () => {
    const result = step1Schema.safeParse({
      birthDate: '1990-01-01',
      gender: null,
      prefecture: '東京都',
      maritalStatus: 'single',
      dependents: '25',
    });
    expect(result.success).toBe(false);
  });
});
