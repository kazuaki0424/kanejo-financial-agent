import { z } from 'zod';
import {
  GENDER_VALUES,
  MARITAL_STATUS_VALUES,
  OCCUPATION_VALUES,
  RISK_TOLERANCE_VALUES,
} from '@/types/database';

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
] as const;

export type Prefecture = (typeof PREFECTURES)[number];
export { PREFECTURES };

// Step 1: 基本情報
export const step1Schema = z.object({
  birthDate: z
    .string()
    .min(1, '生年月日を入力してください。')
    .refine((val) => {
      const date = new Date(val);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      return age >= 15 && age <= 120;
    }, '有効な生年月日を入力してください。'),
  gender: z.enum(GENDER_VALUES).nullable(),
  prefecture: z
    .string()
    .min(1, '都道府県を選択してください。')
    .refine((val): val is Prefecture => (PREFECTURES as readonly string[]).includes(val), '有効な都道府県を選択してください。'),
  maritalStatus: z.enum(MARITAL_STATUS_VALUES, {
    message: '婚姻状況を選択してください。',
  }),
  dependents: z.coerce
    .number()
    .int()
    .min(0, '0以上で入力してください。')
    .max(20, '20以下で入力してください。')
    .default(0),
});

// Step 2: 収入情報 (Day 9)
export const step2Schema = z.object({
  occupation: z.enum(OCCUPATION_VALUES, {
    message: '職業を選択してください。',
  }),
  annualIncome: z.coerce
    .number()
    .int()
    .min(0, '0以上で入力してください。')
    .max(1_000_000_000, '有効な金額を入力してください。'),
});

// Step 3: 支出概算
export const step3Schema = z.object({
  housing: z.coerce.number().int().min(0).default(0),
  food: z.coerce.number().int().min(0).default(0),
  transportation: z.coerce.number().int().min(0).default(0),
  utilities: z.coerce.number().int().min(0).default(0),
  communication: z.coerce.number().int().min(0).default(0),
  insurance: z.coerce.number().int().min(0).default(0),
  entertainment: z.coerce.number().int().min(0).default(0),
  other: z.coerce.number().int().min(0).default(0),
});

// Step 4: 資産・負債
export const step4Schema = z.object({
  // 資産
  cash: z.coerce.number().int().min(0).default(0),
  stocks: z.coerce.number().int().min(0).default(0),
  mutualFunds: z.coerce.number().int().min(0).default(0),
  crypto: z.coerce.number().int().min(0).default(0),
  insuranceValue: z.coerce.number().int().min(0).default(0),
  otherAssets: z.coerce.number().int().min(0).default(0),
  // 負債
  mortgage: z.coerce.number().int().min(0).default(0),
  carLoan: z.coerce.number().int().min(0).default(0),
  studentLoan: z.coerce.number().int().min(0).default(0),
  creditCard: z.coerce.number().int().min(0).default(0),
  otherLiabilities: z.coerce.number().int().min(0).default(0),
});

// Step 5: 目標設定
export const FINANCIAL_GOAL_OPTIONS = [
  { value: 'retirement', label: '老後資金' },
  { value: 'housing', label: '住宅購入' },
  { value: 'education', label: '教育資金' },
  { value: 'emergency', label: '緊急資金の確保' },
  { value: 'investment', label: '資産運用' },
  { value: 'tax_saving', label: '節税対策' },
  { value: 'debt_reduction', label: '借入の返済' },
  { value: 'travel', label: '旅行・レジャー' },
  { value: 'business', label: '起業・副業' },
  { value: 'other', label: 'その他' },
] as const;

export const step5Schema = z.object({
  financialGoals: z
    .string()
    .transform((val) => val.split(',').filter(Boolean))
    .refine((arr) => arr.length >= 1, '目標を1つ以上選択してください。'),
  riskTolerance: z.enum(RISK_TOLERANCE_VALUES, {
    message: 'リスク許容度を選択してください。',
  }),
});

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
export type Step5Data = z.infer<typeof step5Schema>;
