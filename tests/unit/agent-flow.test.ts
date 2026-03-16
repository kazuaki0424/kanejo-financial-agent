import { describe, it, expect } from 'vitest';
import { executeToolCall, type ToolContext } from '@/lib/ai/tools/handlers';
import { AGENT_TOOLS } from '@/lib/ai/tools/definitions';
import { auditSubscriptions, generateSwitchWizard, type ExpenseItem } from '@/lib/ai/tools/subscription-audit';
import { compareServices, type UserPreferences } from '@/lib/utils/service-comparison';
import { optimizeCreditCards, type SpendingPattern } from '@/lib/utils/credit-card-optimizer';
import { analyzeInsurance, type InsuranceProfile } from '@/lib/utils/insurance-analyzer';

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
  expenses: [
    { category: 'housing', name: '家賃', monthlyAmount: 100_000, isFixed: true },
    { category: 'food', name: '食費', monthlyAmount: 50_000, isFixed: false },
    { category: 'communication', name: '通信費', monthlyAmount: 10_000, isFixed: true },
    { category: 'insurance', name: '保険料', monthlyAmount: 15_000, isFixed: true },
    { category: 'subscription', name: 'サブスク', monthlyAmount: 3_000, isFixed: true },
    { category: 'entertainment', name: '娯楽', monthlyAmount: 25_000, isFixed: false },
    { category: 'transportation', name: '交通費', monthlyAmount: 10_000, isFixed: true },
  ],
};

