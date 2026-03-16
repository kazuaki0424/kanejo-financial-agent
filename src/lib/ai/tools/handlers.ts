/**
 * エージェントツール実行ハンドラ
 */

import { compareServices, type UserPreferences } from '@/lib/utils/service-comparison';
import { calculateTax, calculateFurusatoLimit, type Deduction } from '@/lib/utils/calculations';
import { simulateInvestment } from '@/lib/constants/investment-plans';
import { auditSubscriptions, generateSwitchWizard, formatAuditResult, formatSwitchWizard, type ExpenseItem } from '@/lib/ai/tools/subscription-audit';
import { formatCurrency } from '@/lib/utils/format';
import type { ServiceCategory } from '@/lib/constants/financial-services';

export interface ToolContext {
  annualIncome: number;
  monthlyExpenses: number;
  monthlyIncome: number;
  totalAssets: number;
  netWorth: number;
  householdScore: number;
  savingsRate: number;
  age: number;
  maritalStatus: string;
  dependents: number;
  expenses: ExpenseItem[];
}

export interface ToolResult {
  success: boolean;
  data: string;
}

export function executeToolCall(
  toolName: string,
  toolInput: Record<string, unknown>,
  context: ToolContext,
): ToolResult {
  switch (toolName) {
    case 'search_services':
      return handleSearchServices(toolInput, context);
    case 'calculate_tax':
      return handleCalculateTax(toolInput);
    case 'calculate_furusato_limit':
      return handleFurusatoLimit(toolInput);
    case 'simulate_investment':
      return handleSimulateInvestment(toolInput);
    case 'get_user_summary':
      return handleGetUserSummary(context);
    case 'audit_subscriptions':
      return handleAuditSubscriptions(context);
    case 'generate_switch_guide':
      return handleSwitchGuide(toolInput);
    default:
      return { success: false, data: `未知のツール: ${toolName}` };
  }
}

function handleSearchServices(
  input: Record<string, unknown>,
  context: ToolContext,
): ToolResult {
  const category = input.category as ServiceCategory;
  const priority = (input.priority as string) ?? 'cost';

  const prefs: UserPreferences = {
    annualIncome: context.annualIncome,
    monthlySpending: context.monthlyExpenses,
    age: context.age,
    priorities: [priority as 'cost' | 'rewards' | 'coverage' | 'quality'],
  };

  const result = compareServices(category, prefs);

  const top3 = result.services.slice(0, 3);
  const lines = top3.map((s, i) => {
    const costStr = s.annualCost === 0 ? '無料' : `¥${formatCurrency(s.annualCost)}/年`;
    const benefitStr = s.annualBenefit > 0 ? `還元 +¥${formatCurrency(s.annualBenefit)}/年` : '';
    return `${i + 1}. ${s.service.name}（${s.service.provider}）- スコア${s.score} - ${costStr}${benefitStr ? ' - ' + benefitStr : ''} - ${s.recommendation}`;
  });

  return {
    success: true,
    data: `【${category}の比較結果（上位3件）】\n${lines.join('\n')}`,
  };
}

function handleCalculateTax(input: Record<string, unknown>): ToolResult {
  const salary = input.annual_salary as number;
  const rawDeductions = (input.deductions as Array<{ type: string; amount: number }>) ?? [];

  const deductions: Deduction[] = rawDeductions.map((d) => ({
    type: d.type as Deduction['type'],
    amount: d.amount,
  }));

  const result = calculateTax({ annualSalary: salary, deductions });

  return {
    success: true,
    data: `【税額計算結果】\n年収: ¥${formatCurrency(salary)}\n給与所得: ¥${formatCurrency(result.salaryIncome)}\n所得税: ¥${formatCurrency(result.finalIncomeTax)}\n住民税: ¥${formatCurrency(result.finalResidentTax)}\n合計税額: ¥${formatCurrency(result.totalTax)}\n手取り: ¥${formatCurrency(result.takeHome)}\n実効税率: ${(result.effectiveRate * 100).toFixed(1)}%`,
  };
}

function handleFurusatoLimit(input: Record<string, unknown>): ToolResult {
  const salary = input.annual_salary as number;
  const isMarried = input.is_married as boolean | undefined;
  const dependents = (input.dependents as number) ?? 0;

  const deductions: Deduction[] = [];
  if (isMarried) deductions.push({ type: 'spouse', amount: 1 });
  if (dependents > 0) deductions.push({ type: 'dependent_general', amount: dependents });

  const limit = calculateFurusatoLimit(salary, deductions);

  return {
    success: true,
    data: `【ふるさと納税上限額】\n年収¥${formatCurrency(salary)}${isMarried ? '（既婚）' : '（独身）'}${dependents > 0 ? `扶養${dependents}人` : ''}\n控除上限額: ¥${formatCurrency(limit)}\n自己負担: ¥2,000`,
  };
}

function handleSimulateInvestment(input: Record<string, unknown>): ToolResult {
  const monthly = input.monthly_amount as number;
  const years = input.years as number;
  const rate = input.annual_return_rate as number;

  const result = simulateInvestment(monthly, years, rate);

  return {
    success: true,
    data: `【積立投資シミュレーション】\n月額: ¥${formatCurrency(monthly)}\n期間: ${years}年\n想定利回り: ${(rate * 100).toFixed(1)}%\n積立総額: ¥${formatCurrency(result.totalContribution)}\n運用益: +¥${formatCurrency(result.totalReturn)}\n最終評価額: ¥${formatCurrency(result.finalValue)}`,
  };
}

function handleGetUserSummary(context: ToolContext): ToolResult {
  return {
    success: true,
    data: `【ユーザーサマリー】\n月収: ¥${formatCurrency(context.monthlyIncome)}\n月支出: ¥${formatCurrency(context.monthlyExpenses)}\n貯蓄率: ${context.savingsRate}%\n家計スコア: ${context.householdScore}/100\n純資産: ¥${formatCurrency(context.netWorth)}\n年齢: ${context.age}歳\n婚姻: ${context.maritalStatus === 'married' ? '既婚' : '未婚'}\n扶養: ${context.dependents}人`,
  };
}

function handleAuditSubscriptions(context: ToolContext): ToolResult {
  const result = auditSubscriptions(context.expenses, context.monthlyIncome);
  return { success: true, data: formatAuditResult(result) };
}

function handleSwitchGuide(input: Record<string, unknown>): ToolResult {
  const wizard = generateSwitchWizard(
    input.from_service as string,
    input.to_service as string,
    input.current_monthly_cost as number,
    input.new_monthly_cost as number,
  );
  return { success: true, data: formatSwitchWizard(wizard) };
}
