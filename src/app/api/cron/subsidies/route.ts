import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { dataFreshness } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 補助金データの鮮度チェック Cron エンドポイント
 *
 * Vercel Cron Jobs でスケジュール実行:
 *   vercel.json: { "crons": [{ "path": "/api/cron/subsidies", "schedule": "0 3 * * 1" }] }
 *   (毎週月曜 AM3:00)
 *
 * 将来的には外部APIからデータを取得・更新する。
 * 現在は鮮度チェックとステータス更新のみ。
 */
export async function GET(request: Request): Promise<Response> {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [freshness] = await db
      .select()
      .from(dataFreshness)
      .where(eq(dataFreshness.id, 'subsidies'))
      .limit(1);

    const now = new Date();

    if (!freshness) {
      return NextResponse.json({
        status: 'no_data',
        message: 'No subsidies data found. Run seed-subsidies.ts first.',
      });
    }

    const isStale = freshness.nextUpdate < now;

    if (isStale) {
      // Mark as stale — in production, this would trigger a data refresh
      await db.update(dataFreshness)
        .set({ status: 'stale' })
        .where(eq(dataFreshness.id, 'subsidies'));

      return NextResponse.json({
        status: 'stale',
        lastUpdated: freshness.lastUpdated,
        nextUpdate: freshness.nextUpdate,
        recordCount: freshness.recordCount,
        message: 'Data is stale. Refresh needed.',
      });
    }

    return NextResponse.json({
      status: 'ok',
      lastUpdated: freshness.lastUpdated,
      nextUpdate: freshness.nextUpdate,
      recordCount: freshness.recordCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    try {
      await db.update(dataFreshness)
        .set({ status: 'error', lastError: message })
        .where(eq(dataFreshness.id, 'subsidies'));
    } catch {
      // Double fault — ignore
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
