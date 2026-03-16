/**
 * 節税ポテンシャル計算エンジン
 *
 * ユーザーの状況から利用可能な節税施策と、それぞれの節税効果額を算出する。
 */

import { INCOME_TAX_BRACKETS } from '@/lib/constants/tax-rates';
import { calculateTax, calculateFurusatoLimit, type Deduction } from '@/lib/utils/calculations';

export interface TaxSavingItem {
  id: string;
  name: string;
  category: 'deduction' | 'investment' | 'donation';
  description: string;
  annualSaving: number;
  maxSaving: number;
  status: 'active' | 'available' | 'not_eligible';
  statusLabel: string;
  actionLabel: string;
  actionHref: string;
  priority: number;
}

export interface TaxSavingsSummary {
  items: TaxSavingItem[];
  totalActiveSaving: number;
  totalPotentialSaving: number;
  utilizationRate: number;
}

interface UserContext {
  annualSalary: number;
  occupation: string;
  maritalStatus: string;
  dependents: number;
  age: number;
  currentDeductions: Deduction[];
}

function getIncomeTaxRate(annualSalary: number): number {
  const result = calculateTax({ annualSalary, deductions: [] });
  const taxable = result.taxableIncomeForIncomeTax;
  for (const bracket of INCOME_TAX_BRACKETS) {
    if (taxable >= bracket.min && taxable <= bracket.max) {
      return bracket.rate;
    }
  }
  return 0.05;
}

