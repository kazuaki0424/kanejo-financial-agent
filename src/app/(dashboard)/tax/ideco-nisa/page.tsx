import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { calculateTax } from '@/lib/utils/calculations';
import { INCOME_TAX_BRACKETS } from '@/lib/constants/tax-rates';
import { InvestmentSimulator } from './_components/investment-simulator';

export const metadata: Metadata = {
  title: 'iDeCo / NISA — Kanejo',
};

export default async function IdecoNisaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [profile] = await db
    .select({
      birthDate: userProfiles.birthDate,
      occupation: userProfiles.occupation,
      annualIncome: userProfiles.annualIncome,
      maritalStatus: userProfiles.maritalStatus,
      dependents: userProfiles.dependents,
      tier: userProfiles.tier,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  if (!profile) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl text-foreground">iDeCo / NISA</h1>
        <Card>
          <p className="text-sm text-ink-muted">プロファイルが見つかりません。</p>
        </Card>
      </div>
    );
  }

  const birth = new Date(profile.birthDate);
  const currentAge = new Date().getFullYear() - birth.getFullYear();

  // Get income tax rate for iDeCo tax saving calculation
  const taxResult = calculateTax({ annualSalary: profile.annualIncome, deductions: [] });
  const taxableIncome = taxResult.taxableIncomeForIncomeTax;
  let incomeTaxRate = 0.05;
  for (const bracket of INCOME_TAX_BRACKETS) {
    if (taxableIncome >= bracket.min && taxableIncome <= bracket.max) {
      incomeTaxRate = bracket.rate;
      break;
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-foreground">iDeCo / NISA</h1>
      <InvestmentSimulator
        currentAge={currentAge}
        occupation={profile.occupation}
        annualSalary={profile.annualIncome}
        tier={profile.tier}
        incomeTaxRate={incomeTaxRate}
      />
    </div>
  );
}
