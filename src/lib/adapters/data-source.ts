/**
 * データソースアダプターパターン
 *
 * 将来的な銀行API・クレカAPI・家計簿アプリ連携に対応するための
 * 統一インターフェース。現在は手動入力とCSVインポートのみ実装。
 *
 * 拡張例:
 *   - MoneyForwardAdapter: マネーフォワード API連携
 *   - ZaimAdapter: Zaim API連携
 *   - MufgAdapter: 三菱UFJ API連携
 */

export interface TransactionRecord {
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export interface DataSourceAdapter {
  readonly name: string;
  readonly type: 'manual' | 'csv' | 'api';
  parse(data: unknown): TransactionRecord[];
  validate(records: TransactionRecord[]): { valid: TransactionRecord[]; errors: string[] };
}

// ============================================================
// CSV Adapter
// ============================================================

const EXPENSE_CATEGORY_MAP: Record<string, string> = {
  '住居': 'housing', '家賃': 'housing', '住宅ローン': 'housing',
  '食費': 'food', '食料品': 'food', '外食': 'food',
  '交通': 'transportation', '交通費': 'transportation', '電車': 'transportation', 'ガソリン': 'transportation',
  '水道光熱': 'utilities', '電気': 'utilities', 'ガス': 'utilities', '水道': 'utilities',
  '通信': 'communication', '携帯': 'communication', 'スマホ': 'communication', 'インターネット': 'communication',
  '保険': 'insurance', '保険料': 'insurance',
  '医療': 'medical', '病院': 'medical',
  '教育': 'education', '学費': 'education',
  '娯楽': 'entertainment', '交際費': 'entertainment', 'レジャー': 'entertainment',
  '被服': 'clothing', '衣服': 'clothing',
  'サブスク': 'subscription', 'サブスクリプション': 'subscription',
  '税金': 'tax',
  'その他': 'other',
};

const INCOME_CATEGORY_MAP: Record<string, string> = {
  '給与': 'salary', '給料': 'salary', '賞与': 'salary', 'ボーナス': 'salary',
  '副業': 'side_job', '副収入': 'side_job',
  '投資': 'investment', '配当': 'investment', '利息': 'investment',
  '年金': 'pension',
  '家賃収入': 'rental', '不動産': 'rental',
  'その他': 'other',
};

function guessCategory(description: string, type: 'income' | 'expense'): string {
  const map = type === 'income' ? INCOME_CATEGORY_MAP : EXPENSE_CATEGORY_MAP;
  const desc = description.toLowerCase();

  for (const [keyword, category] of Object.entries(map)) {
    if (desc.includes(keyword.toLowerCase())) {
      return category;
    }
  }

  return 'other';
}

export class CsvAdapter implements DataSourceAdapter {
  readonly name = 'CSV';
  readonly type = 'csv' as const;

  parse(data: unknown): TransactionRecord[] {
    if (typeof data !== 'string') return [];

    const lines = data.trim().split('\n');
    if (lines.length < 2) return []; // Need header + at least 1 row

    const header = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const records: TransactionRecord[] = [];

    // Detect column mapping
    const dateIdx = header.findIndex((h) => /日付|date|日時/i.test(h));
    const amountIdx = header.findIndex((h) => /金額|amount|額/i.test(h));
    const descIdx = header.findIndex((h) => /内容|摘要|description|メモ|備考|品名/i.test(h));
    const categoryIdx = header.findIndex((h) => /カテゴリ|category|分類/i.test(h));
    const typeIdx = header.findIndex((h) => /種別|type|収支/i.test(h));

    if (dateIdx === -1 || amountIdx === -1) return [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length <= Math.max(dateIdx, amountIdx)) continue;

      const rawAmount = Number.parseInt(cols[amountIdx].replace(/[,，¥￥\s]/g, ''), 10);
      if (Number.isNaN(rawAmount) || rawAmount === 0) continue;

      // Determine type from explicit column or sign of amount
      let type: 'income' | 'expense' = 'expense';
      if (typeIdx !== -1) {
        const typeVal = cols[typeIdx].trim();
        type = /収入|入金|income/i.test(typeVal) ? 'income' : 'expense';
      } else {
        type = rawAmount > 0 ? 'income' : 'expense';
      }

      const description = descIdx !== -1 ? cols[descIdx].trim() : '';
      const category = categoryIdx !== -1
        ? (type === 'income' ? INCOME_CATEGORY_MAP[cols[categoryIdx].trim()] : EXPENSE_CATEGORY_MAP[cols[categoryIdx].trim()]) ?? guessCategory(description, type)
        : guessCategory(description, type);

      records.push({
        date: cols[dateIdx].trim(),
        type,
        category,
        description,
        amount: Math.abs(rawAmount),
      });
    }

    return records;
  }

  validate(records: TransactionRecord[]): { valid: TransactionRecord[]; errors: string[] } {
    const valid: TransactionRecord[] = [];
    const errors: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      if (!r.date) {
        errors.push(`行${i + 2}: 日付が空です`);
        continue;
      }
      if (r.amount <= 0) {
        errors.push(`行${i + 2}: 金額が0以下です`);
        continue;
      }
      if (r.amount > 100_000_000) {
        errors.push(`行${i + 2}: 金額が上限を超えています`);
        continue;
      }
      valid.push(r);
    }

    return { valid, errors };
  }
}

/**
 * Simple CSV line parser that handles quoted fields
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

// ============================================================
// Manual Entry Adapter
// ============================================================

export class ManualAdapter implements DataSourceAdapter {
  readonly name = '手動入力';
  readonly type = 'manual' as const;

  parse(data: unknown): TransactionRecord[] {
    if (!data || typeof data !== 'object') return [];
    const record = data as TransactionRecord;
    return [record];
  }

  validate(records: TransactionRecord[]): { valid: TransactionRecord[]; errors: string[] } {
    const valid: TransactionRecord[] = [];
    const errors: string[] = [];

    for (const r of records) {
      if (!r.date) { errors.push('日付を入力してください'); continue; }
      if (!r.category) { errors.push('カテゴリを選択してください'); continue; }
      if (r.amount <= 0) { errors.push('金額は1円以上で入力してください'); continue; }
      valid.push(r);
    }

    return { valid, errors };
  }
}
