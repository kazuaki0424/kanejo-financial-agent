import type { SimulationResult, SimulationParams, LifeEvent } from '@/lib/utils/cashflow-engine';
import { formatCurrency } from '@/lib/utils/format';

export const SIMULATION_SYSTEM_PROMPT = `あなたは「Kanejo」のライフプランアドバイザーです。

## 人格
- 穏やかで信頼感のある口調
- 断定を避け、「〜の可能性があります」「検討の余地があります」を使う
- ユーザーの不安を煽らない。リスクを指摘する場合も前向きな代替案を提示する
- 数値を使って具体的に話す

## 制約
- 投資の具体的な銘柄推奨はしない
- 「必ず」「絶対」等の断定的表現は禁止
- 税務・法律の最終判断は専門家への相談を推奨する
- 回答は日本語で行う

## 出力形式
シミュレーション結果を分析し、以下の形式で回答してください:

**総合評価**
[シミュレーション全体の1-2文の評価]

1. **[ポイント1のタイトル]**
   [具体的なアドバイス。数値を含む。2文で。]

2. **[ポイント2のタイトル]**
   [具体的なアドバイス。数値を含む。2文で。]

3. **[ポイント3のタイトル]**
   [具体的なアドバイス。数値を含む。2文で。]`;

export function buildSimulationPrompt(
  params: SimulationParams,
  result: SimulationResult,
): string {
  const eventList = params.lifeEvents.length > 0
    ? params.lifeEvents
        .map((e) => `  - ${e.age}歳: ${e.name}（一時費用¥${formatCurrency(e.oneTimeCost)}、年間変動¥${formatCurrency(e.annualCostChange)}）`)
        .join('\n')
    : '  （なし）';

  const keyYears = result.projections.filter((p) =>
    p.events.length > 0 || p.age === params.retirementAge || p.age === params.currentAge + params.years - 1,
  );

  const keyYearData = keyYears
    .map((p) => `  - ${p.age}歳: 収入¥${formatCurrency(p.income)} 支出¥${formatCurrency(p.expenses)} 純資産¥${formatCurrency(p.netWorth)}${p.events.length > 0 ? ` [${p.events.join(',')}]` : ''}`)
    .join('\n');

  const bankruptcyNote = result.summary.bankruptcyAge !== null
    ? `⚠ ${result.summary.bankruptcyAge}歳で資産がマイナスになります。`
    : '資産枯渇のリスクはありません。';

  return `以下のライフプランシミュレーション結果を分析し、アドバイスをお願いします。

## 基本条件
- 現在の年齢: ${params.currentAge}歳
- シミュレーション期間: ${params.years}年（${params.currentAge + params.years - 1}歳まで）
- 年間収入: ¥${formatCurrency(params.annualIncome)}
- 年間支出: ¥${formatCurrency(params.annualExpenses)}
- 総資産: ¥${formatCurrency(params.totalAssets)}
- 総負債: ¥${formatCurrency(params.totalLiabilities)}

## パラメータ
- 昇給率: ${(params.salaryGrowthRate * 100).toFixed(1)}%/年
- インフレ率: ${(params.inflationRate * 100).toFixed(1)}%/年
- 投資利回り: ${(params.investmentReturnRate * 100).toFixed(1)}%/年
- 退職年齢: ${params.retirementAge}歳
- 年金: ¥${formatCurrency(params.pensionAmount)}/年（${params.pensionStartAge}歳から）

## ライフイベント
${eventList}

## シミュレーション結果サマリー
- 退職時純資産: ¥${formatCurrency(result.summary.netWorthAtRetirement)}
- 最終時点純資産: ¥${formatCurrency(result.summary.finalNetWorth)}
- 生涯貯蓄: ¥${formatCurrency(result.summary.totalSavings)}
- 投資リターン計: ¥${formatCurrency(result.summary.totalInvestmentReturns)}
- ${bankruptcyNote}

## 主要年のデータ
${keyYearData}

## 分析の観点
- ライフイベントのタイミングは適切か
- 資産枯渇リスクはないか
- 投資利回りの前提は現実的か
- 退職後の生活は持続可能か
- より良いプランの代替案はあるか`;
}
