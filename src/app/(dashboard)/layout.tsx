import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase/auth';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.ReactElement> {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  return <DashboardShell userEmail={user.email}>{children}</DashboardShell>;
}
