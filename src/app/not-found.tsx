import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="max-w-md text-center">
        <h1 className="font-display text-5xl text-foreground">404</h1>
        <h2 className="mt-2 text-lg font-medium text-foreground">ページが見つかりません</h2>
        <p className="mt-2 text-sm text-ink-muted">
          お探しのページは存在しないか、移動された可能性があります。
        </p>
        <Button asChild className="mt-6">
          <Link href="/">ダッシュボードに戻る</Link>
        </Button>
      </Card>
    </div>
  );
}
