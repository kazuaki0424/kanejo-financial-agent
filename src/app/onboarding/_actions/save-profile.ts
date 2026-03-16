'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { userProfiles, incomeSources, expenseRecords, assets, liabilities } from '@/lib/db/schema';
import { step1Schema, step2Schema, step3Schema, step4Schema, step5Schema } from '@/lib/validations/profile';
import { eq } from 'drizzle-orm';

interface ActionResult {
  error: string | null;
  fieldErrors?: Record<string, string[]>;
}

interface CompletionResult extends ActionResult {
  tier?: 'basic' | 'middle' | 'high_end';
  annualIncome?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  netWorth?: number;
}

function determineTier(annualIncome: number): 'basic' | 'middle' | 'high_end' {
  if (annualIncome >= 15_000_000) return 'high_end';
  if (annualIncome >= 5_000_000) return 'middle';
  return 'basic';
}

export async function saveStep1(formData: FormData): Promise<ActionResult> {
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
  };

  const parsed = step1Schema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: '入力内容に誤りがあります。',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { birthDate, gender, prefecture, maritalStatus, dependents } = parsed.data;

  try {
    // Check if profile already exists
    const existing = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1);

    if (existing.length > 0) {
      // Update
      await db
        .update(userProfiles)
        .set({
          birthDate,
          gender,
          prefecture,
          maritalStatus,
          dependents,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, user.id));
    } else {
      // Insert with placeholder values for required fields (completed in later steps)
      await db.insert(userProfiles).values({
        userId: user.id,
        birthDate,
        gender,
        prefecture,
        maritalStatus,
        dependents,
        occupation: 'employee',
        tier: determineTier(0),
        annualIncome: 0,
        onboardingCompleted: false,
      });
    }
  } catch {
    return { error: 'プロファイルの保存に失敗しました。もう一度お試しください。' };
  }

  return { error: null };
}

export async function saveStep2(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const raw = {
    occupation: formData.get('occupation') as string,
    annualIncome: formData.get('annualIncome') as string,
  };

  const parsed = step2Schema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: '入力内容に誤りがあります。',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { occupation, annualIncome } = parsed.data;

  try {
    // Update profile with income info + tier
    await db
      .update(userProfiles)
      .set({
        occupation,
        annualIncome,
        tier: determineTier(annualIncome),
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, user.id));

    // Upsert primary income source
    const existing = await db
      .select({ id: incomeSources.id })
      .from(incomeSources)
      .where(eq(incomeSources.userId, user.id))
      .limit(1);

    const monthlyIncome = Math.round(annualIncome / 12);

    if (existing.length > 0) {
      await db
        .update(incomeSources)
        .set({
          category: 'salary',
          monthlyAmount: monthlyIncome,
          updatedAt: new Date(),
        })
        .where(eq(incomeSources.userId, user.id));
    } else {
      await db.insert(incomeSources).values({
        userId: user.id,
        category: 'salary',
        name: '給与収入',
        monthlyAmount: monthlyIncome,
        isGross: true,
        isRecurring: true,
      });
    }
  } catch {
    return { error: '収入情報の保存に失敗しました。もう一度お試しください。' };
  }

  return { error: null };
}

export async function saveStep3(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const raw = {
    housing: formData.get('housing') as string,
    food: formData.get('food') as string,
    transportation: formData.get('transportation') as string,
    utilities: formData.get('utilities') as string,
    communication: formData.get('communication') as string,
    insurance: formData.get('insurance') as string,
    entertainment: formData.get('entertainment') as string,
    other: formData.get('other') as string,
  };

  const parsed = step3Schema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: '入力内容に誤りがあります。',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const expenses = parsed.data;

  const EXPENSE_LABELS: Record<string, string> = {
    housing: '住居費',
    food: '食費',
    transportation: '交通費',
    utilities: '水道光熱費',
    communication: '通信費',
    insurance: '保険料',
    entertainment: '娯楽・交際費',
    other: 'その他',
  };

  try {
    // Delete existing expense records for this user (replace with new ones)
    await db
      .delete(expenseRecords)
      .where(eq(expenseRecords.userId, user.id));

    // Insert non-zero expenses
    const rows = Object.entries(expenses)
      .filter(([, amount]) => amount > 0)
      .map(([category, monthlyAmount]) => ({
        userId: user.id,
        category,
        name: EXPENSE_LABELS[category] ?? category,
        monthlyAmount,
        isFixed: ['housing', 'insurance', 'communication'].includes(category),
        isRecurring: true,
      }));

    if (rows.length > 0) {
      await db.insert(expenseRecords).values(rows);
    }
  } catch {
    return { error: '支出情報の保存に失敗しました。もう一度お試しください。' };
  }

  return { error: null };
}

