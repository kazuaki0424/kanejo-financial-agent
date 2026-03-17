import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { getAuthUser } from '@/lib/supabase/auth';
import { db } from '@/lib/db/client';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { matchSubsidies, type MatchProfile } from '@/lib/constants/subsidies';
import { SubsidyMatchList } from './_components/subsidy-match-list';

export const metadata: Metadata = {
  title: '補助金・給付金 — Kanejo',
};

export default async function SubsidiesPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const [profile] = await db
    .select({
      birthDate: userProfiles.birthDate,
      annualIncome: userProfiles.annualIncome,
      prefecture: userProfiles.prefecture,
      maritalStatus: userProfiles.maritalStatus,
      dependents: userProfiles.dependents,
      occupation: userProfiles.occupation,
      childrenAges: userProfiles.childrenAges,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  if (!profile) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl text-foreground">補助金・給付金</h1>
        <Card>
          <p className="text-sm text-ink-muted">プロファイルが見つかりません。</p>
        </Card>
      </div>
    );
  }

  const birth = new Date(profile.birthDate);
  const age = new Date().getFullYear() - birth.getFullYear();
  const hasChildren = (profile.dependents ?? 0) > 0 || (profile.childrenAges?.length ?? 0) > 0;

  const matchProfile: MatchProfile = {
    age,
    annualIncome: profile.annualIncome,
    prefecture: profile.prefecture,
    maritalStatus: profile.maritalStatus,
    dependents: profile.dependents ?? 0,
    occupation: profile.occupation,
    hasChildren,
  };

  const results = matchSubsidies(matchProfile);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-foreground">補助金・給付金</h1>
      <SubsidyMatchList results={results} />
    </div>
  );
}
