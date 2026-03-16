import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { LearningHub } from './_components/learning-hub';

export const metadata: Metadata = {
  title: '金融リテラシー — Kanejo',
};

export default async function LearnPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [profile] = await db
    .select({ tier: userProfiles.tier })
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-foreground">金融リテラシー</h1>
      <LearningHub tier={profile?.tier ?? 'basic'} />
    </div>
  );
}
