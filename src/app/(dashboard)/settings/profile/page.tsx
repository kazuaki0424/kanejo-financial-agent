import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { fetchProfileCore, fetchFinancialSummary } from '@/app/(dashboard)/settings/_actions/profile';
import { ProfileEditForm } from './_components/profile-edit-form';
import { FinancialSummaryCard, FinancialSummarySkeleton } from './_components/financial-summary-card';

export const metadata: Metadata = {
  title: 'プロフィール編集 — Kanejo',
};

export default async function ProfilePage(): Promise<React.ReactElement> {
  const profile = await fetchProfileCore();

  if (!profile) {
    redirect('/onboarding');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl text-foreground">プロフィール</h1>
      <ProfileEditForm profile={profile}>
        <Suspense fallback={<FinancialSummarySkeleton />}>
          <DeferredFinancialSummary />
        </Suspense>
      </ProfileEditForm>
    </div>
  );
}

async function DeferredFinancialSummary(): Promise<React.ReactElement> {
  const data = await fetchFinancialSummary();

  if (!data) {
    return <></>;
  }

  return <FinancialSummaryCard data={data} />;
}
