import type { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import { fetchTaxSummary } from '@/app/(dashboard)/tax/_actions/tax';
import { FurusatoSimulator } from './_components/furusato-simulator';

export const metadata: Metadata = {
  title: 'ふるさと納税 — Kanejo',
};

export default async function FurusatoPage() {
  const data = await fetchTaxSummary();

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl text-foreground">ふるさと納税</h1>
        <Card>
          <p className="text-sm text-ink-muted">プロファイルが見つかりません。</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-foreground">ふるさと納税</h1>
      <FurusatoSimulator
        annualSalary={data.annualSalary}
        maritalStatus={data.maritalStatus}
        dependents={data.dependents}
        furusatoLimit={data.furusatoLimit}
      />
    </div>
  );
}