export function calculateTaxSavings(ctx: UserContext): TaxSavingsSummary {
  const items: TaxSavingItem[] = [];
  const taxRate = getIncomeTaxRate(ctx.annualSalary);
  const combinedRate = taxRate + 0.10; // 所得税率 + 住民税10%

  // Build deductions list for furusato calc
  const baseDeductions: Deduction[] = [];
  if (ctx.maritalStatus === 'married') baseDeductions.push({ type: 'spouse', amount: 1 });
  if (ctx.dependents > 0) baseDeductions.push({ type: 'dependent_general', amount: ctx.dependents });

  // --- 1. ふるさと納税 ---
  const furusatoLimit = calculateFurusatoLimit(ctx.annualSalary, baseDeductions);
  const hasFurusato = ctx.currentDeductions.some((d) => d.type === 'furusato');
  const furusatoAmount = ctx.currentDeductions.find((d) => d.type === 'furusato')?.amount ?? 0;
  const furusatoSaving = Math.max(0, furusatoAmount - 2_000);

  items.push({
    id: 'furusato',
    name: 'ふるさと納税',
    category: 'donation',
    description: `自己負担2,000円で返礼品を受け取りながら税控除。上限額 ¥${furusatoLimit.toLocaleString()}`,
    annualSaving: furusatoSaving,
    maxSaving: Math.max(0, furusatoLimit - 2_000),
    status: hasFurusato ? 'active' : 'available',
    statusLabel: hasFurusato ? '実行済み' : '未実行',
    actionLabel: 'シミュレーション',
    actionHref: '/tax/furusato',
    priority: 1,
  });

  // --- 2. iDeCo ---
  const idecoLimits: Record<string, number> = {
    employee: 276_000,
    self_employed: 816_000,
    part_time: 276_000,
  };
  const idecoMax = idecoLimits[ctx.occupation] ?? 276_000;
  const hasIdeco = ctx.currentDeductions.some((d) => d.type === 'ideco');
  const idecoAmount = ctx.currentDeductions.find((d) => d.type === 'ideco')?.amount ?? 0;
  const idecoSaving = Math.floor(idecoAmount * combinedRate);
  const idecoMaxSaving = Math.floor(idecoMax * combinedRate);

  if (ctx.age < 65) {
    items.push({
      id: 'ideco',
      name: 'iDeCo',
      category: 'investment',
      description: `掛金全額が所得控除。運用益も非課税。上限 ¥${idecoMax.toLocaleString()}/年`,
      annualSaving: idecoSaving,
      maxSaving: idecoMaxSaving,
      status: hasIdeco ? 'active' : 'available',
      statusLabel: hasIdeco ? `¥${idecoAmount.toLocaleString()}/年` : '未加入',
      actionLabel: '詳細を見る',
      actionHref: '/tax/ideco-nisa',
      priority: 2,
    });
  }

  // --- 3. NISA ---
  // NISAは所得控除ではなく運用益非課税なので、効果は運用結果に依存
  // ここでは年間投資枠の想定リターンに対する非課税効果を概算
  const nisaAnnualMax = 3_600_000;
  const assumedReturn = 0.04;
  const nisaMaxSaving = Math.floor(nisaAnnualMax * assumedReturn * 0.20315); // 非課税メリット

  items.push({
    id: 'nisa',
    name: '新NISA',
    category: 'investment',
    description: '運用益が非課税。年間360万円の投資枠。生涯1,800万円',
    annualSaving: 0, // Can't determine without actual investment data
    maxSaving: nisaMaxSaving,
    status: 'available',
    statusLabel: '要確認',
    actionLabel: 'シミュレーション',
    actionHref: '/tax/ideco-nisa',
    priority: 3,
  });

  // --- 4. 医療費控除 ---
  const hasMedical = ctx.currentDeductions.some((d) => d.type === 'medical');
  const medicalAmount = ctx.currentDeductions.find((d) => d.type === 'medical')?.amount ?? 0;
  const medicalDeductible = Math.max(0, medicalAmount - 100_000);
  const medicalSaving = Math.floor(medicalDeductible * combinedRate);

  items.push({
    id: 'medical',
    name: '医療費控除',
    category: 'deduction',
    description: '年間医療費が10万円を超えた分を所得控除。確定申告が必要',
    annualSaving: medicalSaving,
    maxSaving: Math.floor(2_000_000 * combinedRate), // theoretical max
    status: hasMedical ? 'active' : 'available',
    statusLabel: hasMedical ? '申告予定' : '対象外かも',
    actionLabel: '確定申告ガイド',
    actionHref: '/tax',
    priority: 5,
  });

  // --- 5. 生命保険料控除 ---
  const hasLifeInsurance = ctx.currentDeductions.some((d) => d.type === 'life_insurance');
  const lifeInsMax = 40_000;
  const lifeInsSaving = Math.floor(lifeInsMax * combinedRate);

  items.push({
    id: 'life_insurance',
    name: '生命保険料控除',
    category: 'deduction',
    description: '生命保険・個人年金の保険料が所得控除。年末調整で適用可能',
    annualSaving: hasLifeInsurance ? lifeInsSaving : 0,
    maxSaving: lifeInsSaving,
    status: hasLifeInsurance ? 'active' : 'available',
    statusLabel: hasLifeInsurance ? '適用中' : '未適用',
    actionLabel: '保険を見直す',
    actionHref: '/compare',
    priority: 6,
  });

  // --- 6. 住宅ローン控除 ---
  const hasHousingLoan = ctx.currentDeductions.some((d) => d.type === 'housing_loan');
  const loanBalance = ctx.currentDeductions.find((d) => d.type === 'housing_loan')?.amount ?? 0;
  const housingLoanSaving = hasHousingLoan ? Math.min(Math.floor(loanBalance * 0.007), 350_000) : 0;

  items.push({
    id: 'housing_loan',
    name: '住宅ローン控除',
    category: 'deduction',
    description: 'ローン残高の0.7%を所得税から税額控除。最大13年間',
    annualSaving: housingLoanSaving,
    maxSaving: 350_000,
    status: hasHousingLoan ? 'active' : ctx.annualSalary <= 20_000_000 ? 'available' : 'not_eligible',
    statusLabel: hasHousingLoan ? `¥${housingLoanSaving.toLocaleString()}/年` : '対象外',
    actionLabel: '詳細',
    actionHref: '/tax/subsidies',
    priority: 4,
  });

  // Sort by priority
  items.sort((a, b) => a.priority - b.priority);

  const totalActiveSaving = items.reduce((s, i) => s + i.annualSaving, 0);
  const totalPotentialSaving = items.reduce((s, i) => s + i.maxSaving, 0);
  const utilizationRate = totalPotentialSaving > 0 ? totalActiveSaving / totalPotentialSaving : 0;

  return { items, totalActiveSaving, totalPotentialSaving, utilizationRate };
}
