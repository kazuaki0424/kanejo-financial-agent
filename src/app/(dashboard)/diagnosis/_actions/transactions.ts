'use server';

import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase/auth';
import { db } from '@/lib/db/client';
import { incomeSources, expenseRecords } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { CsvAdapter, ManualAdapter, type TransactionRecord, type ImportResult } from '@/lib/adapters/data-source';
import { z } from 'zod';

// ============================================================
// Manual entry
// ============================================================
const manualEntrySchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'カテゴリを選択してください。'),
  description: z.string().default(''),
  amount: z.coerce.number().int().min(1, '1円以上で入力してください。'),
  date: z.string().min(1, '日付を入力してください。'),
});

interface EntryResult {
  error: string | null;
  fieldErrors?: Record<string, string[]>;
}

export async function addManualEntry(formData: FormData): Promise<EntryResult> {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const raw = {
    type: formData.get('type') as string,
    category: formData.get('category') as string,
    description: formData.get('description') as string,
    amount: formData.get('amount') as string,
    date: formData.get('date') as string,
  };

  const parsed = manualEntrySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: '入力内容に誤りがあります。',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { type, category, description, amount, date } = parsed.data;
  const adapter = new ManualAdapter();
  const record: TransactionRecord = { date, type, category, description, amount };
  const { valid, errors } = adapter.validate([record]);

  if (errors.length > 0) {
    return { error: errors[0] };
  }

  try {
    if (valid[0].type === 'income') {
      await db.insert(incomeSources).values({
        userId: user.id,
        category: valid[0].category,
        name: valid[0].description || null,
        monthlyAmount: valid[0].amount,
        isRecurring: false,
        startDate: valid[0].date,
      });
    } else {
      await db.insert(expenseRecords).values({
        userId: user.id,
        category: valid[0].category,
        name: valid[0].description || null,
        monthlyAmount: valid[0].amount,
        isFixed: false,
        isRecurring: false,
      });
    }
  } catch {
    return { error: 'データの保存に失敗しました。もう一度お試しください。' };
  }

  return { error: null };
}

// ============================================================
// CSV import
// ============================================================
export async function importCsv(csvText: string): Promise<ImportResult> {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const adapter = new CsvAdapter();
  const records = adapter.parse(csvText);

  if (records.length === 0) {
    return { success: false, imported: 0, skipped: 0, errors: ['CSVデータを解析できませんでした。日付と金額の列が必要です。'] };
  }

  const { valid, errors } = adapter.validate(records);

  if (valid.length === 0) {
    return { success: false, imported: 0, skipped: records.length, errors };
  }

  const incomeRecords = valid.filter((r) => r.type === 'income');
  const expenseRecs = valid.filter((r) => r.type === 'expense');

  try {
    // Insert income records
    if (incomeRecords.length > 0) {
      await db.insert(incomeSources).values(
        incomeRecords.map((r) => ({
          userId: user.id,
          category: r.category,
          name: r.description || null,
          monthlyAmount: r.amount,
          isRecurring: false,
          startDate: r.date,
        })),
      );
    }

    // Insert expense records
    if (expenseRecs.length > 0) {
      await db.insert(expenseRecords).values(
        expenseRecs.map((r) => ({
          userId: user.id,
          category: r.category,
          name: r.description || null,
          monthlyAmount: r.amount,
          isFixed: false,
          isRecurring: false,
        })),
      );
    }
  } catch {
    return {
      success: false,
      imported: 0,
      skipped: valid.length,
      errors: [...errors, 'データベースへの保存に失敗しました。'],
    };
  }

  return {
    success: true,
    imported: valid.length,
    skipped: records.length - valid.length,
    errors,
  };
}

// ============================================================
// Delete entry
// ============================================================
export async function deleteIncomeEntry(entryId: string): Promise<{ error: string | null }> {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  try {
    await db.delete(incomeSources).where(eq(incomeSources.id, entryId));
  } catch {
    return { error: '削除に失敗しました。' };
  }
  return { error: null };
}

export async function deleteExpenseEntry(entryId: string): Promise<{ error: string | null }> {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  try {
    await db.delete(expenseRecords).where(eq(expenseRecords.id, entryId));
  } catch {
    return { error: '削除に失敗しました。' };
  }
  return { error: null };
}
