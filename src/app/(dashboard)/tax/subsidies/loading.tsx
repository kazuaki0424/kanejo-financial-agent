import { ChartSkeleton } from '@/components/shared/loading-skeleton';

export default function SubsidiesLoading(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="h-9 w-40 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-hover)]" />
      <ChartSkeleton />
    </div>
  );
}
