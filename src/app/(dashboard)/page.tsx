import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import {
  fetchDashboardMetrics,
  fetchMonthlyChartData,
  fetchExpenseCategories,
  fetchPortfolioData,
} from '@/app/(dashboard)/_actions/dashboard';
import { MetricsGrid } from './_components/metrics-grid';
import { Skeleton } from '@/components/shared/loading-skeleton';

// Dynamic imports for heavy chart components (Recharts + Framer Motion)
const IncomeExpenseSection = dynamic(
  () => import('./_components/income-expense-section').then((m) => ({ default: m.IncomeExpenseSection })),
  { loading: () => <ChartPlaceholder />, ssr: true },
);

const NetWorthCard = dynamic(
  () => import('./_components/net-worth-card').then((m) => ({ default: m.NetWorthCard })),
  { ssr: true },
);

const SpendingCategorySection = dynamic(
  () => import('./_components/spending-category-section').then((m) => ({ default: m.SpendingCategorySection })),
  { loading: () => <ChartPlaceholder />, ssr: true },
);

const AssetPortfolioSection = dynamic(
  () => import('./_components/asset-portfolio-section').then((m) => ({ default: m.AssetPortfolioSection })),
  { loading: () => <ChartPlaceholder />, ssr: true },
);

const AiInsightCard = dynamic(
  () => import('./_components/ai-insight-card').then((m) => ({ default: m.AiInsightCard })),
  { ssr: true },
);

function ChartPlaceholder(): React.ReactElement {
  return (
    <Card className="min-h-[280px]">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-[220px] w-full" />
    </Card>
  );
}

export default async function DashboardPage() {
  const [metrics, chartData, categories, portfolio] = await Promise.all([
    fetchDashboardMetrics(),
    fetchMonthlyChartData(),
    fetchExpenseCategories(),
    fetchPortfolioData(),
  ]);

  if (!metrics) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl text-foreground">ダッシュボード</h1>
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
      <h1 className="font-display text-3xl text-foreground">ダッシュボード</h1>

      {/* メトリクスカード4枚 */}
      <MetricsGrid metrics={metrics} />

      {/* 収支チャート + 純資産 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <IncomeExpenseSection data={chartData} />
        <NetWorthCard
          totalAssets={metrics.totalAssets}
          totalLiabilities={metrics.totalLiabilities}
          netWorth={metrics.netWorth}
        />
      </div>

      {/* 支出カテゴリ + 資産ポートフォリオ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {categories.length > 0 ? (
          <SpendingCategorySection categories={categories} />
        ) : (
          <Card className="min-h-[200px]">
            <p className="text-[13px] text-ink-muted">支出カテゴリ分析</p>
            <p className="mt-8 text-center text-sm text-ink-subtle">支出データがありません</p>
          </Card>
        )}
        {portfolio ? (
          <AssetPortfolioSection portfolio={portfolio} />
        ) : (
          <Card className="min-h-[200px]">
            <p className="text-[13px] text-ink-muted">資産ポートフォリオ</p>
            <p className="mt-8 text-center text-sm text-ink-subtle">資産データがありません</p>
          </Card>
        )}
      </div>

      {/* AIインサイト */}
      <AiInsightCard />
    </div>
  );
}
