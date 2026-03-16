import type { DashboardMetrics, ExpenseCategoryData } from '@/app/(dashboard)/_actions/dashboard';
import { formatCurrency } from '@/lib/utils/format';

const TIER_LABELS: Record<string, string> = {
  basic: 'ベーシック（年収500万円未満）',
  middle: 'ミドル（年収500〜1,500万円）',
  high_end: 'ハイエンド（年収1,500万円以上）',
};

export const SYSTEM_PROMPT = `あなたは「Kanejo」のパーソナル金融アドバイザーです。

## 人格
- 穏やかで信頼感のある口調。親しみやすいが軽くならない
- 断定を避ける: 「〜の可能性があります」「検討の余地があります」「〜かもしれません」
- 専門用語には必ず平易な説明を添える（例: 「iDeCo（個人型確定拠出年金）」）
- ユーザーの不安を煽らない。ポジティブな側面も必ず触れる
- 数値を使って具体的に話す（「月に約○万円の節約が見込めます」）

## 制約
- 投資の具体的な銘柄推奨はしない
- 「必ず儲かる」「絶対に」等の断定的表現は禁止
- 税務・法律の最終判断は専門家への相談を推奨する
- 回答は日本語で行う

## 出力形式
3つの改善提案を以下の形式で出力してください:

1. **[提案タイトル（10文字以内）]**
   [具体的なアドバイス。数値を含む。2-3文で。なぜそうすべきかの理由と、実行した場合の効果を含める。]

2. **[提案タイトル（10文字以内）]**
   [具体的なアドバイス。数値を含む。2-3文で。]

3. **[提案タイトル（10文字以内）]**
   [具体的なアドバイス。数値を含む。2-3文で。]

最後に一文で、全体的な所感を述べてください（「全体として〜」で始める）。`;

export function buildDiagnosisPrompt(
  metrics: DashboardMetrics,
  categories: ExpenseCategoryData[],
): string {
  const expenseList = categories
    .map((c) => `  - ${c.label}: ¥${formatCurrency(c.amount)}/月 (${c.percentage}%${c.isFixed ? ', 固定費' : ''})`)
    .join('\n');

  const monthlySavings = metrics.monthlyIncome - metrics.monthlyExpenses;

  // Find weakest indicators
  const indicators = [
    { name: '貯蓄率', score: metrics.scoreBreakdown.savingsScore, max: metrics.scoreBreakdown.savingsMax },
    { name: '負債管理', score: metrics.scoreBreakdown.debtScore, max: metrics.scoreBreakdown.debtMax },
    { name: '資産分散', score: metrics.scoreBreakdown.diversityScore, max: metrics.scoreBreakdown.diversityMax },
    { name: '緊急資金', score: metrics.scoreBreakdown.bufferScore, max: metrics.scoreBreakdown.bufferMax },
    { name: '保険', score: metrics.scoreBreakdown.insuranceScore, max: metrics.scoreBreakdown.insuranceMax },
  ];
  const weakest = indicators
    .filter((i) => i.max > 0)
    .sort((a, b) => (a.score / a.max) - (b.score / b.max))
    .slice(0, 3)
    .map((i) => `${i.name}(${i.score}/${i.max})`)
    .join(', ');

  return `以下のユーザーの家計データを分析し、3つの具体的な改善提案をしてください。

## ユーザープロファイル
- ティア: ${TIER_LABELS[metrics.tier] ?? metrics.tier}
- 月収: ¥${formatCurrency(metrics.monthlyIncome)}
- 月支出: ¥${formatCurrency(metrics.monthlyExpenses)}
- 月間貯蓄額: ¥${formatCurrency(monthlySavings)}
- 貯蓄率: ${metrics.savingsRate}%
- 家計スコア: ${metrics.householdScore}/100（${metrics.householdGrade}ランク）

## スコア内訳（弱い順: ${weakest}）
- 貯蓄率: ${metrics.scoreBreakdown.savingsScore}/${metrics.scoreBreakdown.savingsMax}
- 負債管理: ${metrics.scoreBreakdown.debtScore}/${metrics.scoreBreakdown.debtMax}
- 資産分散: ${metrics.scoreBreakdown.diversityScore}/${metrics.scoreBreakdown.diversityMax}
- 緊急資金: ${metrics.scoreBreakdown.bufferScore}/${metrics.scoreBreakdown.bufferMax}
- 保険: ${metrics.scoreBreakdown.insuranceScore}/${metrics.scoreBreakdown.insuranceMax}

## 資産・負債
- 総資産: ¥${formatCurrency(metrics.totalAssets)}
- 総負債: ¥${formatCurrency(metrics.totalLiabilities)}
- 純資産: ¥${formatCurrency(metrics.netWorth)}

## 支出カテゴリ（月額）
${expenseList || '  （データなし）'}

## 分析の方針
- スコアが低い指標を優先的に改善する提案をしてください
- ユーザーのティアに合わせた現実的なアドバイスをお願いします
- 可能であれば金額の目安を含めてください（例: 「月5,000円の削減で年間6万円の節約」）
- 固定費の見直しは効果が持続するため優先度を高くしてください`;
}

/**
 * メトリクスデータのハッシュを生成（キャッシュ判定用）
 */
export function computeContextHash(metrics: DashboardMetrics): string {
  const key = [
    metrics.monthlyIncome,
    metrics.monthlyExpenses,
    metrics.totalAssets,
    metrics.totalLiabilities,
    metrics.householdScore,
    metrics.tier,
  ].join(':');
  // Simple hash for cache invalidation
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
