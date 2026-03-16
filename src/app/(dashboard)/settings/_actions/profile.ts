'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import {
  userProfiles,
  incomeSources,
  expenseRecords,
  assets,
  liabilities,
  profileSnapshots,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  GENDER_VALUES,
  MARITAL_STATUS_VALUES,
  OCCUPATION_VALUES,
  RISK_TOLERANCE_VALUES,
} from '@/types/database';

// ============================================================
// Fetch profile
// ============================================================
export interface ProfileData {
  profile: {
    birthDate: string;
    gender: string | null;
    prefecture: string;
    maritalStatus: string;
    dependents: number;
    occupation: string;
    annualIncome: number;
    tier: string;
    financialGoals: string[] | null;
    riskTolerance: string | null;
  };
  incomeSources: Array<{
    id: string;
    category: string;
    name: string | null;
    monthlyAmount: number;
  }>;
  expenses: Array<{
    id: string;
    category: string;
    name: string | null;
    monthlyAmount: number;
  }>;
  assets: Array<{
    id: string;
    category: string;
    name: string | null;
    amount: number;
  }>;
  liabilities: Array<{
    id: string;
    category: string;
    name: string | null;
    remainingAmount: number;
  }>;
}

export async function fetchProfile(): Promise<ProfileData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  if (!profile) return null;

  const [userIncome, userExpenses, userAssets, userLiabilities] = await Promise.all([
    db.select({
      id: incomeSources.id,
      category: incomeSources.category,
      name: incomeSources.name,
      monthlyAmount: incomeSources.monthlyAmount,
    }).from(incomeSources).where(eq(incomeSources.userId, user.id)),

    db.select({
      id: expenseRecords.id,
      category: expenseRecords.category,
      name: expenseRecords.name,
      monthlyAmount: expenseRecords.monthlyAmount,
    }).from(expenseRecords).where(eq(expenseRecords.userId, user.id)),

    db.select({
      id: assets.id,
      category: assets.category,
      name: assets.name,
      amount: assets.amount,
    }).from(assets).where(eq(assets.userId, user.id)),

    db.select({
      id: liabilities.id,
      category: liabilities.category,
      name: liabilities.name,
      remainingAmount: liabilities.remainingAmount,
    }).from(liabilities).where(eq(liabilities.userId, user.id)),
  ]);

  return {
    profile: {
      birthDate: profile.birthDate,
      gender: profile.gender,
      prefecture: profile.prefecture,
      maritalStatus: profile.maritalStatus,
      dependents: profile.dependents ?? 0,
      occupation: profile.occupation,
      annualIncome: profile.annualIncome,
      tier: profile.tier,
      financialGoals: profile.financialGoals,
      riskTolerance: profile.riskTolerance,
    },
    incomeSources: userIncome,
    expenses: userExpenses,
    assets: userAssets,
    liabilities: userLiabilities,
  };
}

// ============================================================
// Update profile
// ============================================================
const updateProfileSchema = z.object({
  birthDate: z.string().min(1),
  gender: z.enum(GENDER_VALUES).nullable(),
  prefecture: z.string().min(1),
  maritalStatus: z.enum(MARITAL_STATUS_VALUES),
  dependents: z.coerce.number().int().min(0).max(20),
  occupation: z.enum(OCCUPATION_VALUES),
  annualIncome: z.coerce.number().int().min(0),
  riskTolerance: z.enum(RISK_TOLERANCE_VALUES).nullable(),
  financialGoals: z.string().transform((val) => val ? val.split(',').filter(Boolean) : []),
});

interface UpdateResult {
  error: string | null;
  fieldErrors?: Record<string, string[]>;
}

function determineTier(annualIncome: number): 'basic' | 'middle' | 'high_end' {
  if (annualIncome >= 15_000_000) return 'high_end';
  if (annualIncome >= 5_000_000) return 'middle';
  return 'basic';
}

export async function updateProfile(formData: FormData): Promise<UpdateResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const raw = {
    birthDate: formData.get('birthDate') as string,
    gender: (formData.get('gender') as string) || null,
    prefecture: formData.get('prefecture') as string,
    maritalStatus: formData.get('maritalStatus') as string,
    dependents: formData.get('dependents') as string,
    occupation: formData.get('occupation') as string,
    annualIncome: formData.get('annualIncome') as string,
    riskTolerance: (formData.get('riskTolerance') as string) || null,
    financialGoals: formData.get('financialGoals') as string,
  };

  const parsed = updateProfileSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: '入力内容に誤りがあります。',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  try {
    // Save snapshot of current profile before updating
    const [current] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1);

    if (current) {
      await db.insert(profileSnapshots).values({
        userId: user.id,
        snapshot: current,
      });
    }

    // Update profile
    await db
      .update(userProfiles)
      .set({
        birthDate: data.birthDate,
        gender: data.gender,
        prefecture: data.prefecture,
        maritalStatus: data.maritalStatus,
        dependents: data.dependents,
        occupation: data.occupation,
        annualIncome: data.annualIncome,
        tier: determineTier(data.annualIncome),
        financialGoals: data.financialGoals,
        riskTolerance: data.riskTolerance,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, user.id));

    // Update primary income source
    const monthlyIncome = Math.round(data.annualIncome / 12);
    const existingIncome = await db
      .select({ id: incomeSources.id })
      .from(incomeSources)
      .where(eq(incomeSources.userId, user.id))
      .limit(1);

    if (existingIncome.length > 0) {
      await db
        .update(incomeSources)
        .set({ monthlyAmount: monthlyIncome, updatedAt: new Date() })
        .where(eq(incomeSources.userId, user.id));
    }
  } catch {
    return { error: 'プロファイルの更新に失敗しました。もう一度お試しください。' };
  }

  return { error: null };
}
