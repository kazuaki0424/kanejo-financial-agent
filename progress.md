# Kanejo 開発進捗

## 概要
- 開発開始: 2026-03-16
- 現在: Day 60 / 60 完了 🎉
- テスト: 474件 (26ファイル, 全パス)
- ビルド: 24ルート, 0エラー
- ルート: 24ページ

---

## Phase 0: 基盤構築 (Day 1-5) ✅
> 開発開始前に完了済み

| Day | タスク | 状態 |
|-----|--------|------|
| 1 | プロジェクト初期化 (Next.js 16 + TS + Tailwind 4) | ✅ |
| 2 | デザインシステム基盤 (globals.css, フォント, ダークモード) | ✅ |
| 3 | UIプリミティブ (1) Button, Card, Input, Select, Dialog | ✅ |
| 4 | UIプリミティブ (2) Tabs, Tooltip, Dropdown, Toast, Slider, Badge | ✅ |
| 5 | レイアウトシェル (Sidebar, Header, MobileNav, Breadcrumb) | ✅ |

---

## Phase 1: 認証 + プロファイル (Day 6-12) ✅

| Day | タスク | 状態 | 主要ファイル |
|-----|--------|------|-------------|
| 6 | Supabase セットアップ + Auth | ✅ | `src/lib/supabase/`, `src/app/(auth)/` |
| 7 | DB スキーマ設計 (Drizzle ORM) | ✅ | `src/lib/db/schema.ts`, 6テーブル |
| 8 | オンボーディングUI (1) Step1: 基本情報 | ✅ | `src/app/onboarding/` |
| 9 | オンボーディングUI (2) Step2: 収入, Step3: 支出 | ✅ | CurrencyInput, スライダー |
| 10 | オンボーディングUI (3) Step4: 資産負債, Step5: 目標, 完了画面 | ✅ | ティア判定 |
| 11 | プロファイル編集 (Optimistic UI + スナップショット) | ✅ | `src/app/(dashboard)/settings/` |
| 12 | 認証ガード + テスト (68テスト) | ✅ | middleware, vitest設定 |

### DB テーブル
- `user_profiles`, `income_sources`, `expense_records`, `assets`, `liabilities`, `profile_snapshots`
- 全テーブルに RLS 設定済み

---

## Phase 2: 家計診断ダッシュボード (Day 13-22) ✅

| Day | タスク | 状態 | 主要ファイル |
|-----|--------|------|-------------|
| 13 | ダッシュボードレイアウト + メトリクスカード | ✅ | AnimatedMetricCard, HouseholdScoreCard |
| 14 | 収支チャート (Recharts 棒グラフ, 12ヶ月) | ✅ | `src/components/charts/income-expense-chart.tsx` |
| 15 | 支出カテゴリ分析 (ドーナツチャート + ドリルダウン) | ✅ | `src/components/charts/donut-chart.tsx` |
| 16 | 資産ポートフォリオ (スタックバー + 詳細展開) | ✅ | AssetPortfolioSection |
| 17 | 家計スコアエンジン (5指標, ティア別ウェイト) | ✅ | `src/lib/utils/household-score.ts` |
| 18 | 家計スコアUI (円形ゲージ, レーダーチャート, 改善提案) | ✅ | diagnosis page |
| 19 | AIインサイト (1) Claude API + ストリーミング | ✅ | `src/app/api/diagnosis/route.ts` |
| 20 | AIインサイト (2) プロンプトチューニング + キャッシュ | ✅ | `ai_insight_cache` テーブル |
| 21 | データ入力・同期 (手動入力 + CSV一括インポート) | ✅ | `src/lib/adapters/data-source.ts` |
| 22 | テスト + 改善 (loading/error全ルート, 本番ビルド) | ✅ | 18 loading/error ファイル |

### 家計スコア指標
1. 貯蓄率 (ティア別目標: 20%/25%/30%)
2. 負債比率 (許容: 3x/5x/8x 年収)
3. 資産分散度 (目標: 2/3/4 カテゴリ)
4. 緊急資金バッファ (目標: 3/6/12 ヶ月)
5. 保険カバー率 (年収の10-20%が最適)

---

## Phase 3: ライフプランシミュレーション (Day 23-30) ✅

