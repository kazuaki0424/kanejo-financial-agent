/**
 * 数値を日本円のカンマ区切りでフォーマットする
 * @example formatCurrency(5800000) → "5,800,000"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ja-JP').format(value);
}

/**
 * カンマ区切りの文字列を数値に変換する
 * @example parseCurrencyString("5,800,000") → 5800000
 */
export function parseCurrencyString(value: string): number {
  const cleaned = value.replace(/[,，\s¥￥]/g, '');
  const parsed = Number.parseInt(cleaned, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}
