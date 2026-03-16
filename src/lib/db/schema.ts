import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  numeric,
  boolean,
  date,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================
// user_profiles — ユーザー基本プロファイル（Supabase Auth と 1:1）
// ============================================================
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique(),
  birthDate: date('birth_date').notNull(),
  gender: text('gender'), // 'male' | 'female' | 'other' | null
  prefecture: text('prefecture').notNull(),
  city: text('city'),
  maritalStatus: text('marital_status').notNull(), // 'single' | 'married'
  dependents: integer('dependents').default(0),
  childrenAges: jsonb('children_ages').$type<number[]>(),
  occupation: text('occupation').notNull(), // 'employee' | 'self_employed' | 'part_time' | 'retired' | 'student' | 'other'
  tier: text('tier').notNull(), // 'basic' | 'middle' | 'high_end'
  annualIncome: integer('annual_income').notNull(),
  financialGoals: jsonb('financial_goals').$type<string[]>(),
  riskTolerance: text('risk_tolerance'), // 'conservative' | 'moderate' | 'aggressive'
  onboardingCompleted: boolean('onboarding_completed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================
// income_sources — 収入源（給与・副業・投資収入 等）
// ============================================================
export const incomeSources = pgTable('income_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  category: text('category').notNull(), // 'salary' | 'side_job' | 'investment' | 'pension' | 'rental' | 'other'
  name: text('name'),
  monthlyAmount: integer('monthly_amount').notNull(),
  isGross: boolean('is_gross').default(true),
  isRecurring: boolean('is_recurring').default(true),
  startDate: date('start_date'),
  endDate: date('end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================
// expense_records — 支出記録（月次ベース）
// ============================================================
export const expenseRecords = pgTable('expense_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  category: text('category').notNull(),
  // 'housing' | 'food' | 'transportation' | 'utilities' | 'communication'
  // | 'insurance' | 'medical' | 'education' | 'entertainment' | 'clothing'
  // | 'subscription' | 'tax' | 'other'
  name: text('name'),
  monthlyAmount: integer('monthly_amount').notNull(),
  isFixed: boolean('is_fixed').default(false),
  isRecurring: boolean('is_recurring').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================
// assets — 資産
// ============================================================
export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  category: text('category').notNull(),
  // 'cash' | 'stocks' | 'bonds' | 'mutual_funds'
  // | 'real_estate' | 'crypto' | 'insurance_value' | 'other'
  name: text('name'),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  currency: text('currency').default('JPY'),
  institution: text('institution'),
  interestRate: numeric('interest_rate'),
  maturityDate: date('maturity_date'),
  isLiquid: boolean('is_liquid').default(true),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================
// liabilities — 負債（ローン・借入）
// ============================================================
export const liabilities = pgTable('liabilities', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  category: text('category').notNull(),
  // 'mortgage' | 'car_loan' | 'student_loan' | 'credit_card' | 'consumer_loan' | 'other'
  name: text('name'),
  principalAmount: bigint('principal_amount', { mode: 'number' }).notNull(),
  remainingAmount: bigint('remaining_amount', { mode: 'number' }).notNull(),
  interestRate: numeric('interest_rate'),
  monthlyPayment: integer('monthly_payment'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================
// profile_snapshots — プロファイル変更履歴
// ============================================================
export const profileSnapshots = pgTable('profile_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  snapshot: jsonb('snapshot').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================
// ai_insight_cache — AIインサイトのキャッシュ
// ============================================================
export const aiInsightCache = pgTable('ai_insight_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  type: text('type').notNull(), // 'diagnosis' | 'tax' | 'simulation'
  content: text('content').notNull(),
  contextHash: text('context_hash').notNull(), // hash of input data to detect staleness
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});

// ============================================================
// financial_services — 金融サービスマスターデータ
// ============================================================
export const financialServices = pgTable('financial_services', {
  id: text('id').primaryKey(),
  category: text('category').notNull(), // 'credit_card' | 'insurance' | 'loan' | 'utility' | 'telecom'
  name: text('name').notNull(),
  provider: text('provider').notNull(),
  description: text('description'),
  monthlyFee: integer('monthly_fee').default(0),
  annualFee: integer('annual_fee').default(0),
  features: jsonb('features').$type<Array<{ label: string; value: string }>>(),
  conditions: jsonb('conditions').$type<Record<string, unknown>>(),
  rating: numeric('rating'),
  url: text('url'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================
// subsidies_master — 補助金マスターデータ
// ============================================================
export const subsidiesMaster = pgTable('subsidies_master', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  provider: text('provider').notNull(),
  summary: text('summary').notNull(),
  amount: text('amount').notNull(),
  conditions: jsonb('conditions').$type<Array<{ type: string; label: string }>>(),
  applicationDeadline: text('application_deadline'),
  url: text('url'),
  tags: jsonb('tags').$type<string[]>(),
  prefectures: jsonb('prefectures').$type<string[]>(), // null = 全国
  isActive: boolean('is_active').default(true),
  sourceId: text('source_id'), // external data source ID
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================
// data_freshness — データ鮮度管理
// ============================================================
export const dataFreshness = pgTable('data_freshness', {
  id: text('id').primaryKey(), // e.g. 'subsidies', 'tax_rates'
  lastUpdated: timestamp('last_updated').notNull(),
  nextUpdate: timestamp('next_update').notNull(),
  recordCount: integer('record_count').default(0),
  status: text('status').notNull().default('ok'), // 'ok' | 'stale' | 'error'
  lastError: text('last_error'),
  metadata: jsonb('metadata'),
});

// ============================================================
// Relations
// ============================================================
export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  incomeSources: many(incomeSources),
  expenseRecords: many(expenseRecords),
  assets: many(assets),
  liabilities: many(liabilities),
  snapshots: many(profileSnapshots),
}));

export const incomeSourcesRelations = relations(incomeSources, ({ one }) => ({
  profile: one(userProfiles, {
    fields: [incomeSources.userId],
    references: [userProfiles.userId],
  }),
}));

export const expenseRecordsRelations = relations(expenseRecords, ({ one }) => ({
  profile: one(userProfiles, {
    fields: [expenseRecords.userId],
    references: [userProfiles.userId],
  }),
}));

export const assetsRelations = relations(assets, ({ one }) => ({
  profile: one(userProfiles, {
    fields: [assets.userId],
    references: [userProfiles.userId],
  }),
}));

export const liabilitiesRelations = relations(liabilities, ({ one }) => ({
  profile: one(userProfiles, {
    fields: [liabilities.userId],
    references: [userProfiles.userId],
  }),
}));

export const profileSnapshotsRelations = relations(profileSnapshots, ({ one }) => ({
  profile: one(userProfiles, {
    fields: [profileSnapshots.userId],
    references: [userProfiles.userId],
  }),
}));
