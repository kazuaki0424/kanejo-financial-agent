import { describe, it, expect } from 'vitest';
import { auditSubscriptions, generateSwitchWizard, type ExpenseItem } from '@/lib/ai/tools/subscription-audit';
import { executeToolCall, type ToolContext } from '@/lib/ai/tools/handlers';

const EXPENSES: ExpenseItem[] = [
  { category: 'housing', name: '家賃', monthlyAmount: 120_000, isFixed: true },
  { category: 'communication', name: '通信費', monthlyAmount: 12_000, isFixed: true },
  { category: 'insurance', name: '保険料', monthlyAmount: 15_000, isFixed: true },
  { category: 'subscription', name: 'サブスク', monthlyAmount: 3_000, isFixed: true },
  { category: 'food', name: '食費', monthlyAmount: 50_000, isFixed: false },
  { category: 'entertainment', name: '娯楽', monthlyAmount: 20_000, isFixed: false },
];

const CTX: ToolContext = {
  annualIncome: 6_000_000,
  monthlyIncome: 500_000,
  monthlyExpenses: 350_000,
  totalAssets: 5_000_000,
  netWorth: 5_000_000,
  householdScore: 72,
  savingsRate: 30,
  age: 35,
  maritalStatus: 'married',
  dependents: 1,
  expenses: EXPENSES,
};

describe('auditSubscriptions', () => {
  it('separates fixed and variable expenses', () => {
    const result = auditSubscriptions(EXPENSES, 500_000);
    expect(result.totalFixed).toBe(150_000);
    expect(result.totalVariable).toBe(70_000);
  });

  it('identifies subscription items', () => {
    const result = auditSubscriptions(EXPENSES, 500_000);
    expect(result.subscriptions.length).toBeGreaterThan(0);
    expect(result.subscriptions.some((s) => s.category === 'communication')).toBe(true);
  });

  it('flags high-cost communication', () => {
    const result = auditSubscriptions(EXPENSES, 500_000);
    const comm = result.subscriptions.find((s) => s.category === 'communication');
    expect(comm?.risk).toBe('high');
  });

  it('generates fixed cost suggestions', () => {
    const result = auditSubscriptions(EXPENSES, 500_000);
    expect(result.fixedCostSuggestions.length).toBeGreaterThan(0);
    // Communication should be suggested for reduction
    expect(result.fixedCostSuggestions.some((s) => s.category === '通信費')).toBe(true);
  });

  it('calculates potential savings', () => {
    const result = auditSubscriptions(EXPENSES, 500_000);
    expect(result.totalPotentialSaving).toBeGreaterThan(0);
  });

  it('flags housing over 30% of income', () => {
    const expensive = [...EXPENSES];
    expensive[0] = { ...expensive[0], monthlyAmount: 200_000 }; // 40% of 500K
    const result = auditSubscriptions(expensive, 500_000);
    expect(result.fixedCostSuggestions.some((s) => s.category === '住居費')).toBe(true);
  });

  it('handles empty expenses', () => {
    const result = auditSubscriptions([], 500_000);
    expect(result.totalFixed).toBe(0);
    expect(result.subscriptions).toHaveLength(0);
  });
});

describe('generateSwitchWizard', () => {
  it('generates switch steps', () => {
    const wizard = generateSwitchWizard('大手キャリア', 'ahamo', 8_000, 2_970);
    expect(wizard.steps.length).toBeGreaterThanOrEqual(3);
    expect(wizard.annualSaving).toBe((8_000 - 2_970) * 12);
  });

  it('includes warnings', () => {
    const wizard = generateSwitchWizard('A', 'B', 5_000, 3_000);
    expect(wizard.warnings.length).toBeGreaterThan(0);
  });

  it('warns when new service is more expensive', () => {
    const wizard = generateSwitchWizard('A', 'B', 3_000, 5_000);
    expect(wizard.warnings.some((w) => w.includes('高くなります'))).toBe(true);
  });

  it('steps are ordered', () => {
    const wizard = generateSwitchWizard('A', 'B', 5_000, 2_000);
    for (let i = 0; i < wizard.steps.length; i++) {
      expect(wizard.steps[i].order).toBe(i + 1);
    }
  });
});

describe('Tool handler integration', () => {
  it('audit_subscriptions returns formatted result', () => {
    const result = executeToolCall('audit_subscriptions', {}, CTX);
    expect(result.success).toBe(true);
    expect(result.data).toContain('監査結果');
    expect(result.data).toContain('固定費合計');
  });

  it('generate_switch_guide returns formatted wizard', () => {
    const result = executeToolCall('generate_switch_guide', {
      from_service: '大手キャリア',
      to_service: 'ahamo',
      current_monthly_cost: 8_000,
      new_monthly_cost: 2_970,
    }, CTX);
    expect(result.success).toBe(true);
    expect(result.data).toContain('契約切替ガイド');
    expect(result.data).toContain('年間節約額');
  });
});
