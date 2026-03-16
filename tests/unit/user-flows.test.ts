import { describe, it, expect } from 'vitest';
import { step1Schema, step2Schema, step3Schema, step4Schema, step5Schema } from '@/lib/validations/profile';
import { calculateTax, calculateFurusatoLimit } from '@/lib/utils/calculations';
import { calculateHouseholdScore } from '@/lib/utils/household-score';
import { runSimulation, DEFAULT_PARAMS } from '@/lib/utils/cashflow-engine';
import { optimizeCreditCards } from '@/lib/utils/credit-card-optimizer';
import { analyzeInsurance } from '@/lib/utils/insurance-analyzer';
import { matchSubsidies } from '@/lib/constants/subsidies';
import { assessFilingNeed } from '@/lib/utils/tax-filing';
import { generateYearEndGuide } from '@/lib/utils/year-end-adjustment';
import { calculateTaxSavings } from '@/lib/utils/tax-savings';
import { generateAlerts } from '@/lib/utils/alert-engine';
import { executeToolCall } from '@/lib/ai/tools/handlers';
import { auditSubscriptions } from '@/lib/ai/tools/subscription-audit';

/**
 * 主要ユーザーフローの統合テスト
 *
 * 各フローは実際のユーザー操作をシミュレートし、
 * データが正しくパイプライン全体を通過することを検証する。
 */

// ============================================================
// Flow 1: 新規ユーザーオンボーディング
// ============================================================
describe('Flow 1: Onboarding → Profile Creation', () => {
  it('validates all 5 onboarding steps', () => {
    const s1 = step1Schema.safeParse({ birthDate: '1990-05-20', gender: 'male', prefecture: '東京都', maritalStatus: 'married', dependents: '1' });
    expect(s1.success).toBe(true);

    const s2 = step2Schema.safeParse({ occupation: 'employee', annualIncome: '7200000' });
    expect(s2.success).toBe(true);

    const s3 = step3Schema.safeParse({ housing: '120000', food: '60000', transportation: '15000', utilities: '12000', communication: '8000', insurance: '10000', entertainment: '30000', other: '20000' });
    expect(s3.success).toBe(true);

    const s4 = step4Schema.safeParse({ cash: '3000000', stocks: '2000000', mutualFunds: '1000000', crypto: '0', insuranceValue: '500000', otherAssets: '0', mortgage: '25000000', carLoan: '0', studentLoan: '0', creditCard: '0', otherLiabilities: '0' });
    expect(s4.success).toBe(true);

    const s5 = step5Schema.safeParse({ financialGoals: 'retirement,tax_saving,housing', riskTolerance: 'moderate' });
    expect(s5.success).toBe(true);
    if (s5.success) {
      expect(s5.data.financialGoals).toEqual(['retirement', 'tax_saving', 'housing']);
    }
  });
});

// ============================================================
// Flow 2: ダッシュボード表示
// ============================================================
describe('Flow 2: Dashboard Data Pipeline', () => {
  it('calculates household score from financial data', () => {
    const result = calculateHouseholdScore({
      monthlyIncome: 600_000,
      monthlyExpenses: 375_000,
      annualIncome: 7_200_000,
      totalLiabilities: 25_000_000,
      liquidAssets: 3_000_000,
      assetCategoryCount: 3,
      insuranceCoverage: 620_000,
      tier: 'middle',
    });

    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.grade).toMatch(/[SABCD]/);
    expect(result.breakdown.savingsMax + result.breakdown.debtMax + result.breakdown.diversityMax + result.breakdown.bufferMax + result.breakdown.insuranceMax).toBe(100);
  });
});

