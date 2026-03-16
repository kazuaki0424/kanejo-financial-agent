import { describe, it, expect } from 'vitest';
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
} from '@/lib/validations/profile';

describe('step1Schema (基本情報)', () => {
  const validData = {
    birthDate: '1990-01-15',
    gender: 'male',
    prefecture: '東京都',
    maritalStatus: 'single',
    dependents: '0',
  };

  it('accepts valid data', () => {
    const result = step1Schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('accepts null gender', () => {
    const result = step1Schema.safeParse({ ...validData, gender: null });
    expect(result.success).toBe(true);
  });

  it('rejects empty birthDate', () => {
    const result = step1Schema.safeParse({ ...validData, birthDate: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid prefecture', () => {
    const result = step1Schema.safeParse({ ...validData, prefecture: 'InvalidPref' });
    expect(result.success).toBe(false);
  });

  it('rejects empty maritalStatus', () => {
    const result = step1Schema.safeParse({ ...validData, maritalStatus: '' });
    expect(result.success).toBe(false);
  });

  it('rejects negative dependents', () => {
    const result = step1Schema.safeParse({ ...validData, dependents: '-1' });
    expect(result.success).toBe(false);
  });

  it('rejects dependents over 20', () => {
    const result = step1Schema.safeParse({ ...validData, dependents: '21' });
    expect(result.success).toBe(false);
  });

  it('coerces string dependents to number', () => {
    const result = step1Schema.safeParse({ ...validData, dependents: '3' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dependents).toBe(3);
    }
  });
});

describe('step2Schema (収入情報)', () => {
  it('accepts valid occupation and income', () => {
    const result = step2Schema.safeParse({
      occupation: 'employee',
      annualIncome: '5000000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.annualIncome).toBe(5000000);
    }
  });

  it('rejects invalid occupation', () => {
    const result = step2Schema.safeParse({
      occupation: 'ceo',
      annualIncome: '5000000',
    });
    expect(result.success).toBe(false);
  });

  it('accepts zero income', () => {
    const result = step2Schema.safeParse({
      occupation: 'student',
      annualIncome: '0',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative income', () => {
    const result = step2Schema.safeParse({
      occupation: 'employee',
      annualIncome: '-100',
    });
    expect(result.success).toBe(false);
  });

  it('all valid occupations are accepted', () => {
    const occupations = ['employee', 'self_employed', 'part_time', 'retired', 'student', 'other'];
    for (const occ of occupations) {
      const result = step2Schema.safeParse({ occupation: occ, annualIncome: '0' });
      expect(result.success, `occupation '${occ}' should be valid`).toBe(true);
    }
  });
});

describe('step3Schema (支出概算)', () => {
  it('accepts all zero values', () => {
    const result = step3Schema.safeParse({
      housing: '0', food: '0', transportation: '0', utilities: '0',
      communication: '0', insurance: '0', entertainment: '0', other: '0',
    });
    expect(result.success).toBe(true);
  });

  it('coerces string amounts to numbers', () => {
    const result = step3Schema.safeParse({
      housing: '120000', food: '50000', transportation: '10000', utilities: '15000',
      communication: '8000', insurance: '10000', entertainment: '30000', other: '20000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.housing).toBe(120000);
      expect(result.data.food).toBe(50000);
    }
  });

  it('uses default 0 for missing fields', () => {
    const result = step3Schema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.housing).toBe(0);
    }
  });
});

describe('step4Schema (資産・負債)', () => {
  it('accepts all zero values', () => {
    const result = step4Schema.safeParse({
      cash: '0', stocks: '0', mutualFunds: '0', crypto: '0',
      insuranceValue: '0', otherAssets: '0',
      mortgage: '0', carLoan: '0', studentLoan: '0', creditCard: '0', otherLiabilities: '0',
    });
    expect(result.success).toBe(true);
  });

  it('coerces large asset values', () => {
    const result = step4Schema.safeParse({
      cash: '50000000', stocks: '30000000', mutualFunds: '0', crypto: '0',
      insuranceValue: '0', otherAssets: '0',
      mortgage: '25000000', carLoan: '0', studentLoan: '0', creditCard: '0', otherLiabilities: '0',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cash).toBe(50000000);
      expect(result.data.mortgage).toBe(25000000);
    }
  });
});

describe('step5Schema (目標設定)', () => {
  it('accepts valid goals and risk tolerance', () => {
    const result = step5Schema.safeParse({
      financialGoals: 'retirement,tax_saving,investment',
      riskTolerance: 'moderate',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.financialGoals).toEqual(['retirement', 'tax_saving', 'investment']);
    }
  });

  it('rejects empty goals', () => {
    const result = step5Schema.safeParse({
      financialGoals: '',
      riskTolerance: 'moderate',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid risk tolerance', () => {
    const result = step5Schema.safeParse({
      financialGoals: 'retirement',
      riskTolerance: 'yolo',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all risk tolerance levels', () => {
    for (const rt of ['conservative', 'moderate', 'aggressive']) {
      const result = step5Schema.safeParse({
        financialGoals: 'retirement',
        riskTolerance: rt,
      });
      expect(result.success, `riskTolerance '${rt}' should be valid`).toBe(true);
    }
  });

  it('accepts single goal', () => {
    const result = step5Schema.safeParse({
      financialGoals: 'housing',
      riskTolerance: 'conservative',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.financialGoals).toEqual(['housing']);
    }
  });
});
