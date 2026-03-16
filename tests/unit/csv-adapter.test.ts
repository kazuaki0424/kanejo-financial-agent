import { describe, it, expect } from 'vitest';
import { CsvAdapter } from '@/lib/adapters/data-source';

const adapter = new CsvAdapter();

describe('CsvAdapter.parse', () => {
  it('parses basic CSV with date, amount, description', () => {
    const csv = `日付,金額,内容
2026-03-01,-80000,3月分家賃
2026-03-15,500000,3月給与`;

    const records = adapter.parse(csv);
    expect(records).toHaveLength(2);
    expect(records[0]).toEqual({
      date: '2026-03-01',
      type: 'expense',
      category: 'housing',
      description: '3月分家賃',
      amount: 80000,
    });
    expect(records[1]).toEqual({
      date: '2026-03-15',
      type: 'income',
      category: 'salary',
      description: '3月給与',
      amount: 500000,
    });
  });

  it('handles explicit type column', () => {
    const csv = `日付,金額,内容,種別
2026-03-01,80000,家賃,支出
2026-03-15,500000,給与,収入`;

    const records = adapter.parse(csv);
    expect(records[0].type).toBe('expense');
    expect(records[1].type).toBe('income');
  });

  it('handles explicit category column', () => {
    const csv = `日付,金額,内容,カテゴリ
2026-03-01,-50000,外食ディナー,食費`;

    const records = adapter.parse(csv);
    expect(records[0].category).toBe('food');
  });

  it('guesses category from description', () => {
    const csv = `日付,金額,内容
2026-03-01,-10000,携帯電話料金
2026-03-02,-5000,病院
2026-03-03,-30000,電車定期`;

    const records = adapter.parse(csv);
    expect(records[0].category).toBe('communication');
    expect(records[1].category).toBe('medical');
    expect(records[2].category).toBe('transportation');
  });

  it('handles comma-formatted amounts', () => {
    const csv = `日付,金額,内容
2026-03-01,"-80,000",家賃`;

    const records = adapter.parse(csv);
    expect(records[0].amount).toBe(80000);
  });

  it('handles yen-prefixed amounts', () => {
    const csv = `日付,金額,内容
2026-03-01,¥-50000,食費`;

    const records = adapter.parse(csv);
    expect(records[0].amount).toBe(50000);
  });

  it('skips zero amount rows', () => {
    const csv = `日付,金額,内容
2026-03-01,0,残高照会`;

    const records = adapter.parse(csv);
    expect(records).toHaveLength(0);
  });

  it('returns empty for header-only CSV', () => {
    const records = adapter.parse('日付,金額,内容');
    expect(records).toHaveLength(0);
  });

  it('returns empty for non-string input', () => {
    expect(adapter.parse(null)).toHaveLength(0);
    expect(adapter.parse(123)).toHaveLength(0);
    expect(adapter.parse(undefined)).toHaveLength(0);
  });

  it('returns empty if required columns are missing', () => {
    const csv = `名前,メモ
田中,テスト`;

    const records = adapter.parse(csv);
    expect(records).toHaveLength(0);
  });

  it('handles quoted fields with commas', () => {
    const csv = `日付,金額,内容
2026-03-01,-5000,"東京駅, 新幹線"`;

    const records = adapter.parse(csv);
    expect(records[0].description).toBe('東京駅, 新幹線');
  });
});

describe('CsvAdapter.validate', () => {
  it('passes valid records', () => {
    const records = [
      { date: '2026-03-01', type: 'expense' as const, category: 'food', description: '食費', amount: 5000 },
    ];
    const { valid, errors } = adapter.validate(records);
    expect(valid).toHaveLength(1);
    expect(errors).toHaveLength(0);
  });

  it('rejects records with empty date', () => {
    const records = [
      { date: '', type: 'expense' as const, category: 'food', description: '', amount: 5000 },
    ];
    const { valid, errors } = adapter.validate(records);
    expect(valid).toHaveLength(0);
    expect(errors[0]).toContain('日付');
  });

  it('rejects records with zero amount', () => {
    const records = [
      { date: '2026-03-01', type: 'expense' as const, category: 'food', description: '', amount: 0 },
    ];
    const { valid, errors } = adapter.validate(records);
    expect(valid).toHaveLength(0);
    expect(errors[0]).toContain('0以下');
  });

  it('rejects records with excessive amount', () => {
    const records = [
      { date: '2026-03-01', type: 'expense' as const, category: 'food', description: '', amount: 200_000_000 },
    ];
    const { valid, errors } = adapter.validate(records);
    expect(valid).toHaveLength(0);
    expect(errors[0]).toContain('上限');
  });

  it('filters out invalid records and keeps valid ones', () => {
    const records = [
      { date: '2026-03-01', type: 'expense' as const, category: 'food', description: '', amount: 5000 },
      { date: '', type: 'expense' as const, category: 'food', description: '', amount: 3000 },
      { date: '2026-03-02', type: 'income' as const, category: 'salary', description: '', amount: 500000 },
    ];
    const { valid, errors } = adapter.validate(records);
    expect(valid).toHaveLength(2);
    expect(errors).toHaveLength(1);
  });
});
