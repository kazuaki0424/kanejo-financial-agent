import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { getAuthUser } from '@/lib/supabase/auth';
import { db } from '@/lib/db/client';
import { userProfiles, expenseRecords } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { fetchDashboardMetrics } from '@/app/(dashboard)/_actions/dashboard';
import { calculateFurusatoLimit, type Deduction } from '@/lib/utils/calculations';
import { generateAlerts, type AlertContext } from '@/lib/utils/alert-engine';
import { AlertList } from './_components/alert-list';

export const metadata: Metadata = {
  title: 'アラート・通知 — Kanejo',
};

export default async function AlertsPage(): Promise<React.ReactElement> {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  // Run all data fetches in parallel instead of sequentially
  const [metrics, [profile], expenses] = await Promise.all([
    fetchDashboardMetrics(),
    db.select({ birthDate: userProfiles.birthDate, maritalStatus: userProfiles.maritalStatus, dependents: userProfiles.dependents })
      .from(userProfiles).where(eq(userProfiles.userId, user.id)).limit(1),
    db.select({ category: expenseRecords.category, name: expenseRecords.name, monthlyAmount: expenseRecords.monthlyAmount, isFixed: expenseRecords.isFixed })
      .from(expenseRecords).where(eq(expenseRecords.userId, user.id)),
  ]);

  if (!metrics) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl text-foreground">アラート・通知</h1>
        <Card><p className="text-sm text-ink-muted">プロファイルが見つかりません。</p></Card>
      </div>
    );
  }

  const age = profile ? new Date().getFullYear() - new Date(profile.birthDate).getFullYear() : 35;

  const deductions: Deduction[] = [];
  if (profile?.maritalStatus === 'married') deductions.push({ type: 'spouse', amount: 1 });
  if (profile?.dependents && profile.dependents > 0) deductions.push({ type: 'dependent_general', amount: profile.dependents });

  const furusatoLimit = calculateFurusatoLimit(metrics.monthlyIncome * 12, deductions);

  const ctx: AlertContext = {
    monthlyIncome: metrics.monthlyIncome,
    monthlyExpenses: metrics.monthlyExpenses,
    savingsRate: metrics.savingsRate,
    householdScore: metrics.householdScore,
    netWorth: metrics.netWorth,
    expenses: expenses.map((e) => ({
      category: e.category,
      label: e.name ?? e.category,
      amount: e.monthlyAmount,
      isFixed: e.isFixed ?? false,
    })),
    furusatoLimit,
    age,
    hasFurusato: false,
    hasIdeco: false,
  };

  const alerts = generateAlerts(ctx);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-foreground">アラート・通知</h1>
      <AlertList alerts={alerts} />
    </div>
  );
}
