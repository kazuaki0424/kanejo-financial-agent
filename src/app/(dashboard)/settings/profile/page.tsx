import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { fetchProfile } from '@/app/(dashboard)/settings/_actions/profile';
import { ProfileEditForm } from './_components/profile-edit-form';

export const metadata: Metadata = {
  title: 'プロフィール編集 — Kanejo',
};

export default async function ProfilePage() {
  const data = await fetchProfile();

  if (!data) {
    redirect('/onboarding');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl text-foreground">プロフィール</h1>
      <ProfileEditForm data={data} />
    </div>
  );
}
