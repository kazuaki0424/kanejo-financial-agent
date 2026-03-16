import { describe, it, expect } from 'vitest';
import { executeToolCall, type ToolContext } from '@/lib/ai/tools/handlers';
import { AGENT_TOOLS } from '@/lib/ai/tools/definitions';

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
    { category: 'communication', name: '通信費', monthlyAmount: 8_000, isFixed: true },
    { category: 'food', name: '食費', monthlyAmount: 50_000, isFixed: false },
  ],
};

describe('AGENT_TOOLS definitions', () => {
  it('has 7 tools defined', () => {
    expect(AGENT_TOOLS).toHaveLength(7);
  });

  it('all tools have name and description', () => {
    for (const tool of AGENT_TOOLS) {
      expect(tool.name.length).toBeGreaterThan(0);
      expect((tool.description ?? '').length).toBeGreaterThan(0);
    }
  });

  it('all tools have valid input schema', () => {
    for (const tool of AGENT_TOOLS) {
      expect(tool.input_schema.type).toBe('object');
    }
  });
});

describe('executeToolCall', () => {
  describe('search_services', () => {
    it('returns credit card results', () => {
      const result = executeToolCall('search_services', { category: 'credit_card', priority: 'cost' }, CTX);
      expect(result.success).toBe(true);
      expect(result.data).toContain('比較結果');
    });

    it('returns telecom results', () => {
      const result = executeToolCall('search_services', { category: 'telecom' }, CTX);
      expect(result.success).toBe(true);
      expect(result.data).toContain('比較結果');
    });
  });

  describe('calculate_tax', () => {
    it('calculates tax for given salary', () => {
      const result = executeToolCall('calculate_tax', { annual_salary: 6_000_000 }, CTX);
      expect(result.success).toBe(true);
      expect(result.data).toContain('税額計算結果');
      expect(result.data).toContain('手取り');
    });

    it('calculates tax with deductions', () => {
      const result = executeToolCall('calculate_tax', {
        annual_salary: 8_000_000,
        deductions: [{ type: 'ideco', amount: 276_000 }],
      }, CTX);
      expect(result.success).toBe(true);
      expect(result.data).toContain('手取り');
    });
  });

  describe('calculate_furusato_limit', () => {
    it('returns furusato limit', () => {
      const result = executeToolCall('calculate_furusato_limit', {
        annual_salary: 6_000_000,
        is_married: true,
        dependents: 1,
      }, CTX);
      expect(result.success).toBe(true);
      expect(result.data).toContain('ふるさと納税上限額');
      expect(result.data).toContain('¥2,000');
    });
  });

  describe('simulate_investment', () => {
    it('returns investment simulation', () => {
      const result = executeToolCall('simulate_investment', {
        monthly_amount: 30_000,
        years: 20,
        annual_return_rate: 0.05,
      }, CTX);
      expect(result.success).toBe(true);
      expect(result.data).toContain('積立投資シミュレーション');
      expect(result.data).toContain('最終評価額');
    });
  });

  describe('get_user_summary', () => {
    it('returns user summary from context', () => {
      const result = executeToolCall('get_user_summary', {}, CTX);
      expect(result.success).toBe(true);
      expect(result.data).toContain('ユーザーサマリー');
      expect(result.data).toContain('500,000');
      expect(result.data).toContain('72/100');
    });
  });

  describe('unknown tool', () => {
    it('returns error for unknown tool', () => {
      const result = executeToolCall('unknown_tool', {}, CTX);
      expect(result.success).toBe(false);
      expect(result.data).toContain('未知のツール');
    });
  });
});
