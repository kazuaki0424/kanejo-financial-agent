'use server';

import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase/auth';
import { db } from '@/lib/db/client';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { calculateTax, calculateFurusatoLimit, type Deduction } from '@/lib/utils/calculations';

export interface TaxSummaryData {
  annualSalary: number;
  maritalStatus: string;
  dependents: number;
  age: number;
  occupation: string;
  tier: string;
  taxResult: {
    salaryIncome: number;
    salaryDeduction: number;
    totalDeductions: number;
    incomeTax: number;
    residentTax: number;
    totalTax: number;
    takeHome: number;
    effectiveRate: number;
  };
  furusatoLimit: number;
}

export async function fetchTaxSummary(): Promise<TaxSummaryData | null> {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const [profile] = await db
    .select({
      birthDate: userProfiles.birthDate,
      annualIncome: userProfiles.annualIncome,
      maritalStatus: userProfiles.maritalStatus,
      dependents: userProfiles.dependents,
      occupation: userProfiles.occupation,
      tier: userProfiles.tier,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  if (!profile) return null;

  const deductions: Deduction[] = [];
  if (profile.maritalStatus === 'married') {
    deductions.push({ type: 'spouse', amount: 1 });
  }
  if (profile.dependents && profile.dependents > 0) {
    deductions.push({ type: 'dependent_general', amount: profile.dependents });
  }

  const taxResult = calculateTax({ annualSalary: profile.annualIncome, deductions });
  const furusatoLimit = calculateFurusatoLimit(profile.annualIncome, deductions);

  const birth = new Date(profile.birthDate);
  const age = new Date().getFullYear() - birth.getFullYear();

  return {
    annualSalary: profile.annualIncome,
    maritalStatus: profile.maritalStatus,
    dependents: profile.dependents ?? 0,
    age,
    occupation: profile.occupation,
    tier: profile.tier,
    taxResult: {
      salaryIncome: taxResult.salaryIncome,
      salaryDeduction: taxResult.salaryDeduction,
      totalDeductions: taxResult.totalDeductions,
      incomeTax: taxResult.finalIncomeTax,
      residentTax: taxResult.finalResidentTax,
      totalTax: taxResult.totalTax,
      takeHome: taxResult.takeHome,
      effectiveRate: taxResult.effectiveRate,
    },
    furusatoLimit,
  };
}
