import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type {
  userProfiles,
  incomeSources,
  expenseRecords,
  assets,
  liabilities,
  profileSnapshots,
} from '@/lib/db/schema';

// Select types (読み取り)
export type UserProfile = InferSelectModel<typeof userProfiles>;
export type IncomeSource = InferSelectModel<typeof incomeSources>;
export type ExpenseRecord = InferSelectModel<typeof expenseRecords>;
export type Asset = InferSelectModel<typeof assets>;
export type Liability = InferSelectModel<typeof liabilities>;
export type ProfileSnapshot = InferSelectModel<typeof profileSnapshots>;

// Insert types (書き込み)
export type NewUserProfile = InferInsertModel<typeof userProfiles>;
export type NewIncomeSource = InferInsertModel<typeof incomeSources>;
export type NewExpenseRecord = InferInsertModel<typeof expenseRecords>;
export type NewAsset = InferInsertModel<typeof assets>;
export type NewLiability = InferInsertModel<typeof liabilities>;
export type NewProfileSnapshot = InferInsertModel<typeof profileSnapshots>;

// Domain constants
export const GENDER_VALUES = ['male', 'female', 'other'] as const;
export type Gender = (typeof GENDER_VALUES)[number];

export const MARITAL_STATUS_VALUES = ['single', 'married'] as const;
export type MaritalStatus = (typeof MARITAL_STATUS_VALUES)[number];

export const OCCUPATION_VALUES = ['employee', 'self_employed', 'part_time', 'retired', 'student', 'other'] as const;
export type Occupation = (typeof OCCUPATION_VALUES)[number];

export const TIER_VALUES = ['basic', 'middle', 'high_end'] as const;
export type Tier = (typeof TIER_VALUES)[number];

export const RISK_TOLERANCE_VALUES = ['conservative', 'moderate', 'aggressive'] as const;
export type RiskTolerance = (typeof RISK_TOLERANCE_VALUES)[number];

export const INCOME_CATEGORY_VALUES = ['salary', 'side_job', 'investment', 'pension', 'rental', 'other'] as const;
export type IncomeCategory = (typeof INCOME_CATEGORY_VALUES)[number];

export const EXPENSE_CATEGORY_VALUES = [
  'housing', 'food', 'transportation', 'utilities', 'communication',
  'insurance', 'medical', 'education', 'entertainment', 'clothing',
  'subscription', 'tax', 'other',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORY_VALUES)[number];

export const ASSET_CATEGORY_VALUES = [
  'cash', 'stocks', 'bonds', 'mutual_funds',
  'real_estate', 'crypto', 'insurance_value', 'other',
] as const;
export type AssetCategory = (typeof ASSET_CATEGORY_VALUES)[number];

export const LIABILITY_CATEGORY_VALUES = [
  'mortgage', 'car_loan', 'student_loan', 'credit_card', 'consumer_loan', 'other',
] as const;
export type LiabilityCategory = (typeof LIABILITY_CATEGORY_VALUES)[number];
