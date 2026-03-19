'use server';

import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase/auth';
import { db } from '@/lib/db/client';
import { userProfiles, incomeSources, expenseRecords, assets, liabilities } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { calculateHouseholdScore, type ScoreBreakdown } from '@/lib/utils/household-score';
import { logger } from '@/lib/logger';

export interface DashboardMetrics {
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  householdScore: number;
  householdGrade: 'S' | 'A' | 'B' | 'C' | 'D';
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  tier: string;
  scoreBreakdown: ScoreBreakdown;
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics | null> {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const [profile] = await db
    .select({
      annualIncome: userProfiles.annualIncome,
      tier: userProfiles.tier,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  if (!profile) return null;

  const [userIncome, userExpenses, userAssets, userLiabilities] = await Promise.all([
    db.select({ monthlyAmount: incomeSources.monthlyAmount })
      .from(incomeSources)
      .where(eq(incomeSources.userId, user.id)),

    db.select({ monthlyAmount: expenseRecords.monthlyAmount, category: expenseRecords.category })
      .from(expenseRecords)
      .where(eq(expenseRecords.userId, user.id)),

    db.select({
      amount: assets.amount,
      category: assets.category,
      isLiquid: assets.isLiquid,
    })
      .from(assets)
      .where(eq(assets.userId, user.id)),

    db.select({ remainingAmount: liabilities.remainingAmount })
      .from(liabilities)
      .where(eq(liabilities.userId, user.id)),
  ]);

  const monthlyIncome = userIncome.reduce((s, i) => s + i.monthlyAmount, 0);
  const monthlyExpenses = userExpenses.reduce((s, e) => s + e.monthlyAmount, 0);
  const totalAssets = userAssets.reduce((s, a) => s + a.amount, 0);
  const totalLiabilities = userLiabilities.reduce((s, l) => s + l.remainingAmount, 0);
  const liquidAssets = userAssets.filter((a) => a.isLiquid).reduce((s, a) => s + a.amount, 0);
  const assetCategories = new Set(userAssets.map((a) => a.category));

  const insuranceAssets = userAssets
    .filter((a) => a.category === 'insurance_value')
    .reduce((s, a) => s + a.amount, 0);
  const insuranceExpenses = userExpenses
    .filter((e) => e.category === 'insurance')
    .reduce((s, e) => s + e.monthlyAmount * 12, 0);
  const insuranceCoverage = insuranceAssets + insuranceExpenses;

  const savingsRate = monthlyIncome > 0
    ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100)
    : 0;

  const tier = profile.tier as 'basic' | 'middle' | 'high_end';

  const { score, grade, breakdown } = calculateHouseholdScore({
    monthlyIncome,
    monthlyExpenses,
    annualIncome: profile.annualIncome,
    totalLiabilities,
    liquidAssets,
    assetCategoryCount: assetCategories.size,
    insuranceCoverage,
    tier,
  });

  return {
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    householdScore: score,
    householdGrade: grade,
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    tier: profile.tier,
    scoreBreakdown: breakdown,
  };
}

// ============================================================
// 月次収支チャートデータ
// ============================================================
export interface MonthlyChartPoint {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export async function fetchMonthlyChartData(): Promise<MonthlyChartPoint[]> {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const [userIncome, userExpenses] = await Promise.all([
    db.select({ monthlyAmount: incomeSources.monthlyAmount })
      .from(incomeSources)
      .where(eq(incomeSources.userId, user.id)),
    db.select({ monthlyAmount: expenseRecords.monthlyAmount, category: expenseRecords.category })
      .from(expenseRecords)
      .where(eq(expenseRecords.userId, user.id)),
  ]);

  const baseIncome = userIncome.reduce((s, i) => s + i.monthlyAmount, 0);
  const baseExpenses = userExpenses.reduce((s, e) => s + e.monthlyAmount, 0);

  const EXPENSE_SEASONALITY = [
    1.08, 0.95, 1.05, 0.98, 0.97, 0.96,
    1.02, 1.06, 0.94, 0.97, 0.98, 1.12,
  ] as const;
  const INCOME_SEASONALITY = [
    1.0, 1.0, 1.0, 1.0, 1.0, 1.5,
    1.0, 1.0, 1.0, 1.0, 1.0, 1.5,
  ] as const;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const data: MonthlyChartPoint[] = [];

  for (let i = 11; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;

    const income = Math.round(baseIncome * INCOME_SEASONALITY[monthIndex]);
    const expenses = Math.round(baseExpenses * EXPENSE_SEASONALITY[monthIndex]);

    data.push({
      month: `${year}/${String(monthIndex + 1).padStart(2, '0')}`,
      income,
      expenses,
      savings: income - expenses,
    });
  }

  return data;
}

// ============================================================
// 支出カテゴリ分析データ
// ============================================================
export interface ExpenseCategoryData {
  category: string;
  label: string;
  amount: number;
  percentage: number;
  isFixed: boolean;
  color: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  housing: '住居費',
  food: '食費',
  transportation: '交通費',
  utilities: '水道光熱費',
  communication: '通信費',
  insurance: '保険料',
  medical: '医療費',
  education: '教育費',
  entertainment: '娯楽・交際費',
  clothing: '被服費',
  subscription: 'サブスク',
  tax: '税金',
  other: 'その他',
};

const CATEGORY_COLORS: Record<string, string> = {
  housing: 'var(--chart-1)',
  food: 'var(--chart-2)',
  transportation: 'var(--chart-5)',
  utilities: 'var(--chart-4)',
  communication: 'var(--chart-3)',
  insurance: 'var(--chart-6)',
  entertainment: 'var(--color-warning)',
  other: 'var(--color-ink-subtle)',
  medical: 'var(--color-info)',
  education: 'var(--color-primary)',
  clothing: '#b08d7a',
  subscription: '#7a8fb0',
  tax: '#a07ab0',
};

export async function fetchExpenseCategories(): Promise<ExpenseCategoryData[]> {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const rows = await db
    .select({
      category: expenseRecords.category,
      name: expenseRecords.name,
      monthlyAmount: expenseRecords.monthlyAmount,
      isFixed: expenseRecords.isFixed,
    })
    .from(expenseRecords)
    .where(eq(expenseRecords.userId, user.id));

  const total = rows.reduce((s, r) => s + r.monthlyAmount, 0);

  if (total === 0) return [];

  return rows
    .map((r) => ({
      category: r.category,
      label: CATEGORY_LABELS[r.category] ?? r.name ?? r.category,
      amount: r.monthlyAmount,
      percentage: Math.round((r.monthlyAmount / total) * 100),
      isFixed: r.isFixed ?? false,
      color: CATEGORY_COLORS[r.category] ?? 'var(--color-ink-subtle)',
    }))
    .sort((a, b) => b.amount - a.amount);
}

// ============================================================
// 資産ポートフォリオデータ
// ============================================================
export interface AssetPortfolioItem {
  category: string;
  label: string;
  amount: number;
  percentage: number;
  color: string;
  isLiquid: boolean;
}

export interface LiabilityItem {
  category: string;
  label: string;
  remainingAmount: number;
  color: string;
}

export interface PortfolioData {
  assets: AssetPortfolioItem[];
  liabilities: LiabilityItem[];
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  liquidRatio: number;
}

const ASSET_LABELS: Record<string, string> = {
  cash: '預貯金',
  stocks: '株式',
  bonds: '債券',
  mutual_funds: '投資信託',
  real_estate: '不動産',
  crypto: '暗号資産',
  insurance_value: '保険解約返戻金',
  other: 'その他',
};

const ASSET_COLORS: Record<string, string> = {
  cash: 'var(--chart-1)',
  stocks: 'var(--chart-3)',
  bonds: 'var(--chart-5)',
  mutual_funds: 'var(--chart-2)',
  real_estate: 'var(--chart-4)',
  crypto: 'var(--color-warning)',
  insurance_value: 'var(--chart-6)',
  other: 'var(--color-ink-subtle)',
};

const LIABILITY_LABELS: Record<string, string> = {
  mortgage: '住宅ローン',
  car_loan: '自動車ローン',
  student_loan: '奨学金',
  credit_card: 'クレジットカード',
  consumer_loan: 'カードローン',
  other: 'その他',
};

const LIABILITY_COLORS: Record<string, string> = {
  mortgage: 'var(--color-negative)',
  car_loan: '#d46b5c',
  student_loan: '#c4876e',
  credit_card: '#b0564a',
  consumer_loan: '#a04038',
  other: 'var(--color-ink-subtle)',
};

export async function fetchPortfolioData(): Promise<PortfolioData | null> {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const [userAssets, userLiabilities] = await Promise.all([
    db.select({
      category: assets.category,
      name: assets.name,
      amount: assets.amount,
      isLiquid: assets.isLiquid,
    })
      .from(assets)
      .where(eq(assets.userId, user.id)),

    db.select({
      category: liabilities.category,
      name: liabilities.name,
      remainingAmount: liabilities.remainingAmount,
    })
      .from(liabilities)
      .where(eq(liabilities.userId, user.id)),
  ]);

  const totalAssets = userAssets.reduce((s, a) => s + a.amount, 0);
  const totalLiabilities = userLiabilities.reduce((s, l) => s + l.remainingAmount, 0);
  const liquidTotal = userAssets.filter((a) => a.isLiquid).reduce((s, a) => s + a.amount, 0);

  const assetItems: AssetPortfolioItem[] = userAssets
    .map((a) => ({
      category: a.category,
      label: ASSET_LABELS[a.category] ?? a.name ?? a.category,
      amount: a.amount,
      percentage: totalAssets > 0 ? Math.round((a.amount / totalAssets) * 100) : 0,
      color: ASSET_COLORS[a.category] ?? 'var(--color-ink-subtle)',
      isLiquid: a.isLiquid ?? true,
    }))
    .sort((a, b) => b.amount - a.amount);

  const liabilityItems: LiabilityItem[] = userLiabilities
    .map((l) => ({
      category: l.category,
      label: LIABILITY_LABELS[l.category] ?? l.name ?? l.category,
      remainingAmount: l.remainingAmount,
      color: LIABILITY_COLORS[l.category] ?? 'var(--color-ink-subtle)',
    }))
    .sort((a, b) => b.remainingAmount - a.remainingAmount);

  return {
    assets: assetItems,
    liabilities: liabilityItems,
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    liquidRatio: totalAssets > 0 ? Math.round((liquidTotal / totalAssets) * 100) : 0,
  };
}

// ============================================================
// /diagnosis 専用: 全データを1関数・5並列クエリで取得
// ============================================================
export interface DiagnosisData {
  metrics: DashboardMetrics;
  categories: ExpenseCategoryData[];
  portfolio: PortfolioData;
}

export async function fetchDiagnosisData(): Promise<DiagnosisData | null> {
  const t0 = performance.now();

  const user = await getAuthUser();
  if (!user) redirect('/login');
  logger.info('[diagnosis] getAuthUser', { ms: Math.round(performance.now() - t0) });

  const t1 = performance.now();
  // 5クエリを完全並列化（従来: profile直列 → 4クエリ並列、expenses/assets/liabilities重複取得）
  const [profiles, incomeRows, expenseRows, assetRows, liabilityRows] = await Promise.all([
    db.select({ annualIncome: userProfiles.annualIncome, tier: userProfiles.tier })
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1),

    db.select({ monthlyAmount: incomeSources.monthlyAmount })
      .from(incomeSources)
      .where(eq(incomeSources.userId, user.id)),

    db.select({
      monthlyAmount: expenseRecords.monthlyAmount,
      category: expenseRecords.category,
      name: expenseRecords.name,
      isFixed: expenseRecords.isFixed,
    })
      .from(expenseRecords)
      .where(eq(expenseRecords.userId, user.id)),

    db.select({
      amount: assets.amount,
      category: assets.category,
      isLiquid: assets.isLiquid,
      name: assets.name,
    })
      .from(assets)
      .where(eq(assets.userId, user.id)),

    db.select({
      remainingAmount: liabilities.remainingAmount,
      category: liabilities.category,
      name: liabilities.name,
    })
      .from(liabilities)
      .where(eq(liabilities.userId, user.id)),
  ]);
  logger.info('[diagnosis] db queries (5 parallel)', { ms: Math.round(performance.now() - t1) });

  const profile = profiles[0];
  if (!profile) return null;

  const t2 = performance.now();

  // --- metrics ---
  const monthlyIncome = incomeRows.reduce((s, i) => s + i.monthlyAmount, 0);
  const monthlyExpenses = expenseRows.reduce((s, e) => s + e.monthlyAmount, 0);
  const totalAssets = assetRows.reduce((s, a) => s + a.amount, 0);
  const totalLiabilities = liabilityRows.reduce((s, l) => s + l.remainingAmount, 0);
  const liquidAssets = assetRows.filter((a) => a.isLiquid).reduce((s, a) => s + a.amount, 0);
  const assetCategories = new Set(assetRows.map((a) => a.category));
  const insuranceCoverage =
    assetRows.filter((a) => a.category === 'insurance_value').reduce((s, a) => s + a.amount, 0) +
    expenseRows.filter((e) => e.category === 'insurance').reduce((s, e) => s + e.monthlyAmount * 12, 0);
  const savingsRate =
    monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100) : 0;
  const tier = profile.tier as 'basic' | 'middle' | 'high_end';
  const { score, grade, breakdown } = calculateHouseholdScore({
    monthlyIncome,
    monthlyExpenses,
    annualIncome: profile.annualIncome,
    totalLiabilities,
    liquidAssets,
    assetCategoryCount: assetCategories.size,
    insuranceCoverage,
    tier,
  });

  // --- categories ---
  const expenseTotal = monthlyExpenses;
  const categories: ExpenseCategoryData[] =
    expenseTotal === 0
      ? []
      : expenseRows
          .map((r) => ({
            category: r.category,
            label: CATEGORY_LABELS[r.category] ?? r.name ?? r.category,
            amount: r.monthlyAmount,
            percentage: Math.round((r.monthlyAmount / expenseTotal) * 100),
            isFixed: r.isFixed ?? false,
            color: CATEGORY_COLORS[r.category] ?? 'var(--color-ink-subtle)',
          }))
          .sort((a, b) => b.amount - a.amount);

  // --- portfolio ---
  const liquidTotal = liquidAssets;
  const assetItems: AssetPortfolioItem[] = assetRows
    .map((a) => ({
      category: a.category,
      label: ASSET_LABELS[a.category] ?? a.name ?? a.category,
      amount: a.amount,
      percentage: totalAssets > 0 ? Math.round((a.amount / totalAssets) * 100) : 0,
      color: ASSET_COLORS[a.category] ?? 'var(--color-ink-subtle)',
      isLiquid: a.isLiquid ?? true,
    }))
    .sort((a, b) => b.amount - a.amount);
  const liabilityItems: LiabilityItem[] = liabilityRows
    .map((l) => ({
      category: l.category,
      label: LIABILITY_LABELS[l.category] ?? l.name ?? l.category,
      remainingAmount: l.remainingAmount,
      color: LIABILITY_COLORS[l.category] ?? 'var(--color-ink-subtle)',
    }))
    .sort((a, b) => b.remainingAmount - a.remainingAmount);

  logger.info('[diagnosis] compute', { ms: Math.round(performance.now() - t2) });
  logger.info('[diagnosis] total', { ms: Math.round(performance.now() - t0) });

  return {
    metrics: {
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      householdScore: score,
      householdGrade: grade,
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      tier: profile.tier,
      scoreBreakdown: breakdown,
    },
    categories,
    portfolio: {
      assets: assetItems,
      liabilities: liabilityItems,
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      liquidRatio: totalAssets > 0 ? Math.round((liquidTotal / totalAssets) * 100) : 0,
    },
  };
}
