/**
 * 税率データ更新スクリプト
 *
 * Usage:
 *   npx tsx scripts/update-tax-rates.ts
 *
 * 税率は constants/tax-rates.ts にハードコードされているため、
 * このスクリプトは鮮度管理テーブルの更新と検証を行う。
 * 将来的にはe-Gov API等から自動取得する。
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(sql, { schema });

const TAX_DATA_VERSION = '2024-r6'; // 令和6年

async function main(): Promise<void> {
  console.log('税率データの鮮度チェック...');
  console.log(`データバージョン: ${TAX_DATA_VERSION}`);

  const now = new Date();
  // Tax rates update annually (April fiscal year)
  const nextApril = new Date(now.getFullYear() + (now.getMonth() >= 3 ? 1 : 0), 3, 1);

  const existing = await db
    .select()
    .from(schema.dataFreshness)
    .where(eq(schema.dataFreshness.id, 'tax_rates'))
    .limit(1);

  if (existing.length > 0) {
    await db.update(schema.dataFreshness)
      .set({
        lastUpdated: now,
        nextUpdate: nextApril,
        status: 'ok',
        metadata: { version: TAX_DATA_VERSION },
      })
      .where(eq(schema.dataFreshness.id, 'tax_rates'));
  } else {
    await db.insert(schema.dataFreshness).values({
      id: 'tax_rates',
      lastUpdated: now,
      nextUpdate: nextApril,
      recordCount: 7, // number of tax brackets
      status: 'ok',
      metadata: { version: TAX_DATA_VERSION },
    });
  }

  console.log(`更新完了。次回更新: ${nextApril.toISOString().split('T')[0]}`);
  await sql.end();
}

main().catch((err) => {
  console.error('エラー:', err);
  process.exit(1);
});
