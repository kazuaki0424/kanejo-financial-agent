/**
 * サブスク監査・固定費見直し・契約切替ツール
 */

import { formatCurrency } from '@/lib/utils/format';

// ============================================================
// Types
// ============================================================

export interface ExpenseItem {
  category: string;
  name: string;
  monthlyAmount: number;
  isFixed: boolean;
}

export interface AuditResult {
  totalFixed: number;
  totalVariable: number;
  subscriptions: SubscriptionItem[];
  fixedCostSuggestions: FixedCostSuggestion[];
  totalPotentialSaving: number;
}

export interface SubscriptionItem {
  name: string;
  monthlyAmount: number;
  annualAmount: number;
  category: string;
  risk: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface FixedCostSuggestion {
  category: string;
  currentAmount: number;
  targetAmount: number;
  saving: number;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface SwitchStep {
  order: number;
  title: string;
  description: string;
  estimatedTime: string;
}

export interface SwitchWizard {
  fromService: string;
  toService: string;
  annualSaving: number;
  steps: SwitchStep[];
  warnings: string[];
}

// ============================================================
// Subscription audit
// ============================================================

// Known subscription patterns by category
const SUBSCRIPTION_PATTERNS: Record<string, { avgCost: number; essentiality: 'high' | 'medium' | 'low' }> = {
  communication: { avgCost: 5_000, essentiality: 'high' },
  subscription: { avgCost: 1_500, essentiality: 'low' },
  insurance: { avgCost: 10_000, essentiality: 'medium' },
  entertainment: { avgCost: 3_000, essentiality: 'low' },
};

export function auditSubscriptions(expenses: ExpenseItem[], monthlyIncome: number): AuditResult {
  const fixed = expenses.filter((e) => e.isFixed);
  const variable = expenses.filter((e) => !e.isFixed);

  const totalFixed = fixed.reduce((s, e) => s + e.monthlyAmount, 0);
  const totalVariable = variable.reduce((s, e) => s + e.monthlyAmount, 0);

  // Identify subscriptions (fixed costs that could be optimized)
  const subscriptions: SubscriptionItem[] = fixed
    .filter((e) => ['communication', 'subscription', 'entertainment', 'insurance'].includes(e.category))
    .map((e) => {
      const pattern = SUBSCRIPTION_PATTERNS[e.category];
      const risk: 'high' | 'medium' | 'low' = !pattern ? 'low'
        : e.monthlyAmount > pattern.avgCost * 1.5 ? 'high'
        : e.monthlyAmount > pattern.avgCost ? 'medium'
        : 'low';

      return {
        name: e.name || e.category,
        monthlyAmount: e.monthlyAmount,
        annualAmount: e.monthlyAmount * 12,
        category: e.category,
        risk,
        suggestion: generateSubscriptionSuggestion(e.category, e.monthlyAmount, risk),
      };
    })
    .sort((a, b) => b.monthlyAmount - a.monthlyAmount);

  // Fixed cost optimization suggestions
  const suggestions = generateFixedCostSuggestions(fixed, monthlyIncome);
  const totalPotentialSaving = suggestions.reduce((s, sg) => s + sg.saving, 0);

  return { totalFixed, totalVariable, subscriptions, fixedCostSuggestions: suggestions, totalPotentialSaving };
}

function generateSubscriptionSuggestion(category: string, amount: number, risk: string): string {
  if (risk === 'high') {
    switch (category) {
      case 'communication':
        return `月額¥${formatCurrency(amount)}は平均より高めです。格安SIMへの切替で月¥${formatCurrency(Math.round(amount * 0.5))}程度に削減できる可能性があります。`;
      case 'insurance':
        return `保険料の見直しで保障内容を維持しながら削減できる可能性があります。`;
      case 'entertainment':
        return `複数のサブスクに加入している場合、利用頻度の低いものを整理することで節約できます。`;
      default:
        return '利用頻度を確認し、必要性を見直してみてください。';
    }
  }
  return risk === 'medium' ? '適正範囲ですが、見直しの余地があるかもしれません。' : '適正な水準です。';
}

function generateFixedCostSuggestions(fixedExpenses: ExpenseItem[], monthlyIncome: number): FixedCostSuggestion[] {
  const suggestions: FixedCostSuggestion[] = [];

  // Housing: should be under 30% of income
  const housing = fixedExpenses.find((e) => e.category === 'housing');
  if (housing && monthlyIncome > 0) {
    const housingRatio = housing.monthlyAmount / monthlyIncome;
    if (housingRatio > 0.30) {
      const target = Math.round(monthlyIncome * 0.28);
      suggestions.push({
        category: '住居費',
        currentAmount: housing.monthlyAmount,
        targetAmount: target,
        saving: housing.monthlyAmount - target,
        description: `住居費が収入の${(housingRatio * 100).toFixed(0)}%を占めています。28%以下（¥${formatCurrency(target)}）が目安です。`,
        priority: 'high',
      });
    }
  }

  // Communication: target 5000 or less
  const comm = fixedExpenses.find((e) => e.category === 'communication');
  if (comm && comm.monthlyAmount > 5_000) {
    suggestions.push({
      category: '通信費',
      currentAmount: comm.monthlyAmount,
      targetAmount: 3_000,
      saving: comm.monthlyAmount - 3_000,
      description: `格安SIM（LINEMO 990円〜、ahamo 2,970円）への切替で大幅削減が可能です。`,
      priority: 'high',
    });
  }

  // Insurance: check if over 10% of income
  const insurance = fixedExpenses.find((e) => e.category === 'insurance');
  if (insurance && monthlyIncome > 0 && insurance.monthlyAmount / monthlyIncome > 0.10) {
    const target = Math.round(monthlyIncome * 0.07);
    suggestions.push({
      category: '保険料',
      currentAmount: insurance.monthlyAmount,
      targetAmount: target,
      saving: insurance.monthlyAmount - target,
      description: `保険料が収入の${((insurance.monthlyAmount / monthlyIncome) * 100).toFixed(0)}%です。ネット保険への切替や不要な特約の見直しで7%以下に抑えられます。`,
      priority: 'medium',
    });
  }

  return suggestions.sort((a, b) => b.saving - a.saving);
}

// ============================================================
// Switch wizard
// ============================================================

export function generateSwitchWizard(fromService: string, toService: string, currentMonthlyCost: number, newMonthlyCost: number): SwitchWizard {
  const annualSaving = (currentMonthlyCost - newMonthlyCost) * 12;

  const steps: SwitchStep[] = [
    { order: 1, title: '新サービスの申し込み', description: `${toService}のウェブサイトまたはアプリから申し込みます。本人確認書類が必要です。`, estimatedTime: '10-15分' },
    { order: 2, title: '利用開始の確認', description: '新サービスが利用可能になったことを確認します。', estimatedTime: '即日〜数日' },
    { order: 3, title: '旧サービスの解約', description: `${fromService}のマイページまたは電話で解約手続きを行います。違約金の有無を事前に確認してください。`, estimatedTime: '10分' },
    { order: 4, title: '請求の確認', description: '翌月の請求で旧サービスの料金が発生していないことを確認します。', estimatedTime: '翌月' },
  ];

  const warnings: string[] = [];
  if (annualSaving < 0) {
    warnings.push('切替後の方がコストが高くなります。サービス内容を比較してご検討ください。');
  }
  warnings.push('解約前に違約金・解約金の有無を確認してください。');
  warnings.push('メールアドレスやポイント等の引き継ぎ可否を事前に確認してください。');

  return { fromService, toService, annualSaving, steps, warnings };
}

// ============================================================
// Tool result formatters
// ============================================================

export function formatAuditResult(result: AuditResult): string {
  const lines = [
    `【サブスク・固定費監査結果】`,
    `固定費合計: ¥${formatCurrency(result.totalFixed)}/月`,
    `変動費合計: ¥${formatCurrency(result.totalVariable)}/月`,
    '',
  ];

  if (result.subscriptions.length > 0) {
    lines.push('■ サブスク一覧:');
    for (const sub of result.subscriptions) {
      const riskMark = sub.risk === 'high' ? '⚠️' : sub.risk === 'medium' ? '△' : '○';
      lines.push(`${riskMark} ${sub.name}: ¥${formatCurrency(sub.monthlyAmount)}/月（年間¥${formatCurrency(sub.annualAmount)}）`);
      if (sub.risk !== 'low') lines.push(`  → ${sub.suggestion}`);
    }
    lines.push('');
  }

  if (result.fixedCostSuggestions.length > 0) {
    lines.push('■ 固定費削減提案:');
    for (const s of result.fixedCostSuggestions) {
      lines.push(`・${s.category}: ¥${formatCurrency(s.currentAmount)} → ¥${formatCurrency(s.targetAmount)}（月¥${formatCurrency(s.saving)}削減）`);
      lines.push(`  ${s.description}`);
    }
    lines.push('');
    lines.push(`削減ポテンシャル合計: ¥${formatCurrency(result.totalPotentialSaving)}/月（年間¥${formatCurrency(result.totalPotentialSaving * 12)}）`);
  }

  return lines.join('\n');
}

export function formatSwitchWizard(wizard: SwitchWizard): string {
  const lines = [
    `【契約切替ガイド: ${wizard.fromService} → ${wizard.toService}】`,
    `年間節約額: ¥${formatCurrency(wizard.annualSaving)}`,
    '',
    '■ 切替手順:',
  ];

  for (const step of wizard.steps) {
    lines.push(`${step.order}. ${step.title}（${step.estimatedTime}）`);
    lines.push(`   ${step.description}`);
  }

  if (wizard.warnings.length > 0) {
    lines.push('');
    lines.push('■ 注意事項:');
    for (const w of wizard.warnings) {
      lines.push(`⚠ ${w}`);
    }
  }

  return lines.join('\n');
}
