import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.ReactElement> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <DashboardShell userEmail={user?.email}>{children}</DashboardShell>;
}
