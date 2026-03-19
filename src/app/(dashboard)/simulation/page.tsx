import type { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import { fetchSimulationData } from './_actions/simulation';
import { SimulationRunner } from './_components/simulation-runner';

export const maxDuration = 30;

export const metadata: Metadata = {
  title: 'ライフプランシミュレーション — Kanejo',
};

export default async function SimulationPage() {
  const data = await fetchSimulationData();

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl text-foreground">ライフプランシミュレーション</h1>
        <Card>
          <p className="text-sm text-ink-muted">
            プロファイルが見つかりません。オンボーディングを完了してください。
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-foreground">ライフプランシミュレーション</h1>
      <SimulationRunner initialData={data} />
    </div>
  );
}
