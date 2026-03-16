import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrencyString } from '@/lib/utils/format';

describe('formatCurrency', () => {
  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('0');
  });

  it('formats small numbers without commas', () => {
    expect(formatCurrency(999)).toBe('999');
  });

  it('formats thousands with commas', () => {
    expect(formatCurrency(5800000)).toBe('5,800,000');
  });

  it('formats large numbers', () => {
    expect(formatCurrency(100000000)).toBe('100,000,000');
  });

  it('formats negative numbers', () => {
    expect(formatCurrency(-1500000)).toBe('-1,500,000');
  });
});

describe('parseCurrencyString', () => {
  it('parses plain number string', () => {
    expect(parseCurrencyString('5800000')).toBe(5800000);
  });

  it('parses comma-formatted string', () => {
    expect(parseCurrencyString('5,800,000')).toBe(5800000);
  });

  it('strips yen sign', () => {
    expect(parseCurrencyString('¥5,800,000')).toBe(5800000);
  });

  it('strips full-width yen and commas', () => {
    expect(parseCurrencyString('￥5，800，000')).toBe(5800000);
  });

  it('returns 0 for empty string', () => {
    expect(parseCurrencyString('')).toBe(0);
  });

  it('returns 0 for non-numeric string', () => {
    expect(parseCurrencyString('abc')).toBe(0);
  });

  it('strips whitespace', () => {
    expect(parseCurrencyString(' 1 000 000 ')).toBe(1000000);
  });
});