const ASSET_MAP: Record<string, { category: string; name: string }> = {
  cash: { category: 'cash', name: '預貯金' },
  stocks: { category: 'stocks', name: '株式' },
  mutualFunds: { category: 'mutual_funds', name: '投資信託' },
  crypto: { category: 'crypto', name: '暗号資産' },
  insuranceValue: { category: 'insurance_value', name: '保険解約返戻金' },
  otherAssets: { category: 'other', name: 'その他の資産' },
};

const LIABILITY_MAP: Record<string, { category: string; name: string }> = {
  mortgage: { category: 'mortgage', name: '住宅ローン' },
  carLoan: { category: 'car_loan', name: '自動車ローン' },
  studentLoan: { category: 'student_loan', name: '奨学金' },
  creditCard: { category: 'credit_card', name: 'クレジットカード残高' },
  otherLiabilities: { category: 'other', name: 'その他の借入' },
};

export async function saveStep4(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const raw: Record<string, string> = {};
  for (const key of Object.keys({ ...ASSET_MAP, ...LIABILITY_MAP })) {
    raw[key] = formData.get(key) as string;
  }

  const parsed = step4Schema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: '入力内容に誤りがあります。',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  try {
    // Replace assets
    await db.delete(assets).where(eq(assets.userId, user.id));

    const assetRows = Object.entries(ASSET_MAP)
      .filter(([key]) => data[key as keyof typeof data] > 0)
      .map(([key, meta]) => ({
        userId: user.id,
        category: meta.category,
        name: meta.name,
        amount: data[key as keyof typeof data],
        isLiquid: ['cash', 'stocks', 'mutualFunds', 'crypto'].includes(key),
      }));

    if (assetRows.length > 0) {
      await db.insert(assets).values(assetRows);
    }

    // Replace liabilities
    await db.delete(liabilities).where(eq(liabilities.userId, user.id));

    const liabilityRows = Object.entries(LIABILITY_MAP)
      .filter(([key]) => data[key as keyof typeof data] > 0)
      .map(([key, meta]) => ({
        userId: user.id,
        category: meta.category,
        name: meta.name,
        principalAmount: data[key as keyof typeof data],
        remainingAmount: data[key as keyof typeof data],
      }));

    if (liabilityRows.length > 0) {
      await db.insert(liabilities).values(liabilityRows);
    }
  } catch {
    return { error: '資産・負債情報の保存に失敗しました。もう一度お試しください。' };
  }

  return { error: null };
}

export async function saveStep5(formData: FormData): Promise<CompletionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const raw = {
    financialGoals: formData.get('financialGoals') as string,
    riskTolerance: formData.get('riskTolerance') as string,
  };

  const parsed = step5Schema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: '入力内容に誤りがあります。',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { financialGoals, riskTolerance } = parsed.data;

  try {
    // Update profile with goals + mark onboarding complete
    await db
      .update(userProfiles)
      .set({
        financialGoals,
        riskTolerance,
        onboardingCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, user.id));

    // Fetch summary for completion screen
    const [profile] = await db
      .select({
        tier: userProfiles.tier,
        annualIncome: userProfiles.annualIncome,
      })
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1);

    const userAssets = await db
      .select({ amount: assets.amount })
      .from(assets)
      .where(eq(assets.userId, user.id));

    const userLiabilities = await db
      .select({ remainingAmount: liabilities.remainingAmount })
      .from(liabilities)
      .where(eq(liabilities.userId, user.id));

    const totalAssets = userAssets.reduce((sum, a) => sum + a.amount, 0);
    const totalLiabilities = userLiabilities.reduce((sum, l) => sum + l.remainingAmount, 0);

    return {
      error: null,
      tier: profile.tier as 'basic' | 'middle' | 'high_end',
      annualIncome: profile.annualIncome,
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
    };
  } catch {
    return { error: 'プロファイルの保存に失敗しました。もう一度お試しください。' };
  }
}