// ============================================================
// Flow 3: 節税シミュレーション
// ============================================================
describe('Flow 3: Tax Optimization Flow', () => {
  it('calculates tax → furusato → savings → filing in sequence', () => {
    const tax = calculateTax({ annualSalary: 7_200_000, deductions: [{ type: 'spouse', amount: 1 }, { type: 'dependent_general', amount: 1 }] });
    expect(tax.totalTax).toBeGreaterThan(0);
    expect(tax.takeHome).toBeGreaterThan(5_000_000);

    const furusato = calculateFurusatoLimit(7_200_000, [{ type: 'spouse', amount: 1 }, { type: 'dependent_general', amount: 1 }]);
    expect(furusato).toBeGreaterThan(30_000);

    const savings = calculateTaxSavings({ annualSalary: 7_200_000, occupation: 'employee', maritalStatus: 'married', dependents: 1, age: 35, currentDeductions: [] });
    expect(savings.totalPotentialSaving).toBeGreaterThan(0);
    expect(savings.items.length).toBeGreaterThanOrEqual(4);

    const filing = assessFilingNeed({ annualSalary: 7_200_000, occupation: 'employee', hasSideIncome: false, sideIncomeAmount: 0, hasMultipleEmployers: false, hasMedicalExpenses: false, medicalExpenseAmount: 0, hasHousingLoan: false, housingLoanFirstYear: false, hasFurusato: false, furusatoCount: 0, hasStockIncome: false, hasRentalIncome: false, leftJobMidYear: false });
    expect(filing.filingType).toBe('not_needed');

    const yearEnd = generateYearEndGuide({ annualSalary: 7_200_000, maritalStatus: 'married', spouseIncome: 500_000, dependents: 1, dependentAges: [5], lifeInsurancePremium: 50_000, earthquakeInsurancePremium: 0, housingLoanBalance: 25_000_000, housingLoanFirstYear: false, idecoAmount: 276_000, medicalExpenses: 0, furusatoAmount: 0 });
    expect(yearEnd.steps.length).toBeGreaterThanOrEqual(3);
    expect(yearEnd.summary.estimatedRefund).toBeGreaterThan(0);
  });
});

// ============================================================
// Flow 4: ライフプランシミュレーション
// ============================================================
describe('Flow 4: Life Plan Simulation', () => {
  it('simulates 30 years with life events', () => {
    const result = runSimulation({
      ...DEFAULT_PARAMS,
      currentAge: 35,
      annualIncome: 7_200_000,
      annualExpenses: 4_500_000,
      totalAssets: 6_000_000,
      totalLiabilities: 25_000_000,
      annualLoanPayment: 1_200_000,
      retirementBonus: 15_000_000,
      years: 30,
      lifeEvents: [
        { age: 38, type: 'childbirth', name: '第二子', oneTimeCost: 500_000, annualCostChange: 600_000, annualIncomeChange: 0 },
        { age: 45, type: 'car_purchase', name: '自動車購入', oneTimeCost: 3_000_000, annualCostChange: 300_000, annualIncomeChange: 0 },
      ],
    });

    expect(result.projections).toHaveLength(30);
    expect(result.projections[3].events).toContain('第二子');
    expect(result.summary.finalNetWorth).toBeDefined();
  });
});

// ============================================================
// Flow 5: サービス比較 + クレカ最適化
// ============================================================
describe('Flow 5: Service Comparison + CC Optimization', () => {
  it('optimizes credit cards based on spending', () => {
    const spending = [
      { category: 'food', label: '食費', monthlyAmount: 60_000 },
      { category: 'transportation', label: '交通費', monthlyAmount: 15_000 },
      { category: 'communication', label: '通信費', monthlyAmount: 8_000 },
      { category: 'entertainment', label: '娯楽', monthlyAmount: 30_000 },
      { category: 'subscription', label: 'サブスク', monthlyAmount: 5_000 },
    ];

    const result = optimizeCreditCards(spending);
    expect(result.singleBest.annualReward).toBeGreaterThan(0);
    expect(result.comboNetBenefit).toBeGreaterThanOrEqual(result.singleBest.netBenefit);
    expect(result.spendingSummary.effectiveRate).toBeGreaterThan(0);
  });
});

