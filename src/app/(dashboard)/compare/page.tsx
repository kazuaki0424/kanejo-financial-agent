import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { getAuthUser } from '@/lib/supabase/auth';
import { db } from '@/lib/db/client';
import { userProfiles, expenseRecords, assets, liabilities } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ServiceComparisonView } from './_components/service-comparison-view';
import { CreditCardOptimizerView } from './_components/credit-card-optimizer-view';
import { InsuranceReviewView } from './_components/insurance-review-view';
import type { UserPreferences } from '@/lib/utils/service-comparison';
import type { SpendingPattern } from '@/lib/utils/credit-card-optimizer';
import type { InsuranceProfile } from '@/lib/utils/insurance-analyzer';

export const metadata: Metadata = {
  title: 'サービス比較 — Kanejo',
};

export default async function ComparePage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const [profile] = await db
    .select({
      birthDate: userProfiles.birthDate,
      annualIncome: userProfiles.annualIncome,
      maritalStatus: userProfiles.maritalStatus,
      dependents: userProfiles.dependents,
      childrenAges: userProfiles.childrenAges,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  if (!profile) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl text-foreground">サービス比較</h1>
        <Card>
          <p className="text-sm text-ink-muted">プロファイルが見つかりません。</p>
        </Card>
      </div>
    );
  }

  const expenses = await db
    .select({
      monthlyAmount: expenseRecords.monthlyAmount,
      category: expenseRecords.category,
      name: expenseRecords.name,
    })
    .from(expenseRecords)
    .where(eq(expenseRecords.userId, user.id));

  const monthlySpending = expenses.reduce((s, e) => s + e.monthlyAmount, 0);

  const CATEGORY_LABELS_MAP: Record<string, string> = {
    housing: '住居費', food: '食費', transportation: '交通費',
    utilities: '水道光熱費', communication: '通信費', insurance: '保険料',
    entertainment: '娯楽・交際費', clothing: '被服費',
    subscription: 'サブスク', other: 'その他',
  };

  const spendingPatterns: SpendingPattern[] = expenses.map((e) => ({
    category: e.category,
    label: CATEGORY_LABELS_MAP[e.category] ?? e.name ?? e.category,
    monthlyAmount: e.monthlyAmount,
  }));
  const birth = new Date(profile.birthDate);
  const age = new Date().getFullYear() - birth.getFullYear();

  // Fetch assets and liabilities for insurance analysis
  const [userAssets, userLiabilities] = await Promise.all([
    db.select({ amount: assets.amount }).from(assets).where(eq(assets.userId, user.id)),
    db.select({ remainingAmount: liabilities.remainingAmount }).from(liabilities).where(eq(liabilities.userId, user.id)),
  ]);
  const totalAssets = userAssets.reduce((s, a) => s + a.amount, 0);
  const totalLiabilities = userLiabilities.reduce((s, l) => s + l.remainingAmount, 0);

  const preferences: UserPreferences = {
    annualIncome: profile.annualIncome,
    monthlySpending,
    age,
    priorities: ['cost', 'rewards'],
  };

  const insuranceProfile: InsuranceProfile = {
    age,
    maritalStatus: profile.maritalStatus,
    dependents: profile.dependents ?? 0,
    dependentAges: profile.childrenAges ?? [],
    annualIncome: profile.annualIncome,
    monthlyExpenses: monthlySpending,
    totalAssets,
    totalLiabilities,
    currentInsurance: [], // No current insurance data yet
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-foreground">サービス比較</h1>

      {/* クレカ最適化 */}
      {spendingPatterns.length > 0 && (
        <CreditCardOptimizerView spending={spendingPatterns} />
      )}

      {/* 保険見直し */}
      <InsuranceReviewView profile={insuranceProfile} />

      {/* サービス比較 */}
      <ServiceComparisonView preferences={preferences} />
    </div>
  );
}
