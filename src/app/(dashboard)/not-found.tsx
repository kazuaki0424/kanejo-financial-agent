import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <Card className="max-w-md text-center">
        <h2 className="text-lg font-medium text-foreground">ページが見つかりません</h2>
        <p className="mt-2 text-sm text-ink-muted">
          お探しのページは存在しないか、移動された可能性があります。
        </p>
        <Button asChild variant="secondary" size="sm" className="mt-4">
          <Link href="/">ダッシュボードに戻る</Link>
        </Button>
      </Card>
    </div>
  );
}
