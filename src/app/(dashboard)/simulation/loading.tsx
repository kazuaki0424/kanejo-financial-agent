import { ChartSkeleton, MetricCardSkeleton } from '@/components/shared/loading-skeleton';

export default function SimulationLoading(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="h-9 w-32 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-hover)]" />
      <MetricCardSkeleton />
      <ChartSkeleton />
    </div>
  );
}