// ============================================================
// Flow 6: 保険見直し
// ============================================================
describe('Flow 6: Insurance Review', () => {
  it('analyzes insurance gap for family', () => {
    const result = analyzeInsurance({
      age: 35, maritalStatus: 'married', dependents: 1, dependentAges: [5],
      annualIncome: 7_200_000, monthlyExpenses: 375_000,
      totalAssets: 6_000_000, totalLiabilities: 25_000_000,
      currentInsurance: [{ type: 'life', name: '定期保険', coverage: 10_000_000, monthlyPremium: 2_000 }],
    });

    expect(result.lifeStage).toBe('married_young_kids');
    expect(result.needs.length).toBeGreaterThan(0);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================
// Flow 7: 補助金マッチング
// ============================================================
describe('Flow 7: Subsidy Matching', () => {
  it('matches subsidies for family profile', () => {
    const results = matchSubsidies({
      age: 35, annualIncome: 7_200_000, prefecture: '東京都',
      maritalStatus: 'married', dependents: 1, occupation: 'employee', hasChildren: true,
    });
    expect(results.length).toBeGreaterThan(0);
    const fullMatches = results.filter((r) => r.matchScore === 1);
    expect(fullMatches.length).toBeGreaterThan(0);
  });
});

// ============================================================
// Flow 8: エージェントツールチェーン
// ============================================================
describe('Flow 8: Agent Tool Chain', () => {
  const ctx = {
    annualIncome: 7_200_000, monthlyIncome: 600_000, monthlyExpenses: 375_000,
    totalAssets: 6_000_000, netWorth: -19_000_000, householdScore: 55, savingsRate: 37,
    age: 35, maritalStatus: 'married', dependents: 1,
    expenses: [
      { category: 'housing', name: '家賃', monthlyAmount: 120_000, isFixed: true },
      { category: 'food', name: '食費', monthlyAmount: 60_000, isFixed: false },
      { category: 'communication', name: '通信費', monthlyAmount: 10_000, isFixed: true },
      { category: 'insurance', name: '保険', monthlyAmount: 10_000, isFixed: true },
    ],
  };

  it('executes audit → search → tax chain', () => {
    const audit = executeToolCall('audit_subscriptions', {}, ctx);
    expect(audit.success).toBe(true);

    const search = executeToolCall('search_services', { category: 'telecom', priority: 'cost' }, ctx);
    expect(search.success).toBe(true);

    const tax = executeToolCall('calculate_tax', { annual_salary: 7_200_000, deductions: [{ type: 'ideco', amount: 276_000 }] }, ctx);
    expect(tax.success).toBe(true);
  });
});

// ============================================================
// Flow 9: アラート生成
// ============================================================
describe('Flow 9: Alert Generation', () => {
  it('generates appropriate alerts for user context', () => {
    const alerts = generateAlerts({
      monthlyIncome: 600_000, monthlyExpenses: 375_000, savingsRate: 37,
      householdScore: 55, netWorth: -19_000_000,
      expenses: [{ category: 'housing', label: '家賃', amount: 120_000, isFixed: true }],
      furusatoLimit: 100_000, age: 35, hasFurusato: false, hasIdeco: false,
    });

    // Negative net worth should generate urgent alert
    expect(alerts.some((a) => a.id === 'negative-networth')).toBe(true);
    // iDeCo opportunity
    expect(alerts.some((a) => a.id === 'ideco-opportunity')).toBe(true);
  });
});

// ============================================================
// Flow 10: サブスク監査 + 固定費削減
// ============================================================
describe('Flow 10: Subscription Audit + Fixed Cost Reduction', () => {
  it('identifies savings opportunities', () => {
    const result = auditSubscriptions([
      { category: 'housing', name: '家賃', monthlyAmount: 150_000, isFixed: true },
      { category: 'communication', name: '通信費', monthlyAmount: 12_000, isFixed: true },
      { category: 'insurance', name: '保険料', monthlyAmount: 20_000, isFixed: true },
      { category: 'subscription', name: 'Netflix', monthlyAmount: 1_500, isFixed: true },
      { category: 'subscription', name: 'Spotify', monthlyAmount: 980, isFixed: true },
      { category: 'food', name: '食費', monthlyAmount: 60_000, isFixed: false },
    ], 500_000);

    expect(result.totalFixed).toBe(184_480);
    expect(result.subscriptions.length).toBeGreaterThan(0);
    expect(result.totalPotentialSaving).toBeGreaterThan(0);

    // Communication should be flagged as high risk
    const comm = result.subscriptions.find((s) => s.category === 'communication');
    expect(comm?.risk).toBe('high');
  });
});
