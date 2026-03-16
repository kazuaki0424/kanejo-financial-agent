import { cn } from '@/lib/utils/cn';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps): React.ReactElement {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-hover)]',
        className,
      )}
    />
  );
}

export function MetricCardSkeleton(): React.ReactElement {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-3 h-8 w-32" />
      <Skeleton className="mt-3 h-3 w-20" />
    </div>
  );
}

export function ChartSkeleton(): React.ReactElement {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-[250px] w-full" />
    </div>
  );
}

export function DashboardSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}

export function DiagnosisSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-32" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex items-center justify-center rounded-[var(--radius-lg)] border border-border bg-surface p-6">
          <Skeleton className="h-48 w-48 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}

export function ProfileSkeleton(): React.ReactElement {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Skeleton className="h-9 w-36" />
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 space-y-4">
        <Skeleton className="h-5 w-24" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