| Day | タスク | 状態 | 主要ファイル |
|-----|--------|------|-------------|
| 23 | シミュレーションエンジン (複利, 30年, パラメータ化) | ✅ | `src/lib/utils/cashflow-engine.ts` |
| 24 | タイムラインUI (イベント配置, コスト自動見積もり) | ✅ | TimelineEditor |
| 25 | キャッシュフローチャート (エリアチャート, イベントマーカー) | ✅ | `src/components/charts/cashflow-chart.tsx` |
| 26 | シナリオ比較 (最大3シナリオ, 差分ハイライト) | ✅ | ScenarioComparison, ScenarioComparisonChart |
| 27 | イベントテンプレート (7種 + 6プリセットシナリオ) | ✅ | `src/lib/constants/life-events.ts` |
| 28 | AI提案統合 (シミュレーション結果分析) | ✅ | `src/app/api/simulation/route.ts` |
| 29 | パラメータ調整UI (7スライダー + 感度分析) | ✅ | ParameterPanel |
| 30 | テスト + 改善 (エッジケース26テスト) | ✅ | cashflow-edge-cases.test.ts |

### プリセットシナリオ
1. 標準的な家庭 (結婚→出産→マイホーム→進学)
2. DINKS (共働き夫婦)
3. 持ち家 vs 賃貸
4. 賃貸継続
5. FIRE (50歳セミリタイア)
6. 子ども2人プラン

---

## Phase 4: 節税・補助金 (Day 31-40) ✅

| Day | タスク | 状態 | 主要ファイル |
|-----|--------|------|-------------|
| 31 | 税制データモデル (累進課税, 9種控除) | ✅ | `src/lib/constants/tax-rates.ts`, `src/lib/utils/calculations.ts` |
| 32 | ふるさと納税最適化 (上限計算, 返礼品6カテゴリ) | ✅ | `src/app/(dashboard)/tax/furusato/` |
| 33 | iDeCo/NISA提案 (複利シミュレーション, 節税効果) | ✅ | `src/app/(dashboard)/tax/ideco-nisa/` |
| 34 | 補助金マッチング (12補助金, 条件ベースマッチング) | ✅ | `src/app/(dashboard)/tax/subsidies/` |
| 35 | 確定申告ガイド (要否判定, ステップガイド, 書類チェック) | ✅ | `src/lib/utils/tax-filing.ts` |
| 36 | 節税サマリーダッシュボード (6施策, 活用率) | ✅ | `src/lib/utils/tax-savings.ts` |
| 37 | AIタックスアドバイザー (会話型Q&A) | ✅ | `src/app/api/tax-advice/route.ts` |
| 38 | 補助金データ更新パイプライン (シード + Cron) | ✅ | `scripts/seed-subsidies.ts` |
| 39 | 年末調整ウィザード (ステップ式, 還付額試算) | ✅ | `src/lib/utils/year-end-adjustment.ts` |
| 40 | テスト + 改善 (税額計算網羅39テスト) | ✅ | tax-comprehensive.test.ts |

### 税額計算対応
- 所得税 (7段階累進課税 + 復興特別所得税)
- 住民税 (所得割10% + 均等割)
- 給与所得控除 (6段階速算表)
- 9種の所得控除 (基礎/配偶者/扶養/社会保険/生命保険/医療費/iDeCo/ふるさと納税/住宅ローン)

---

## Phase 5: 金融サービス比較 + エージェント (Day 41-52) 🔄 進行中

| Day | タスク | 状態 | 主要ファイル |
|-----|--------|------|-------------|
| 41 | サービスDBモデル (11サービス, 4カテゴリ) | ✅ | `src/lib/constants/financial-services.ts` |
| 42 | 比較エンジン + 比較UI (スコアリング, ソート) | ✅ | `src/lib/utils/service-comparison.ts` |
| 43 | 比較UI (2) 比較テーブル + 年間メリット | ✅ | ComparisonTable, AnnualMeritCard |
| 44 | 比較UI 詳細 (メリット/デメリット, 口コミ, 節約額) | ✅ | ServiceDetailPanel |
| 45 | クレカ最適化 (支出パターン分析, 2枚組み合わせ) | ✅ | `src/lib/utils/credit-card-optimizer.ts` |
| 46 | 保険見直し (ギャップ分析, ライフステージ判定) | ✅ | `src/lib/utils/insurance-analyzer.ts` |
| 47 | エージェントチャットUI (タスクカード形式, 承認フロー) | ✅ | `src/app/(dashboard)/agent/` |
| 48 | エージェントツール (1) Tool Use + 5ツール | ✅ | `src/lib/ai/tools/` |
| 49 | エージェントツール (2) サブスク監査 + 固定費 + 切替ガイド | ✅ | `src/lib/ai/tools/subscription-audit.ts` |
| 50 | アクション承認フロー (3段階: 提案→詳細→承認) | ✅ | ActionApproval |
| 51 | タスク進捗管理 (進捗バー, タイムライン, 達成率リング) | ✅ | TaskProgressTracker |
| 52 | テスト + 改善 (エージェントE2E, 本番ビルド, 23テスト追加) | ✅ | agent-flow.test.ts |

