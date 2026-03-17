import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/shared/loading-skeleton';
import { formatCurrency } from '@/lib/utils/format';
import type { FinancialSummary } from '@/app/(dashboard)/settings/_actions/profile';

interface FinancialSummaryCardProps {
  data: FinancialSummary;
}

export function FinancialSummaryCard({ data }: FinancialSummaryCardProps): React.ReactElement {
  return (
    <>
      {/* 収入サマリー */}
      {data.incomeSources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>登録済み収入源</CardTitle>
          </CardHeader>
          <div className="space-y-1">
            {data.incomeSources.map((inc) => (
              <div key={inc.id} className="flex justify-between text-sm">
                <span className="text-ink-muted">{inc.name ?? inc.category}</span>
                <span className="tabular-nums text-foreground">¥{formatCurrency(inc.monthlyAmount)}/月</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 資産・負債サマリー */}
      <Card>
        <CardHeader>
          <CardTitle>資産・負債</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-ink-subtle">総資産</p>
            <p className="mt-0.5 font-display text-xl tabular-nums text-foreground">
              ¥{formatCurrency(data.assets.reduce((s, a) => s + a.amount, 0))}
            </p>
            <div className="mt-2 space-y-1">
              {data.assets.map((a) => (
                <div key={a.id} className="flex justify-between text-xs">
                  <span className="text-ink-muted">{a.name ?? a.category}</span>
                  <span className="tabular-nums text-foreground">¥{formatCurrency(a.amount)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-ink-subtle">総負債</p>
            <p className="mt-0.5 font-display text-xl tabular-nums text-negative">
              ¥{formatCurrency(data.liabilities.reduce((s, l) => s + l.remainingAmount, 0))}
            </p>
            <div className="mt-2 space-y-1">
              {data.liabilities.map((l) => (
                <div key={l.id} className="flex justify-between text-xs">
                  <span className="text-ink-muted">{l.name ?? l.category}</span>
                  <span className="tabular-nums text-foreground">¥{formatCurrency(l.remainingAmount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-subtle">
          資産・負債の詳細編集はオンボーディングから再設定できます。
        </p>
      </Card>
    </>
  );
}

export function FinancialSummarySkeleton(): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>資産・負債</CardTitle>
      </CardHeader>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    </Card>
  );
}
