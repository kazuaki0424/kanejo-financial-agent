/**
 * 補助金データのシード/更新スクリプト
 *
 * Usage:
 *   npx tsx scripts/seed-subsidies.ts
 *   npx tsx scripts/seed-subsidies.ts --force  (既存データを上書き)
 *
 * 将来的には外部API（e-Gov API、自治体オープンデータ等）から
 * 自動取得する機能を追加する。現在はハードコードデータを投入。
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(sql, { schema });

const SUBSIDIES_DATA: Array<{
  id: string;
  name: string;
  category: string;
  provider: string;
  summary: string;
  amount: string;
  conditions: Array<{ type: string; label: string }>;
  applicationDeadline: string | null;
  url: string;
  tags: string[];
  prefectures: string[] | null;
}> = [
  {
    id: 'child-allowance',
    name: '児童手当',
    category: 'child',
    provider: '国（厚生労働省）',
    summary: '中学校卒業まで（15歳の誕生日後の最初の3月31日まで）の児童を養育している方に支給',
    amount: '月額10,000〜15,000円/人',
    conditions: [{ type: 'family', label: '子どもがいる' }],
    applicationDeadline: null,
    url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kodomo/kodomo_kosodate/jidouteate/',
    tags: ['全国', '毎月支給'],
    prefectures: null,
  },
  {
    id: 'child-medical',
    name: '子ども医療費助成',
    category: 'child',
    provider: '各自治体',
    summary: '子どもの医療費の自己負担分を助成。対象年齢・所得制限は自治体により異なる',
    amount: '医療費の自己負担分（全額〜一部）',
    conditions: [{ type: 'family', label: '子どもがいる' }],
    applicationDeadline: null,
    url: '',
    tags: ['自治体', '医療費'],
    prefectures: null,
  },
  {
    id: 'maternity-lump',
    name: '出産育児一時金',
    category: 'child',
    provider: '健康保険組合',
    summary: '出産時に健康保険から支給される一時金',
    amount: '500,000円',
    conditions: [{ type: 'custom', label: '健康保険加入者' }],
    applicationDeadline: null,
    url: '',
    tags: ['全国', '出産'],
    prefectures: null,
  },
  {
    id: 'housing-loan-deduction',
    name: '住宅ローン控除',
    category: 'housing',
    provider: '国（国税庁）',
    summary: '住宅ローンの年末残高の0.7%を最大13年間、所得税から控除',
    amount: '最大35万円/年（新築・省エネ）',
    conditions: [{ type: 'income', label: '合計所得2,000万円以下' }],
    applicationDeadline: '確定申告期間（2-3月）',
    url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1211-1.htm',
    tags: ['全国', '税額控除', '住宅ローン'],
    prefectures: null,
  },
  {
    id: 'eco-home',
    name: '子育てエコホーム支援事業',
    category: 'housing',
    provider: '国土交通省',
    summary: '省エネ住宅の新築・リフォームに対する補助金',
    amount: '最大100万円',
    conditions: [{ type: 'custom', label: '住宅の新築・リフォーム' }],
    applicationDeadline: '予算上限に達し次第終了',
    url: '',
    tags: ['全国', '省エネ', '新築・リフォーム'],
    prefectures: null,
  },
  {
    id: 'high-cost-medical',
    name: '高額療養費制度',
    category: 'medical',
    provider: '健康保険組合',
    summary: '1ヶ月の医療費が自己負担限度額を超えた場合、超過分が払い戻される',
    amount: '自己負担限度額を超えた分',
    conditions: [{ type: 'custom', label: '健康保険加入者' }],
    applicationDeadline: '診療月の翌月1日から2年以内',
    url: '',
    tags: ['全国', '医療費'],
    prefectures: null,
  },
  {
    id: 'medical-deduction',
    name: '医療費控除',
    category: 'medical',
    provider: '国（国税庁）',
    summary: '年間医療費が10万円を超えた場合、確定申告で所得控除が受けられる',
    amount: '所得控除（税率に応じた還付）',
    conditions: [{ type: 'custom', label: '年間医療費10万円超' }],
    applicationDeadline: '確定申告期間（2-3月）',
    url: '',
    tags: ['全国', '確定申告'],
    prefectures: null,
  },
  {
    id: 'tuition-free',
    name: '高等教育の修学支援新制度',
    category: 'education',
    provider: '文部科学省',
    summary: '住民税非課税世帯等の学生の授業料減免と給付型奨学金',
    amount: '最大年間約91万円',
    conditions: [
      { type: 'income', label: '世帯年収約380万円以下' },
      { type: 'family', label: '子どもがいる' },
    ],
    applicationDeadline: '各大学の定める期限',
    url: '',
    tags: ['全国', '大学・専門学校'],
    prefectures: null,
  },
  {
    id: 'training-benefit',
    name: '教育訓練給付金',
    category: 'employment',
    provider: 'ハローワーク',
    summary: '厚労大臣指定の教育訓練を受講・修了した場合に受講費用の一部が支給',
    amount: '受講費用の20〜70%（上限あり）',
    conditions: [{ type: 'occupation', label: '雇用保険加入者' }],
    applicationDeadline: '受講開始日の1ヶ月前まで',
    url: '',
    tags: ['全国', 'スキルアップ'],
    prefectures: null,
  },
  {
    id: 'startup-subsidy',
    name: '小規模事業者持続化補助金',
    category: 'employment',
    provider: '中小企業庁',
    summary: '小規模事業者の販路開拓等の経費の一部を補助',
    amount: '最大50〜200万円',
    conditions: [{ type: 'occupation', label: '自営業・経営者' }],
    applicationDeadline: '公募期間中',
    url: '',
    tags: ['自営業', '補助金'],
    prefectures: null,
  },
  {
    id: 'furusato-tax',
    name: 'ふるさと納税',
    category: 'tax',
    provider: '総務省',
    summary: '自治体への寄付により、自己負担2,000円で返礼品を受け取りながら税控除',
    amount: '年収・家族構成により上限額が決まる',
    conditions: [{ type: 'income', label: '住民税を納めている' }],
    applicationDeadline: '12月31日（年末）',
    url: '',
    tags: ['全国', '節税'],
    prefectures: null,
  },
  {
    id: 'ideco-deduction',
    name: 'iDeCo（個人型確定拠出年金）',
    category: 'tax',
    provider: '国民年金基金連合会',
    summary: '掛金が全額所得控除。運用益非課税。受取時にも控除あり',
    amount: '月額5,000〜68,000円（職業による）',
    conditions: [{ type: 'age', label: '65歳未満' }],
    applicationDeadline: null,
    url: '',
    tags: ['全国', '年金', '節税'],
    prefectures: null,
  },
];

async function main(): Promise<void> {
  const forceUpdate = process.argv.includes('--force');

  console.log(`補助金データのシード開始... (force=${forceUpdate})`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const data of SUBSIDIES_DATA) {
    const existing = await db
      .select({ id: schema.subsidiesMaster.id })
      .from(schema.subsidiesMaster)
      .where(eq(schema.subsidiesMaster.id, data.id))
      .limit(1);

    if (existing.length > 0 && !forceUpdate) {
      skipped++;
      continue;
    }

    if (existing.length > 0) {
      await db.update(schema.subsidiesMaster)
        .set({
          name: data.name,
          category: data.category,
          provider: data.provider,
          summary: data.summary,
          amount: data.amount,
          conditions: data.conditions,
          applicationDeadline: data.applicationDeadline,
          url: data.url,
          tags: data.tags,
          prefectures: data.prefectures,
          updatedAt: new Date(),
        })
        .where(eq(schema.subsidiesMaster.id, data.id));
      updated++;
    } else {
      await db.insert(schema.subsidiesMaster).values({
        id: data.id,
        name: data.name,
        category: data.category,
        provider: data.provider,
        summary: data.summary,
        amount: data.amount,
        conditions: data.conditions,
        applicationDeadline: data.applicationDeadline,
        url: data.url,
        tags: data.tags,
        prefectures: data.prefectures,
      });
      inserted++;
    }
  }

  // Update freshness tracking
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const existingFreshness = await db
    .select({ id: schema.dataFreshness.id })
    .from(schema.dataFreshness)
    .where(eq(schema.dataFreshness.id, 'subsidies'))
    .limit(1);

  if (existingFreshness.length > 0) {
    await db.update(schema.dataFreshness)
      .set({
        lastUpdated: now,
        nextUpdate: nextWeek,
        recordCount: SUBSIDIES_DATA.length,
        status: 'ok',
        lastError: null,
      })
      .where(eq(schema.dataFreshness.id, 'subsidies'));
  } else {
    await db.insert(schema.dataFreshness).values({
      id: 'subsidies',
      lastUpdated: now,
      nextUpdate: nextWeek,
      recordCount: SUBSIDIES_DATA.length,
      status: 'ok',
    });
  }

  console.log(`完了: ${inserted}件追加, ${updated}件更新, ${skipped}件スキップ`);
  console.log(`合計: ${SUBSIDIES_DATA.length}件`);

  await sql.end();
}

main().catch((err) => {
  console.error('エラー:', err);
  process.exit(1);
});
