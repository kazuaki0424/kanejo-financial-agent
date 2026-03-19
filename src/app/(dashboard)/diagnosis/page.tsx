import type { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchDiagnosisData } from '@/app/(dashboard)/_actions/dashboard';
import { SpendingCategorySection } from '@/app/(dashboard)/_components/spending-category-section';
import { AssetPortfolioSection } from '@/app/(dashboard)/_components/asset-portfolio-section';
import { ScoreGauge } from './_components/score-gauge';
import { ScoreRadarCard } from './_components/score-radar-card';
import { ImprovementList } from './_components/improvement-list';
import { DataEntrySection } from './_components/data-entry-section';
import { AiInsightCard } from '@/app/(dashboard)/_components/ai-insight-card';
import { formatCurrency } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: '家計診断 — Kanejo',
};

export const maxDuration = 30;

const TIER_LABELS: Record<string, string> = {
  basic: 'ベーシック',
  middle: 'ミドル',
  high_end: 'ハイエンド',
};

export default async function DiagnosisPage() {
  const data = await fetchDiagnosisData();

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl text-foreground">家計診断</h1>
        <Card>
          <p className="text-sm text-ink-muted">
            プロファイルが見つかりません。オンボーディングを完了してください。
          </p>
        </Card>
      </div>
    );
  }

  const { metrics, categories, portfolio } = data;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-3xl text-foreground">家計診断</h1>
        <Badge variant="primary">{TIER_LABELS[metrics.tier] ?? metrics.tier}</Badge>
      </div>

      {/* スコアゲージ + サマリーカード */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex items-center justify-center lg:col-span-1">
          <ScoreGauge score={metrics.householdScore} grade={metrics.householdGrade} />
        </Card>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <SummaryCard label="月収" value={`¥${formatCurrency(metrics.monthlyIncome)}`} />
          <SummaryCard label="月支出" value={`¥${formatCurrency(metrics.monthlyExpenses)}`} />
          <SummaryCard
            label="貯蓄率"
            value={`${metrics.savingsRate}%`}
            highlight={metrics.savingsRate >= 20 ? 'positive' : metrics.savingsRate >= 0 ? 'default' : 'negative'}
          />
          <SummaryCard
            label="純資産"
            value={`${metrics.netWorth < 0 ? '-' : ''}¥${formatCurrency(Math.abs(metrics.netWorth))}`}
            highlight={metrics.netWorth >= 0 ? 'positive' : 'negative'}
          />
        </div>
      </div>

      {/* レーダーチャート + 改善ポイント */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ScoreRadarCard breakdown={metrics.scoreBreakdown} />
        <ImprovementList breakdown={metrics.scoreBreakdown} tier={metrics.tier} />
      </div>

      {/* データ入力 + AIインサイト */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DataEntrySection />
        <AiInsightCard autoGenerate />
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
        <AssetPortfolioSection portfolio={portfolio} />
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  highlight = 'default',
}: {
  label: string;
  value: string;
  highlight?: 'positive' | 'negative' | 'default';
}): React.ReactElement {
  const valueColor =
    highlight === 'positive' ? 'text-positive'
    : highlight === 'negative' ? 'text-negative'
    : 'text-foreground';

  return (
    <Card>
      <p className="text-[13px] text-ink-muted">{label}</p>
      <p className={`mt-1 font-display text-xl tabular-nums ${valueColor}`}>
        {value}
      </p>
    </Card>
  );
}