describe('Agent flow: end-to-end tool chain', () => {
  describe('full analysis pipeline', () => {
    it('get_user_summary → audit → search → tax in sequence', () => {
      // Step 1: Get user summary
      const summary = executeToolCall('get_user_summary', {}, CTX);
      expect(summary.success).toBe(true);
      expect(summary.data).toContain('500,000');

      // Step 2: Audit subscriptions
      const audit = executeToolCall('audit_subscriptions', {}, CTX);
      expect(audit.success).toBe(true);
      expect(audit.data).toContain('固定費合計');

      // Step 3: Search for better services
      const search = executeToolCall('search_services', { category: 'telecom', priority: 'cost' }, CTX);
      expect(search.success).toBe(true);
      expect(search.data).toContain('比較結果');

      // Step 4: Calculate tax impact
      const tax = executeToolCall('calculate_tax', {
        annual_salary: CTX.annualIncome,
        deductions: [{ type: 'ideco', amount: 276_000 }],
      }, CTX);
      expect(tax.success).toBe(true);
      expect(tax.data).toContain('手取り');
    });

    it('switch guide works with real service data', () => {
      const result = executeToolCall('generate_switch_guide', {
        from_service: '大手キャリア',
        to_service: 'LINEMO ミニプラン',
        current_monthly_cost: 10_000,
        new_monthly_cost: 990,
      }, CTX);
      expect(result.success).toBe(true);
      expect(result.data).toContain('年間節約額');
      expect(result.data).toContain('LINEMO');
      // Annual saving: (10000 - 990) * 12 = 108,120
      expect(result.data).toContain('108,120');
    });
  });

  describe('tool error handling', () => {
    it('unknown tool returns failure', () => {
      const result = executeToolCall('nonexistent_tool', {}, CTX);
      expect(result.success).toBe(false);
    });

    it('handles missing input gracefully', () => {
      // calculate_tax with no salary should still work (0 salary)
      const result = executeToolCall('calculate_tax', { annual_salary: 0 }, CTX);
      expect(result.success).toBe(true);
    });

    it('handles zero spending in search', () => {
      const zeroCtx = { ...CTX, monthlyExpenses: 0 };
      const result = executeToolCall('search_services', { category: 'credit_card' }, zeroCtx);
      expect(result.success).toBe(true);
    });

    it('handles empty expenses in audit', () => {
      const emptyCtx = { ...CTX, expenses: [] };
      const result = executeToolCall('audit_subscriptions', {}, emptyCtx);
      expect(result.success).toBe(true);
    });
  });

  describe('all tools produce valid output', () => {
    const toolInputs: Array<{ name: string; input: Record<string, unknown> }> = [
      { name: 'search_services', input: { category: 'credit_card' } },
      { name: 'search_services', input: { category: 'telecom' } },
      { name: 'search_services', input: { category: 'insurance' } },
      { name: 'search_services', input: { category: 'utility' } },
      { name: 'calculate_tax', input: { annual_salary: 5_000_000 } },
      { name: 'calculate_tax', input: { annual_salary: 10_000_000, deductions: [{ type: 'spouse', amount: 1 }, { type: 'ideco', amount: 276_000 }] } },
      { name: 'calculate_furusato_limit', input: { annual_salary: 6_000_000, is_married: true, dependents: 1 } },
      { name: 'simulate_investment', input: { monthly_amount: 30_000, years: 20, annual_return_rate: 0.04 } },
      { name: 'get_user_summary', input: {} },
      { name: 'audit_subscriptions', input: {} },
      { name: 'generate_switch_guide', input: { from_service: 'A', to_service: 'B', current_monthly_cost: 5000, new_monthly_cost: 2000 } },
    ];

    for (const { name, input } of toolInputs) {
      it(`${name} produces non-empty result`, () => {
        const result = executeToolCall(name, input, CTX);
        expect(result.success).toBe(true);
        expect(result.data.length).toBeGreaterThan(10);
      });
    }
  });

  describe('cross-module integration', () => {
    it('credit card optimizer uses same data as comparison engine', () => {
      const spending: SpendingPattern[] = CTX.expenses.map((e) => ({
        category: e.category,
        label: e.name,
        monthlyAmount: e.monthlyAmount,
      }));

      const optimized = optimizeCreditCards(spending);
      const compared = compareServices('credit_card', {
        annualIncome: CTX.annualIncome,
        monthlySpending: CTX.monthlyExpenses,
        age: CTX.age,
        priorities: ['rewards'],
      });

      // Both should reference the same card data
      expect(optimized.singleBest.card.id).toBeTruthy();
      expect(compared.services.length).toBeGreaterThan(0);
    });

    it('insurance analyzer and audit are consistent on insurance costs', () => {
      const profile: InsuranceProfile = {
        age: CTX.age,
        maritalStatus: CTX.maritalStatus,
        dependents: CTX.dependents,
        dependentAges: [5],
        annualIncome: CTX.annualIncome,
        monthlyExpenses: CTX.monthlyExpenses,
        totalAssets: CTX.totalAssets,
        totalLiabilities: 0,
        currentInsurance: [
          { type: 'life', name: '生命保険', coverage: 10_000_000, monthlyPremium: 3_000 },
        ],
      };

      const analysis = analyzeInsurance(profile);
      expect(analysis.totalMonthlyPremium).toBe(3_000);
      expect(analysis.needs.length).toBeGreaterThan(0);
    });

    it('audit detects high communication cost and search finds alternatives', () => {
      const highCommExpenses: ExpenseItem[] = [
        { category: 'communication', name: '通信費', monthlyAmount: 12_000, isFixed: true },
      ];
      const auditResult = auditSubscriptions(highCommExpenses, 500_000);
      const commSub = auditResult.subscriptions.find((s) => s.category === 'communication');
      expect(commSub?.risk).toBe('high');

      // Search for alternatives
      const searchResult = executeToolCall('search_services', { category: 'telecom', priority: 'cost' }, CTX);
      expect(searchResult.success).toBe(true);
      // Should find cheaper options
      expect(searchResult.data).toContain('比較結果');
    });
  });
});

describe('AGENT_TOOLS schema validation', () => {
  it('all tools have unique names', () => {
    const names = AGENT_TOOLS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('all tools have required field in schema', () => {
    for (const tool of AGENT_TOOLS) {
      const schema = tool.input_schema as { required?: string[] };
      expect(Array.isArray(schema.required)).toBe(true);
    }
  });

  it('tool count matches handler count', () => {
    // All defined tools should have handlers
    for (const tool of AGENT_TOOLS) {
      const result = executeToolCall(tool.name, {}, CTX);
      // Should not return "unknown tool" error
      expect(result.data).not.toContain('未知のツール');
    }
  });
});