---

## Phase 6: 仕上げ + リリース準備 (Day 53-60) ⬜

| Day | タスク | 状態 |
|-----|--------|------|
| 53 | アラート・通知システム (異常検知, 季節通知, 節税機会) | ✅ |
| 54 | 金融リテラシー (9トピック, 12用語, Tips, 進捗) | ✅ |
| 55 | ランディングページ (ヒーロー, 機能, 料金, CTA) | ✅ |
| 56 | パフォーマンス最適化 (動的インポート, DB接続プール, Next.js設定) | ✅ |
| 57 | セキュリティ監査 (RLS再適用, XSS/SQLi検証, 18テスト) | ✅ |
| 58 | アクセシビリティ (スキップリンク, ARIA, 静的解析10テスト) | ✅ |
| 59 | E2Eテスト + ドキュメント (10フロー統合テスト, README) | ✅ |
| 60 | デプロイ + モニタリング (Vercel設定, 最終ビルド, ドキュメント) | ✅ |

---

## テスト一覧 (346件)

| ファイル | テスト数 | カバー範囲 |
|----------|---------|-----------|
| format.test.ts | 12 | formatCurrency, parseCurrencyString |
| validations.test.ts | 30 | Zod スキーマ Step1-5 |
| tier.test.ts | 6 | ティア判定境界値 |
| auth-routes.test.ts | 13 | 公開パス判定, リダイレクト |
| profile.test.ts | 7 | CRUD + スナップショット (integration) |
| household-score.test.ts | 33 | 5指標, ティア別, 現実シナリオ |
| edge-cases.test.ts | 13 | 極値, オーバーフロー |
| csv-adapter.test.ts | 16 | CSV解析, バリデーション |
| cashflow-engine.test.ts | 28 | シミュレーション基本 + 現実シナリオ |
| cashflow-edge-cases.test.ts | 26 | 極端パラメータ, 退職, イベント |
| calculations.test.ts | 36 | 所得税, 住民税, ふるさと納税 |
| investment-plans.test.ts | 17 | 積立複利, iDeCo/NISA節税 |
| subsidies.test.ts | 14 | 補助金マッチング |
| tax-filing.test.ts | 23 | 確定申告判定 |
| year-end-adjustment.test.ts | 17 | 年末調整ステップ生成 |
| tax-comprehensive.test.ts | 39 | 税額照合, 手取り妥当性 |
| service-comparison.test.ts | 16 | サービス比較スコアリング |
| credit-card-optimizer.test.ts | 10 | クレカ最適化, 組み合わせ効果 |

---

## 技術スタック

| 層 | 技術 |
|----|------|
| フレームワーク | Next.js 16.1.6 (App Router, Turbopack) |
| 言語 | TypeScript 5.x (strict) |
| スタイリング | Tailwind CSS 4 |
| UIコンポーネント | Radix UI (直接使用, shadcn/ui不使用) |
| アニメーション | Framer Motion 12 |
| チャート | Recharts 3.8 |
| DB | Supabase PostgreSQL + Drizzle ORM |
| 認証 | Supabase Auth (メール + Google OAuth) |
| AI | Anthropic Claude API (claude-sonnet-4) |
| テスト | Vitest 4 + Storybook 10 |
| Lint/Format | Biome |

---

## DB テーブル

| テーブル | 用途 |
|----------|------|
| user_profiles | ユーザー基本情報 (1:1 with Supabase Auth) |
| income_sources | 収入源 |
| expense_records | 支出記録 |
| assets | 資産 |
| liabilities | 負債 |
| profile_snapshots | プロファイル変更履歴 |
| ai_insight_cache | AIインサイトキャッシュ (24h TTL) |
| financial_services | 金融サービスマスター |
| subsidies_master | 補助金マスター |
| data_freshness | データ鮮度管理 |

---

## API ルート

| エンドポイント | メソッド | 用途 |
|---------------|---------|------|
| /api/auth/callback | GET | OAuth/メール確認コールバック |
| /api/diagnosis | POST | 家計診断AIインサイト (SSE) |
| /api/simulation | POST | シミュレーション分析AI (SSE) |
| /api/tax-advice | POST | 税務アドバイザーAI (SSE) |
| /api/cron/subsidies | GET | 補助金データ鮮度チェック |

---

## スクリプト

| スクリプト | 用途 |
|-----------|------|
| scripts/seed-subsidies.ts | 補助金データ投入 (--force で上書き) |
| scripts/seed-services.ts | 金融サービスデータ投入 |
| scripts/update-tax-rates.ts | 税率データ鮮度更新 |
