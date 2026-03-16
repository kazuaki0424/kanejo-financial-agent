'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { userProfiles, incomeSources, expenseRecords, assets, liabilities } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface SimulationInitialData {
  currentAge: number;
  annualIncome: number;
  annualExpenses: number;
  totalAssets: number;
  totalLiabilities: number;
  annualLoanPayment: number;
  tier: string;
}

export async function fetchSimulationData(): Promise<SimulationInitialData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [profile] = await db
    .select({
      birthDate: userProfiles.birthDate,
      annualIncome: userProfiles.annualIncome,
      tier: userProfiles.tier,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  if (!profile) return null;

  const [userIncome, userExpenses, userAssets, userLiabilities] = await Promise.all([
    db.select({ monthlyAmount: incomeSources.monthlyAmount })
      .from(incomeSources).where(eq(incomeSources.userId, user.id)),
    db.select({ monthlyAmount: expenseRecords.monthlyAmount })
      .from(expenseRecords).where(eq(expenseRecords.userId, user.id)),
    db.select({ amount: assets.amount })
      .from(assets).where(eq(assets.userId, user.id)),
    db.select({ remainingAmount: liabilities.remainingAmount, monthlyPayment: liabilities.monthlyPayment })
      .from(liabilities).where(eq(liabilities.userId, user.id)),
  ]);

  const birth = new Date(profile.birthDate);
  const now = new Date();
  const currentAge = now.getFullYear() - birth.getFullYear();

  const monthlyIncome = userIncome.reduce((s, i) => s + i.monthlyAmount, 0);
  const monthlyExpenses = userExpenses.reduce((s, e) => s + e.monthlyAmount, 0);
  const totalAssets = userAssets.reduce((s, a) => s + a.amount, 0);
  const totalLiabilities = userLiabilities.reduce((s, l) => s + l.remainingAmount, 0);
  const monthlyLoanPayment = userLiabilities.reduce((s, l) => s + (l.monthlyPayment ?? 0), 0);

  return {
    currentAge,
    annualIncome: Math.max(profile.annualIncome, monthlyIncome * 12),
    annualExpenses: monthlyExpenses * 12,
    totalAssets,
    totalLiabilities,
    annualLoanPayment: monthlyLoanPayment * 12,
    tier: profile.tier,
  };
}
