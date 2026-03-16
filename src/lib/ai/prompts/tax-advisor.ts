import type { TaxSummaryData } from '@/app/(dashboard)/tax/_actions/tax';
import type { TaxSavingsSummary } from '@/lib/utils/tax-savings';
import { formatCurrency } from '@/lib/utils/format';

export const TAX_ADVISOR_SYSTEM_PROMPT = `あなたは「Kanejo」の税務アドバイザーです。

## 人格
- 穏やかで信頼感のある口調
- 断定を避け、「〜の可能性があります」「検討の余地があります」を使う
- 専門用語には必ず平易な説明を添える（例: 「所得控除（収入から差し引ける金額）」）
- ユーザーの不安を煽らない

## 制約
- 投資の具体的な銘柄推奨はしない
- 「必ず節税できる」等の断定的表現は禁止
- 税務の最終判断は税理士への相談を推奨する
- 回答は日本語で行う
- 回答は簡潔に（300文字程度）

## 重要な注意
- 免責事項は回答に含めない（UIで表示するため）
- 具体的な金額の目安を含める
- ユーザーの状況に合わせたアドバイスを行う`;

export function buildTaxContext(
  taxData: TaxSummaryData,
  savings: TaxSavingsSummary,
): string {
  const activeItems = savings.items
    .filter((i) => i.status === 'active')
    .map((i) => `  - ${i.name}: ¥${formatCurrency(i.annualSaving)}/年`)
    .join('\n');

  const availableItems = savings.items
    .filter((i) => i.status === 'available' && i.maxSaving > 0)
    .map((i) => `  - ${i.name}: 最大¥${formatCurrency(i.maxSaving)}/年`)
    .join('\n');

  return `## ユーザーの税務状況
- 年収: ¥${formatCurrency(taxData.annualSalary)}
- 所得税: ¥${formatCurrency(taxData.taxResult.incomeTax)}
- 住民税: ¥${formatCurrency(taxData.taxResult.residentTax)}
- 実効税率: ${(taxData.taxResult.effectiveRate * 100).toFixed(1)}%
- 手取り: ¥${formatCurrency(taxData.taxResult.takeHome)}
- 婚姻: ${taxData.maritalStatus === 'married' ? '既婚' : '未婚'}
- 扶養: ${taxData.dependents}人
- 年齢: ${taxData.age}歳

## 実行中の節税
${activeItems || '  なし'}

## 未活用の節税（利用可能）
${availableItems || '  なし'}

## 節税活用率: ${Math.round(savings.utilizationRate * 100)}%
実行中: ¥${formatCurrency(savings.totalActiveSaving)}/年
ポテンシャル: ¥${formatCurrency(savings.totalPotentialSaving)}/年`;
}
