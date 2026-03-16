'use client';

import { AnimatedMetricCard } from './animated-metric-card';
import { HouseholdScoreCard } from './household-score-card';
import type { DashboardMetrics } from '@/app/(dashboard)/_actions/dashboard';

interface MetricsGridProps {
  metrics: DashboardMetrics;
}

export function MetricsGrid({ metrics }: MetricsGridProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AnimatedMetricCard
          label="月収"
          value={metrics.monthlyIncome}
          prefix="¥"
          format="currency"
        />
        <AnimatedMetricCard
          label="月支出"
          value={metrics.monthlyExpenses}
          prefix="¥"
          format="currency"
        />
        <AnimatedMetricCard
          label="貯蓄率"
          value={metrics.savingsRate}
          suffix="%"
          format="percent"
        />
        <HouseholdScoreCard
          score={metrics.householdScore}
          grade={metrics.householdGrade}
          breakdown={metrics.scoreBreakdown}
        />
      </div>
    </div>
  );
}
