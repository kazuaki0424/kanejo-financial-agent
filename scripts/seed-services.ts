/**
 * 金融サービスデータのシードスクリプト
 *
 * Usage:
 *   npx tsx scripts/seed-services.ts
 *   npx tsx scripts/seed-services.ts --force
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';
import { ALL_SERVICES } from '../src/lib/constants/financial-services';

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(sql, { schema });

async function main(): Promise<void> {
  const forceUpdate = process.argv.includes('--force');
  console.log(`金融サービスデータのシード開始... (force=${forceUpdate})`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const service of ALL_SERVICES) {
    const existing = await db
      .select({ id: schema.financialServices.id })
      .from(schema.financialServices)
      .where(eq(schema.financialServices.id, service.id))
      .limit(1);

    if (existing.length > 0 && !forceUpdate) {
      skipped++;
      continue;
    }

    const record = {
      id: service.id,
      category: service.category,
      name: service.name,
      provider: service.provider,
      description: service.description,
      monthlyFee: service.monthlyFee,
      annualFee: service.annualFee,
      features: service.features,
      conditions: { bestFor: service.bestFor, highlights: service.highlights },
      rating: String(service.rating),
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db.update(schema.financialServices).set(record).where(eq(schema.financialServices.id, service.id));
      updated++;
    } else {
      await db.insert(schema.financialServices).values(record);
      inserted++;
    }
  }

  // Update freshness
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const existing = await db.select({ id: schema.dataFreshness.id }).from(schema.dataFreshness).where(eq(schema.dataFreshness.id, 'financial_services')).limit(1);
  if (existing.length > 0) {
    await db.update(schema.dataFreshness).set({ lastUpdated: now, nextUpdate: nextMonth, recordCount: ALL_SERVICES.length, status: 'ok' }).where(eq(schema.dataFreshness.id, 'financial_services'));
  } else {
    await db.insert(schema.dataFreshness).values({ id: 'financial_services', lastUpdated: now, nextUpdate: nextMonth, recordCount: ALL_SERVICES.length, status: 'ok' });
  }

  console.log(`完了: ${inserted}件追加, ${updated}件更新, ${skipped}件スキップ (合計${ALL_SERVICES.length}件)`);
  await sql.end();
}

main().catch((err) => { console.error('エラー:', err); process.exit(1); });
