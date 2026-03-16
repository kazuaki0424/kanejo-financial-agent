# Kanejo — パーソナル金融エージェント 開発ガイド

> "すべての人に、自分だけのCFOを。"

---

## 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [技術スタック](#2-技術スタック)
3. [ファイル構造](#3-ファイル構造)
4. [CLAUDE.md 設定](#4-claudemd-設定)
5. [デザインシステム](#5-デザインシステム)
6. [デイリー開発計画（60日間）](#6-デイリー開発計画60日間)
7. [Claude Code スキル設定](#7-claude-code-スキル設定)
8. [データベース設計](#8-データベース設計)
9. [AI エージェント設計](#9-ai-エージェント設計)
10. [セキュリティ・コンプライアンス](#10-セキュリティコンプライアンス)

---

## 1. プロジェクト概要

### プロダクトビジョン

Kanejo（仮称）は、AI駆動のパーソナル金融エージェントサービス。
富裕層が専属アドバイザーに頼んでいることを、すべてのユーザーに提供する。

### コア機能

| 機能 | 概要 | 優先度 |
|------|------|--------|
| 家計診断ダッシュボード | 収支分析・資産可視化・家計スコア | P0 |
| ライフプランシミュレーション | ライフイベント別の将来試算 | P0 |
| 節税・補助金レコメンド | ふるさと納税/iDeCo/NISA/給付金 | P0 |
| 金融サービス横断比較 | 保険/クレカ/ローン/電力の最適提案 | P1 |
| エージェンティックコマース | 自動契約・切替・ポイント最適化 | P1 |
| 金融リテラシー教育 | パーソナライズされた学習コンテンツ | P2 |
| アラート・通知 | 支出異常/制度変更/契約更新 | P2 |

### ユーザーティア

| ティア | 年収目安 | フォーカス |
|--------|----------|-----------|
| ベーシック | 〜500万 | 家計改善・固定費削減・補助金 |
| ミドル | 500〜1,500万 | 節税最適化・住宅ローン・保険見直し |
| ハイエンド | 1,500万〜 | 資産運用・法人設立・相続対策 |

---

## 2. 技術スタック

### フロントエンド

```
Next.js 15          — App Router（RSC + Server Actions）
TypeScript 5.x      — 厳格モード
Tailwind CSS 4      — ユーティリティファースト
Framer Motion 12    — アニメーション
Recharts 2          — チャート/データ可視化
Radix UI            — アクセシブルなヘッドレスコンポーネント
nuqs                — URL State管理
```

### バックエンド

```
Next.js API Routes   — BFF（Backend for Frontend）
Hono                 — 軽量APIサーバー（必要時）
Drizzle ORM          — 型安全なDB操作
Zod                  — スキーマバリデーション
```

### インフラ・サービス

```
Supabase             — PostgreSQL + Auth + Realtime
Vercel               — デプロイ・Edge Functions
Upstash Redis        — キャッシュ・Rate Limiting
Anthropic Claude API — AIエージェント推論
Resend               — トランザクションメール
```

### 開発ツール

```
Claude Code          — AIアシスト開発
Biome                — Linter + Formatter
Vitest               — ユニットテスト
Playwright           — E2Eテスト
Storybook            — コンポーネントカタログ
```

---

## 3. ファイル構造

```
kanejo/
├── .claude/
│   └── settings.json          # Claude Code プロジェクト設定
├── CLAUDE.md                  # Claude Code 指示ファイル（最重要）
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # 認証グループ
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/       # メインアプリグループ
│   │   │   ├── layout.tsx     # サイドバー + ヘッダー
│   │   │   ├── page.tsx       # ダッシュボード（ホーム）
│   │   │   │
│   │   │   ├── diagnosis/     # 家計診断
│   │   │   │   ├── page.tsx
│   │   │   │   ├── _components/
│   │   │   │   │   ├── income-expense-chart.tsx
│   │   │   │   │   ├── asset-breakdown.tsx
│   │   │   │   │   ├── household-score.tsx
│   │   │   │   │   └── spending-category-ring.tsx
│   │   │   │   └── _actions/
│   │   │   │       └── diagnosis.ts
│   │   │   │
│   │   │   ├── simulation/    # ライフプランシミュレーション
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [event]/   # 動的ルート: marriage, housing, retirement etc.
│   │   │   │   │   └── page.tsx
│   │   │   │   └── _components/
│   │   │   │       ├── timeline-editor.tsx
│   │   │   │       ├── cashflow-projection.tsx
│   │   │   │       └── scenario-comparison.tsx
│   │   │   │
│   │   │   ├── tax/           # 節税・補助金
│   │   │   │   ├── page.tsx
│   │   │   │   ├── furusato/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── ideco-nisa/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── subsidies/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── _components/
│   │   │   │       ├── tax-saving-summary.tsx
│   │   │   │       ├── subsidy-match-list.tsx
│   │   │   │       └── deduction-optimizer.tsx
│   │   │   │
│   │   │   ├── compare/       # 金融サービス比較
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [category]/ # insurance, credit-card, loan, utility
│   │   │   │   │   └── page.tsx
│   │   │   │   └── _components/
│   │   │   │       ├── comparison-table.tsx
│   │   │   │       ├── recommendation-card.tsx
│   │   │   │       └── switch-wizard.tsx
│   │   │   │
│   │   │   ├── agent/         # エージェンティックコマース
│   │   │   │   ├── page.tsx
│   │   │   │   ├── _components/
│   │   │   │   │   ├── agent-chat.tsx
│   │   │   │   │   ├── action-approval.tsx
│   │   │   │   │   ├── task-progress.tsx
│   │   │   │   │   └── subscription-audit.tsx
│   │   │   │   └── _actions/
│   │   │   │       └── agent-execute.ts
│   │   │   │
│   │   │   ├── learn/         # 金融リテラシー
│   │   │   │   ├── page.tsx
│   │   │   │   └── [topic]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── alerts/        # アラート・通知
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   └── settings/      # ユーザー設定
│   │   │       ├── page.tsx
│   │   │       ├── profile/
│   │   │       │   └── page.tsx
│   │   │       └── connections/  # 外部サービス連携
│   │   │           └── page.tsx
│   │   │
│   │   ├── api/               # API Routes
│   │   │   ├── auth/
│   │   │   │   └── callback/
│   │   │   │       └── route.ts
│   │   │   ├── agent/
│   │   │   │   ├── chat/
│   │   │   │   │   └── route.ts    # ストリーミング対応
│   │   │   │   └── execute/
│   │   │   │       └── route.ts
│   │   │   ├── diagnosis/
│   │   │   │   └── route.ts
│   │   │   ├── webhooks/
│   │   │   │   └── stripe/
│   │   │   │       └── route.ts
│   │   │   └── cron/
│   │   │       ├── alerts/
│   │   │       │   └── route.ts
│   │   │       └── market-data/
│   │   │           └── route.ts
│   │   │
│   │   ├── layout.tsx         # ルートレイアウト
│   │   ├── page.tsx           # ランディングページ
│   │   ├── globals.css        # Tailwind + カスタムプロパティ
│   │   └── not-found.tsx
│   │
│   ├── components/            # 共通コンポーネント
│   │   ├── ui/                # プリミティブUI（Radix + Tailwind）
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   └── tooltip.tsx
│   │   │
│   │   ├── charts/            # チャートコンポーネント
│   │   │   ├── area-chart.tsx
│   │   │   ├── bar-chart.tsx
│   │   │   ├── donut-chart.tsx
│   │   │   ├── line-chart.tsx
│   │   │   └── sparkline.tsx
│   │   │
│   │   ├── layout/            # レイアウトコンポーネント
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   └── breadcrumb.tsx
│   │   │
│   │   └── shared/            # ドメイン横断の共有コンポーネント
│   │       ├── currency-display.tsx
│   │       ├── percentage-badge.tsx
│   │       ├── tier-indicator.tsx
│   │       ├── empty-state.tsx
│   │       ├── loading-skeleton.tsx
│   │       └── error-boundary.tsx
│   │
│   ├── lib/                   # ユーティリティ・設定
│   │   ├── supabase/
│   │   │   ├── client.ts      # ブラウザクライアント
│   │   │   ├── server.ts      # サーバークライアント
│   │   │   └── middleware.ts
│   │   ├── ai/
│   │   │   ├── client.ts      # Anthropic API クライアント
│   │   │   ├── prompts/       # プロンプトテンプレート
│   │   │   │   ├── diagnosis.ts
│   │   │   │   ├── tax-advisor.ts
│   │   │   │   ├── comparison.ts
│   │   │   │   └── agent.ts
│   │   │   └── tools/         # エージェントツール定義
│   │   │       ├── search-subsidies.ts
│   │   │       ├── compare-services.ts
│   │   │       ├── calculate-tax.ts
│   │   │       └── simulate-plan.ts
│   │   ├── db/
│   │   │   ├── schema.ts      # Drizzle スキーマ
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── validations/       # Zod スキーマ
│   │   │   ├── profile.ts
│   │   │   ├── diagnosis.ts
│   │   │   └── simulation.ts
│   │   ├── constants/
│   │   │   ├── tax-rates.ts
│   │   │   ├── subsidies.ts
│   │   │   └── tiers.ts
│   │   └── utils/
│   │       ├── format.ts      # 通貨・日付フォーマット
│   │       ├── calculations.ts # 金融計算ロジック
│   │       └── cn.ts          # clsx + tailwind-merge
│   │
│   ├── hooks/                 # カスタムフック
│   │   ├── use-user-profile.ts
│   │   ├── use-diagnosis.ts
│   │   ├── use-agent-chat.ts
│   │   └── use-media-query.ts
│   │
│   ├── stores/                # クライアント状態管理（Zustand）
│   │   ├── profile-store.ts
│   │   ├── simulation-store.ts
│   │   └── notification-store.ts
│   │
│   └── types/                 # 型定義
│       ├── database.ts        # DB型（Drizzle推論）
│       ├── api.ts             # APIレスポンス型
│       ├── finance.ts         # 金融ドメイン型
│       └── agent.ts           # エージェント型
│
├── public/
│   ├── fonts/                 # セルフホストフォント
│   │   ├── noto-sans-jp-*.woff2
│   │   └── instrument-serif-*.woff2
│   ├── illustrations/         # カスタムイラスト（SVG）
│   └── og-image.png
│
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   └── seed.sql
│
├── tests/
│   ├── unit/
│   │   ├── calculations.test.ts
│   │   └── validations.test.ts
│   ├── integration/
│   │   └── api/
│   │       └── diagnosis.test.ts
│   └── e2e/
│       ├── onboarding.spec.ts
│       └── diagnosis-flow.spec.ts
│
├── .storybook/
│   └── main.ts
│
├── scripts/
│   ├── seed-subsidies.ts      # 補助金データのシード
│   ├── update-tax-rates.ts    # 税率更新スクリプト
│   └── generate-types.ts      # Supabase型生成
│
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── biome.json
├── package.json
└── README.md
```

### ディレクトリ設計のポイント

**ルートグルーピング**
- `(auth)` — 認証前のページ。独自レイアウト（サイドバーなし）
- `(dashboard)` — 認証後のメインアプリ。共通レイアウト（サイドバー＋ヘッダー）

**コロケーション（同置）**
- `_components/` — そのルート専用のコンポーネント。先頭 `_` で Next.js のルーティング対象外
- `_actions/` — Server Actions をルートに同置

**共有 vs ローカル**
- `src/components/ui/` — アプリ全体で使うプリミティブ
- `src/components/charts/` — チャートラッパー（Recharts のスタイル統一）
- `_components/` — 特定ルートでしか使わないもの

---

## 4. CLAUDE.md 設定

プロジェクトルートに以下の `CLAUDE.md` を配置する。
これが Claude Code に対する「脳」となり、全生成コードの品質を支配する。

````markdown
# Kanejo — Claude Code 指示書

## プロジェクト概要
パーソナル金融エージェントサービス「Kanejo」の開発プロジェクト。
すべてのユーザーに専属CFOを提供することを目指す。

## 技術スタック（厳守）
- Next.js 15 (App Router, RSC, Server Actions)
- TypeScript 5.x (strict mode)
- Tailwind CSS 4
- Radix UI (ヘッドレスコンポーネント)
- Framer Motion 12 (アニメーション)
- Recharts 2 (チャート)
- Drizzle ORM (DB)
- Supabase (PostgreSQL + Auth)
- Zod (バリデーション)
- Anthropic Claude API (AI推論)

## コーディング規約

### TypeScript
- `any` 禁止。`unknown` + 型ガードを使う
- 関数の戻り値型は明示する（推論に頼らない）
- 型定義は `src/types/` に集約
- enum は使わない。`as const` + `type` で代替

### React / Next.js
- Server Component をデフォルトにする。`"use client"` は最小限
- データ取得は Server Component か Server Action で行う
- クライアントコンポーネントは小さく切り出す（"Islands Architecture"）
- Props は `interface` で定義（`type` ではなく）
- コンポーネントは `export function` で公開（`export default` は page.tsx のみ）

### 命名規則
- ファイル: kebab-case (`income-expense-chart.tsx`)
- コンポーネント: PascalCase (`IncomeExpenseChart`)
- 関数・変数: camelCase (`calculateTaxSaving`)
- 定数: UPPER_SNAKE_CASE (`MAX_FURUSATO_LIMIT`)
- 型・Interface: PascalCase (`UserProfile`)
- DB テーブル: snake_case (`user_profiles`)
- DB カラム: snake_case (`annual_income`)
- URL パス: kebab-case (`/tax/furusato`)

### ファイル構成ルール
- ルート固有のコンポーネントは `_components/` に同置
- Server Actions は `_actions/` に同置
- 共有コンポーネントは `src/components/` に配置
- 1ファイル1コンポーネント（例外: 小さなサブコンポーネント）
- index.ts でのバレルエクスポートは禁止（Tree-shaking を阻害）

### スタイリング
- Tailwind ユーティリティを第一選択
- カスタムCSSは globals.css のCSS変数のみ
- レスポンシブは mobile-first (`sm:`, `md:`, `lg:`)
- ダークモードは `dark:` プレフィックス
- 色は必ず CSS 変数経由 (`text-foreground`, `bg-surface` 等)
- マジックナンバー禁止。spacing/sizing は Tailwind の定義済み値を使う

### デザイン原則（最重要）
1. **AIっぽくないこと** — 紫グラデーション、ネオン、宇宙テーマ禁止
2. **金融の信頼感** — 落ち着いた色彩、十分な余白、明確な情報階層
3. **和のミニマリズム** — 要素を削ぎ落とす。余白が語る
4. **マイクロインタラクション** — 数値変化のアニメーション、ホバー遷移
5. **データ密度** — 一画面で十分な情報量。ただし視覚的ノイズはゼロ

### エラーハンドリング
- API エラーは必ず try-catch + 型付きエラーレスポンス
- ユーザー向けエラーメッセージは日本語で具体的に
- Optimistic UI + エラー時のロールバック
- loading.tsx / error.tsx / not-found.tsx を全ルートに配置

### パフォーマンス
- 画像は next/image + WebP
- フォントは next/font + セルフホスト
- 動的インポートで重いコンポーネントを遅延読み込み
- React.memo は計測してから（早期最適化しない）

### セキュリティ
- ユーザー入力は Zod で必ずバリデーション
- SQLインジェクション対策: Drizzle のパラメータバインディングのみ
- 金融データは暗号化して保存
- API Rate Limiting を全エンドポイントに適用
- CSRFトークンを Server Actions で検証

### テスト
- 金融計算ロジックは 100% カバレッジ
- Server Actions は integration test で検証
- 重要なユーザーフローは E2E テスト
- Storybook でコンポーネントのビジュアル確認

### Git コミットメッセージ
- Conventional Commits 形式
- 例: `feat(diagnosis): add household score calculation`
- 例: `fix(tax): correct furusato deduction limit for dual income`
- 日本語は commit body に記載可

### 禁止事項
- `any` 型
- `console.log` (logger を使う)
- インラインスタイル（Tailwind を使う）
- `!important`
- ハードコードされた色コード（CSS変数を使う）
- barrel export (index.ts)
- relative import で 3階層以上遡る（`@/` エイリアスを使う）
- shadcn/ui（Radix UI を直接使う。自前のデザインシステム）
````

---

## 5. デザインシステム

### 設計思想: "静かな信頼"

このサービスのデザインは **"AI感のない、本物の金融サービス"** を目指す。
参考にすべきは Stripe Dashboard、Linear、Wise（旧TransferWise）のUI。
避けるべきは ChatGPT風の会話UI、紫グラデーション、SFテーマ。

### カラーシステム

```css
/* globals.css — Design Tokens */
:root {
  /* === ベースカラー === */
  --color-ink:          #1a1a1a;     /* メインテキスト */
  --color-ink-muted:    #6b6b6b;     /* セカンダリテキスト */
  --color-ink-subtle:   #9b9b9b;     /* ヒント・プレースホルダー */

  --color-surface:      #ffffff;     /* カード・コンテナ背景 */
  --color-surface-alt:  #f7f7f5;     /* ページ背景 */
  --color-surface-hover:#f0f0ec;     /* ホバー状態 */

  --color-border:       #e5e5e0;     /* 通常ボーダー */
  --color-border-strong:#d0d0c8;     /* 強調ボーダー */

  /* === アクセントカラー === */
  --color-primary:      #2d5a27;     /* 深緑 — 成長・安定の象徴 */
  --color-primary-light:#e8f0e6;     /* 背景用 */
  --color-primary-hover:#234a1e;     /* ホバー */

  /* === セマンティックカラー === */
  --color-positive:     #1a7a3a;     /* 収入・プラス */
  --color-positive-bg:  #edf7ef;
  --color-negative:     #c4321c;     /* 支出・マイナス */
  --color-negative-bg:  #fdf0ed;
  --color-warning:      #b45309;     /* 注意 */
  --color-warning-bg:   #fef9ee;
  --color-info:         #1e6ca1;     /* 情報 */
  --color-info-bg:      #eff6fc;

  /* === チャートカラー（最大6色） === */
  --chart-1:  #2d5a27;  /* 深緑 */
  --chart-2:  #6b8f68;  /* 淡緑 */
  --chart-3:  #c4a35a;  /* 暖金 */
  --chart-4:  #8b6d47;  /* ブラウン */
  --chart-5:  #5a7d8b;  /* 青灰 */
  --chart-6:  #a0887a;  /* ウォームグレー */

  /* === タイポグラフィ === */
  --font-sans:   'Noto Sans JP', system-ui, sans-serif;
  --font-display:'Instrument Serif', 'Noto Serif JP', serif;
  --font-mono:   'JetBrains Mono', monospace;

  /* === スペーシング === */
  --space-page:  clamp(1rem, 4vw, 3rem);

  /* === ボーダー === */
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   16px;
  --radius-full: 9999px;

  /* === シャドウ（最小限） === */
  --shadow-sm:   0 1px 2px rgba(0,0,0,0.04);
  --shadow-md:   0 2px 8px rgba(0,0,0,0.06);
  --shadow-lg:   0 4px 16px rgba(0,0,0,0.08);
}

/* ダークモード */
.dark {
  --color-ink:          #e8e8e3;
  --color-ink-muted:    #a0a09a;
  --color-ink-subtle:   #6b6b65;

  --color-surface:      #1c1c1a;
  --color-surface-alt:  #141413;
  --color-surface-hover:#252523;

  --color-border:       #2e2e2a;
  --color-border-strong:#3d3d38;

  --color-primary:      #6bb563;
  --color-primary-light:#1e2d1c;
  --color-primary-hover:#82c87a;
}
```

### タイポグラフィ

```
見出し（Display）  — Instrument Serif: 数値やKPIの大きな表示に使用
                     例: "¥2,450,000" の年間節税額
本文（Body）       — Noto Sans JP: 全テキストのデフォルト
数値（Numeric）    — Tabular Nums (font-variant-numeric: tabular-nums)
                     テーブルや金額表示で桁を揃える
```

### レイアウト設計

```
┌──────────────────────────────────────────────┐
│  Header: ロゴ + 検索 + 通知 + アバター       │
├────────┬─────────────────────────────────────┤
│        │                                     │
│  Side  │         Main Content                │
│  bar   │                                     │
│        │  ┌─────────┐ ┌─────────┐           │
│  Nav   │  │ Metric  │ │ Metric  │           │
│  items │  │ Card    │ │ Card    │           │
│        │  └─────────┘ └─────────┘           │
│  ------│                                     │
│  Tier  │  ┌───────────────────────┐         │
│  badge │  │                       │         │
│        │  │    Primary Chart      │         │
│        │  │                       │         │
│        │  └───────────────────────┘         │
│        │                                     │
│        │  ┌──────────┐ ┌──────────┐         │
│        │  │ Detail   │ │ AI       │         │
│        │  │ Table    │ │ Insight  │         │
│        │  └──────────┘ └──────────┘         │
│        │                                     │
├────────┴─────────────────────────────────────┤
│  （モバイル: Bottom Tab Navigation）          │
└──────────────────────────────────────────────┘
```

### コンポーネントデザイン原則

**カード**
- 背景: `var(--color-surface)` + ボーダー `1px solid var(--color-border)`
- 角丸: `var(--radius-lg)`
- パディング: `24px`
- シャドウなし（ボーダーで十分）

**メトリクスカード**
- 大きな数値: `Instrument Serif, 32px, color-ink`
- ラベル: `Noto Sans JP, 13px, color-ink-muted`
- 変化率バッジ: 正は `color-positive`, 負は `color-negative`

**ボタン**
- Primary: `bg-primary, text-white, radius-md`。角丸は控えめ
- Secondary: `bg-transparent, border, color-ink`
- Ghost: テキストのみ + ホバーで背景
- サイズ: height 36px / 40px / 48px の3段階

**AIインサイト表示（重要）**
- チャットバブルではない。カードの一部として自然に統合
- アイコン: 小さな葉のモチーフ（AIマーク的なスパークルは使わない）
- 背景: `var(--color-primary-light)` + 左ボーダー `3px solid var(--color-primary)`
- テキストトーン: 「〜かもしれません」「検討の余地があります」（断定を避ける）

**アニメーション**
- 数値カウントアップ: `framer-motion` の `animate` で 0 → 目標値
- ページ遷移: `opacity 0→1` + `y: 8→0`, duration `200ms`
- チャート描画: `stroke-dasharray` で線がスッと伸びる
- ホバー: `scale(1.01)` + `shadow` 変化、150ms ease-out
- 過剰なアニメーション禁止。動きは情報伝達のためだけに使う

---

## 6. デイリー開発計画（60日間）

### Phase 0: 基盤構築（Day 1-5）

| Day | タスク | Claude Code への指示例 | 完了条件 |
|-----|--------|----------------------|----------|
| 1 | プロジェクト初期化 | `Next.js 15 + TypeScript + Tailwind 4 のプロジェクトを作成。App Router, strict mode, path alias @/ を設定。biome.json でフォーマッター設定` | `npm run dev` で起動確認 |
| 2 | デザインシステム基盤 | `globals.css にデザイントークン（カラー・タイポグラフィ・スペーシング）を定義。Noto Sans JP と Instrument Serif をセルフホスト。ダークモード対応` | ライト/ダーク切替確認 |
| 3 | UIプリミティブ (1) | `Radix UI をベースに Button, Card, Input, Select, Dialog コンポーネントを作成。Tailwind でスタイリング。Storybook にカタログ化` | Storybook で全バリアント確認 |
| 4 | UIプリミティブ (2) | `Tabs, Tooltip, Dropdown, Toast, Slider, Badge を作成。レスポンシブ対応。アクセシビリティ（キーボード操作・ARIA）確認` | アクセシビリティチェック通過 |
| 5 | レイアウトシェル | `サイドバー + ヘッダー + メインコンテンツのレイアウト。サイドバーは折りたたみ可能。モバイルはボトムナビ。Framer Motionで遷移アニメーション` | レスポンシブ3ブレークポイント確認 |

### Phase 1: 認証 + プロファイル（Day 6-12）

| Day | タスク | 指示例 | 完了条件 |
|-----|--------|--------|----------|
| 6 | Supabase セットアップ | `Supabase プロジェクト接続。Auth（メール + Google OAuth）設定。Row Level Security 有効化。サーバー/クライアントの Supabase クライアント作成` | ログイン/ログアウト動作確認 |
| 7 | DB スキーマ設計 | `Drizzle ORM でスキーマ定義。users, user_profiles, income_sources, expenses, assets, liabilities テーブル。マイグレーション実行` | マイグレーション成功 |
| 8 | オンボーディングUI (1) | `ステップ式のオンボーディングフロー。Step 1: 基本情報（年齢・性別・居住地・家族構成）。プログレスバー付き。バリデーションは Zod` | フォーム入力→DB保存確認 |
| 9 | オンボーディングUI (2) | `Step 2: 収入情報（年収・副業・投資収入）。Step 3: 支出概算（住居費・食費・通信費等のスライダー入力）。金額入力はカンマ区切り自動フォーマット` | 全ステップ完走→プロファイル作成 |
| 10 | オンボーディングUI (3) | `Step 4: 資産・負債（預金・投資・ローン）。Step 5: 目標設定（老後資金・住宅購入・教育費等を選択）。完了画面でティア判定表示` | ティア自動判定ロジック確認 |
| 11 | プロファイル編集 | `設定画面でプロファイル全項目を編集可能に。Optimistic UI。変更履歴をスナップショットとしてDBに保存` | 編集→即時反映→DB永続化 |
| 12 | 認証ガード + テスト | `未認証ユーザーのリダイレクト。Middleware でセッション検証。オンボーディング未完了ユーザーのリダイレクト。E2Eテスト` | 全認証パス正常動作 |

### Phase 2: 家計診断ダッシュボード（Day 13-22）

| Day | タスク | 指示例 | 完了条件 |
|-----|--------|--------|----------|
| 13 | ダッシュボードレイアウト | `メインダッシュボード。上部にメトリクスカード4枚（月収・月支出・貯蓄率・家計スコア）。Framer Motion で数値カウントアップアニメーション` | カード4枚レンダリング |
| 14 | 収支チャート | `Recharts で月次収支の棒グラフ（収入:緑、支出:赤）。12ヶ月分表示。ホバーでツールチップ。レスポンシブ` | チャート表示＋インタラクション |
| 15 | 支出カテゴリ分析 | `ドーナツチャートで支出カテゴリ別割合。右側にカテゴリリスト（金額・前月比）。カテゴリタップで詳細展開` | カテゴリ別表示＋ドリルダウン |
| 16 | 資産ポートフォリオ | `資産構成をツリーマップまたはスタックバーで可視化。預金/株式/投信/不動産/その他。タップで詳細` | 資産可視化完了 |
| 17 | 家計スコアエンジン | `ユーザーの収支バランス・貯蓄率・負債比率・資産分散度・保険カバー率から 0-100 のスコアを算出。各指標のウェイトはティア別に調整` | スコア算出ロジック＋ユニットテスト |
| 18 | 家計スコアUI | `スコアをアニメーション付き円形ゲージで表示。5段階評価（S/A/B/C/D）。各指標のレーダーチャート。改善ポイントのリスト` | ゲージ＋レーダーチャート表示 |
| 19 | AIインサイト (1) | `Claude API 連携。ユーザーの家計データをコンテキストとして渡し、3つの改善提案を生成。ストリーミング表示` | AI提案の生成＋表示 |
| 20 | AIインサイト (2) | `インサイトのUI洗練。カードの一部として自然に統合（チャットUIにしない）。プロンプトのチューニング。キャッシュ戦略` | インサイト品質確認 |
| 21 | データ入力・同期 | `手動での収支入力フォーム。CSV一括インポート機能。将来的なAPI連携のためのアダプターパターン設計` | 手動入力＋CSVインポート |
| 22 | テスト + 改善 | `ダッシュボード全体のE2Eテスト。パフォーマンス計測（Core Web Vitals）。レスポンシブ確認。edge case修正` | LCP < 2.5s, CLS < 0.1 |

### Phase 3: ライフプランシミュレーション（Day 23-30）

| Day | タスク | 指示例 | 完了条件 |
|-----|--------|--------|----------|
| 23 | シミュレーションエンジン | `年次キャッシュフロー予測エンジン。インフレ率・昇給率・投資利回りをパラメータ化。30年分のプロジェクション。ユニットテスト` | 計算ロジック＋テスト |
| 24 | タイムラインUI | `横軸が年齢のタイムライン。ライフイベント（結婚・出産・住宅・退職等）をドラッグ＆ドロップで配置。各イベントのコスト自動見積もり` | タイムライン操作確認 |
| 25 | キャッシュフローチャート | `エリアチャートで30年分の資産推移を可視化。収入・支出・貯蓄の3レイヤー。イベント発生年にマーカー表示` | チャート表示＋イベントマーカー |
| 26 | シナリオ比較 | `最大3シナリオを並列表示。「マンション購入 vs 賃貸継続」のような比較。差分ハイライト` | 2シナリオ比較表示 |
| 27 | イベントテンプレート | `主要ライフイベントのテンプレート。結婚（式費用+引越し）、出産（医療費+育児用品+教育費）、住宅購入（頭金+ローン）、退職（退職金+年金）` | テンプレート5種類以上 |
| 28 | AI提案統合 | `シミュレーション結果に基づき、Claude API で「このタイミングでの住宅購入は適切か」等のアドバイスを生成` | AI提案表示 |
| 29 | パラメータ調整UI | `インフレ率・昇給率・投資利回り等のスライダー。変更即時反映（Optimistic UI）。感度分析：パラメータ±1%の影響表示` | リアルタイム反映確認 |
| 30 | テスト + 改善 | `エッジケース（マイナス資産・極端なパラメータ）テスト。シミュレーション精度検証。UIポリッシュ` | 主要シナリオ全テスト通過 |

### Phase 4: 節税・補助金（Day 31-40）

| Day | タスク | 指示例 | 完了条件 |
|-----|--------|--------|----------|
| 31 | 税制データモデル | `所得税・住民税の計算ロジック。累進課税テーブル。各種控除（基礎・配偶者・扶養・社会保険・生命保険・医療費・住宅ローン）。ユニットテスト` | 税額計算テスト通過 |
| 32 | ふるさと納税最適化 | `年収・家族構成から控除上限額を自動計算。返礼品カテゴリ別のおすすめ表示。寄付シミュレーション` | 上限額計算＋UI |
| 33 | iDeCo/NISA提案 | `ユーザーのティア・年齢に応じたiDeCo/つみたてNISA/成長投資枠の最適配分提案。節税効果の試算` | 配分提案＋節税額表示 |
| 34 | 補助金マッチング | `自治体の補助金・給付金データベース。ユーザーの居住地・年齢・世帯構成・収入でフィルタリング。申請期限アラート` | マッチング結果表示 |
| 35 | 確定申告ガイド | `ユーザーの状況から「確定申告が必要か」を判定。必要な場合のステップバイステップガイド。必要書類チェックリスト` | 判定ロジック＋ガイドUI |
| 36 | 節税サマリーダッシュボード | `年間の節税可能額を一覧表示。「実行済み」「未実行」のステータス管理。総節税額のメトリクスカード` | サマリー表示 |
| 37 | AIタックスアドバイザー | `Claude API で個別の節税相談。「副業収入がある場合の最適な申告方法は？」等。免責表示付き` | AI相談＋免責表示 |
| 38 | 補助金データ更新パイプライン | `補助金データのスクレイピング/API取得スクリプト。定期更新のCronジョブ設計。データ鮮度管理` | 更新スクリプト動作確認 |
| 39 | 年末調整ウィザード | `会社員向けの年末調整ガイド。控除申告書の記入サポート。扶養控除の最適化` | ウィザード完走確認 |
| 40 | テスト + 改善 | `税額計算の網羅テスト（確定申告シミュレータと照合）。エッジケース。UIポリッシュ` | 計算精度99%以上 |

### Phase 5: 金融サービス比較 + エージェント（Day 41-52）

| Day | タスク | 指示例 | 完了条件 |
|-----|--------|--------|----------|
| 41 | サービスDBモデル | `金融サービス（保険・クレカ・ローン・電力・通信）のデータモデル。特徴・料金・条件のスキーマ。シードデータ投入` | DBスキーマ＋シードデータ |
| 42 | 比較エンジン | `ユーザープロファイルと各サービスの条件をマッチング。スコアリングアルゴリズム。ソート・フィルター` | マッチングロジック＋テスト |
| 43 | 比較UI (1) | `サービス比較テーブル。ハイライト付き差分表示。ユーザーにとっての年間メリット額を表示。「おすすめ」バッジ` | 比較表示＋おすすめ |
| 44 | 比較UI (2) | `詳細画面。メリット/デメリット。乗り換えた場合の年間節約額。口コミ・評価。申し込みリンク` | 詳細画面完了 |
| 45 | クレカ最適化 | `ユーザーの支出パターンからポイント還元率を最大化するクレカの組み合わせを提案。年間獲得ポイント試算` | クレカ提案＋ポイント試算 |
| 46 | 保険見直し | `現在の保険と必要保障額のギャップ分析。ライフステージ別の推奨保険タイプ。保険料比較` | ギャップ分析＋比較 |
| 47 | エージェントチャットUI | `AIエージェントとの対話UI（ただしチャットバブルではなく、タスクカード形式）。タスク提案→承認→実行のフロー` | チャット＋タスクフロー |
| 48 | エージェントツール (1) | `Claude API Tool Use で金融サービス検索・比較ツールを定義。エージェントが自律的にツールを選択・実行` | ツール実行確認 |
| 49 | エージェントツール (2) | `サブスク監査ツール。固定費見直しツール。契約切替ウィザード生成ツール` | サブスク監査動作確認 |
| 50 | アクション承認フロー | `エージェントの提案アクション（契約切替等）の承認UI。3段階: 提案→詳細確認→実行承認。取り消し可能` | 承認フロー完走 |
| 51 | タスク進捗管理 | `実行中タスクの進捗表示。完了/失敗のステータス。完了時の節約額サマリー` | 進捗表示＋完了通知 |
| 52 | テスト + 改善 | `エージェントフロー全体のE2Eテスト。エラーハンドリング。レート制限テスト` | 主要フロー安定動作 |

### Phase 6: 仕上げ + リリース準備（Day 53-60）

| Day | タスク | 指示例 | 完了条件 |
|-----|--------|--------|----------|
| 53 | アラート・通知システム | `支出異常検知（前月比30%超）。制度変更通知。契約更新リマインダー。プッシュ通知（Web Push）` | 通知生成＋表示 |
| 54 | 金融リテラシーコンテンツ | `ティア別の学習コンテンツ。用語集。「今日のTips」カード。進捗トラッキング` | コンテンツ表示＋進捗 |
| 55 | ランディングページ | `Kanejo のプロダクトランディングページ。ヒーロー → 機能紹介 → 料金 → CTA。Framer Motion でスクロールアニメーション。Instrument Serif の大きな見出し` | LP完了＋レスポンシブ |
| 56 | パフォーマンス最適化 | `バンドルサイズ分析。コード分割最適化。画像最適化。Supabase クエリ最適化。Redis キャッシュ導入` | LCP < 2.0s 全ページ |
| 57 | セキュリティ監査 | `認証フロー全パスチェック。RLS ポリシー網羅確認。入力バリデーション確認。依存パッケージ脆弱性スキャン` | セキュリティチェック全通過 |
| 58 | アクセシビリティ + i18n | `WCAG 2.1 AA 準拠確認。スクリーンリーダーテスト。キーボード操作。将来的な多言語対応の基盤（i18n キー化）` | Lighthouse Accessibility > 90 |
| 59 | E2Eテスト + ドキュメント | `主要ユーザーフロー10本のE2Eテスト。README更新。デプロイ手順書。API ドキュメント` | テスト全通過＋ドキュメント |
| 60 | デプロイ + モニタリング | `Vercel デプロイ設定。環境変数設定。Sentry エラー監視。Vercel Analytics。ステージング→本番の手順確認` | 本番デプロイ＋監視稼働 |

---

## 7. Claude Code スキル設定

### .claude/settings.json

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Edit",
      "Write",
      "Bash(npm run *)",
      "Bash(npx *)",
      "Bash(node *)",
      "Bash(cat *)",
      "Bash(ls *)",
      "Bash(find *)",
      "Bash(grep *)",
      "Bash(git *)",
      "Bash(mkdir *)",
      "Bash(cp *)",
      "Bash(mv *)",
      "Bash(rm *)",
      "Bash(supabase *)"
    ],
    "deny": [
      "Bash(rm -rf /)",
      "Bash(sudo *)",
      "Bash(curl * | sh)",
      "Bash(wget * | sh)"
    ]
  }
}
```

### Claude Code の効果的な使い方

**1. タスク分解して渡す**

```
❌ 悪い例:
「ダッシュボードを作って」

✅ 良い例:
「src/app/(dashboard)/page.tsx にダッシュボードを作成。
 上部に4つのメトリクスカード（月収・月支出・貯蓄率・家計スコア）を
 CSS Grid で2×2配置。各カードは src/components/ui/card.tsx を使用。
 金額は Instrument Serif フォント、ラベルは Noto Sans JP 13px muted。
 データは仮の固定値でOK（後でServer Componentに変更する）。
 アニメーション: Framer Motion の animate で 0→目標値 のカウントアップ。
 レスポンシブ: モバイルは1列、md以上で2列。」
```

**2. 既存コードを参照させる**

```
「src/components/ui/card.tsx のスタイルに合わせて、
 新しく src/components/charts/donut-chart.tsx を作成。
 Recharts の PieChart を使い、色は globals.css の --chart-1〜6 を適用。
 中央にパーセンテージを大きく表示（Instrument Serif）。」
```

**3. バッチコマンドで反復作業**

```
「以下の5ページにそれぞれ loading.tsx, error.tsx, not-found.tsx を作成:
 - src/app/(dashboard)/diagnosis/
 - src/app/(dashboard)/simulation/
 - src/app/(dashboard)/tax/
 - src/app/(dashboard)/compare/
 - src/app/(dashboard)/agent/
 loading.tsx は src/components/shared/loading-skeleton.tsx を使用。
 error.tsx は src/components/shared/error-boundary.tsx パターンに従う。」
```

**4. テストと一緒に書かせる**

```
「src/lib/utils/calculations.ts に以下の関数を作成:
 - calculateIncomeTax(income: number, deductions: Deduction[]): TaxResult
 - calculateResidentTax(income: number, deductions: Deduction[]): TaxResult
 型定義は src/types/finance.ts に追加。
 同時に tests/unit/calculations.test.ts にテストを作成。
 テストケース: 年収300万/500万/800万/1200万/2000万。
 配偶者控除あり/なし。住宅ローン控除あり/なし。
 期待値は国税庁の速算表と照合可能にすること。」
```

**5. レビューを依頼する**

```
「src/app/(dashboard)/diagnosis/ 配下のコードをレビューして。
 チェック観点:
 1. Server Component と Client Component の分離は適切か
 2. 型安全性（any がないか、Zod バリデーションがあるか）
 3. エラーハンドリング漏れ
 4. アクセシビリティ（ARIA属性、キーボード操作）
 5. パフォーマンス（不要な re-render、N+1クエリ）
 問題があれば修正コードも提示して。」
```

---

## 8. データベース設計

### ER図の概要

```
users
  ├── user_profiles (1:1)
  ├── income_sources (1:N)
  ├── expense_records (1:N)
  ├── assets (1:N)
  ├── liabilities (1:N)
  ├── life_events (1:N)         — シミュレーション用
  ├── tax_records (1:N)         — 年次の税務記録
  ├── service_subscriptions (1:N) — 現在の契約サービス
  ├── agent_tasks (1:N)         — エージェント実行タスク
  ├── notifications (1:N)
  └── learning_progress (1:N)

financial_services               — マスターデータ（全ユーザー共通）
  ├── service_features (1:N)
  └── service_reviews (1:N)

subsidies                        — 補助金マスターデータ
  └── subsidy_conditions (1:N)

tax_rules                        — 税制マスターデータ（年度別）
```

### 主要テーブル（Drizzle スキーマ抜粋）

```typescript
// src/lib/db/schema.ts

export const userProfiles = pgTable('user_profiles', {
  id:             uuid('id').primaryKey().defaultRandom(),
  userId:         uuid('user_id').references(() => users.id).notNull().unique(),
  birthDate:      date('birth_date').notNull(),
  gender:         text('gender'),           // 'male' | 'female' | 'other' | null
  prefecture:     text('prefecture').notNull(),
  city:           text('city'),
  maritalStatus:  text('marital_status').notNull(), // 'single' | 'married'
  dependents:     integer('dependents').default(0),
  childrenAges:   jsonb('children_ages').$type<number[]>(),
  occupation:     text('occupation').notNull(),
  tier:           text('tier').notNull(),    // 'basic' | 'middle' | 'high_end'
  annualIncome:   integer('annual_income').notNull(),
  financialGoals: jsonb('financial_goals').$type<string[]>(),
  riskTolerance:  text('risk_tolerance'),   // 'conservative'|'moderate'|'aggressive'
  createdAt:      timestamp('created_at').defaultNow(),
  updatedAt:      timestamp('updated_at').defaultNow(),
});

export const assets = pgTable('assets', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').references(() => users.id).notNull(),
  category:     text('category').notNull(),
  // 'cash' | 'stocks' | 'bonds' | 'mutual_funds'
  // | 'real_estate' | 'crypto' | 'insurance' | 'other'
  name:         text('name'),
  amount:       bigint('amount', { mode: 'number' }).notNull(),
  currency:     text('currency').default('JPY'),
  institution:  text('institution'),        // 金融機関名
  interestRate: numeric('interest_rate'),    // 利回り
  maturityDate: date('maturity_date'),       // 満期日
  isLiquid:     boolean('is_liquid').default(true),
  lastUpdated:  timestamp('last_updated').defaultNow(),
  createdAt:    timestamp('created_at').defaultNow(),
});

export const agentTasks = pgTable('agent_tasks', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').references(() => users.id).notNull(),
  type:         text('type').notNull(),
  // 'service_switch' | 'subscription_audit'
  // | 'tax_optimization' | 'subsidy_application'
  status:       text('status').notNull().default('proposed'),
  // 'proposed' | 'approved' | 'executing' | 'completed' | 'failed' | 'cancelled'
  title:        text('title').notNull(),
  description:  text('description'),
  proposedAction: jsonb('proposed_action'),
  estimatedSaving: integer('estimated_saving'),
  actualSaving:    integer('actual_saving'),
  metadata:     jsonb('metadata'),
  approvedAt:   timestamp('approved_at'),
  completedAt:  timestamp('completed_at'),
  createdAt:    timestamp('created_at').defaultNow(),
});
```

### RLS（Row Level Security）ポリシー

```sql
-- すべてのユーザーテーブルに適用
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_profile" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);

-- マスターデータは全員読み取り可
CREATE POLICY "read_financial_services" ON financial_services
  FOR SELECT USING (true);

CREATE POLICY "read_subsidies" ON subsidies
  FOR SELECT USING (true);
```

---

## 9. AI エージェント設計

### アーキテクチャ

```
ユーザー入力
    ↓
[プロファイルコンテキスト注入]
    ↓ (年収・ティア・資産・目標)
[Claude API — Tool Use]
    ├── search_subsidies     補助金検索
    ├── calculate_tax        税額計算
    ├── compare_services     サービス比較
    ├── simulate_plan        ライフプラン試算
    ├── audit_subscriptions  サブスク監査
    └── get_market_data      市場データ取得
    ↓
[レスポンス生成]
    ↓
[アクション提案（承認要求）]
    ↓
[ユーザー承認]
    ↓
[アクション実行]
```

### プロンプト設計の原則

```typescript
// src/lib/ai/prompts/agent.ts
export const SYSTEM_PROMPT = `
あなたは「Kanejo」のパーソナル金融アドバイザーです。

## 人格
- 穏やかで信頼感のある口調
- 断定を避け、「〜の可能性があります」「検討の余地があります」を使う
- 専門用語には必ず平易な説明を添える
- ユーザーの不安を煽らない

## 制約
- 投資の具体的な銘柄推奨はしない
- 「必ず儲かる」等の断定的表現は禁止
- 税務・法律の最終判断は専門家への相談を推奨する
- 免責事項: このアドバイスは一般的な情報提供であり、
  個別の税務・法律・投資アドバイスではありません

## コンテキスト
ユーザープロファイル:
- ティア: {tier}
- 年収: {annual_income}
- 年齢: {age}
- 家族構成: {family}
- 金融目標: {goals}
- リスク許容度: {risk_tolerance}
`;
```

### ティア別のエージェント動作

| 機能 | ベーシック | ミドル | ハイエンド |
|------|-----------|--------|----------|
| 家計診断 | 基本指標 + 改善提案 | 詳細分析 + ベンチマーク比較 | 資産全体最適化 |
| 節税 | 基礎控除・給付金 | ふるさと納税/iDeCo/医療費 | 法人設立・相続・海外資産 |
| サービス比較 | クレカ・通信・電力 | + 保険・住宅ローン | + PB・ヘッジファンド |
| エージェント | 固定費削減提案 | + 契約切替実行 | + カスタム戦略立案 |
| 学習コンテンツ | 家計管理の基礎 | 投資・節税の中級 | 資産運用の上級 |

---

## 10. セキュリティ・コンプライアンス

### 必須対応事項

| 項目 | 対応方針 |
|------|----------|
| 個人情報保護法 | プライバシーポリシー明示。データ最小化原則。利用目的の同意取得 |
| 金融商品取引法 | 投資助言業に該当しないよう免責表示を徹底。具体的銘柄推奨の禁止 |
| 資金決済法 | エージェントが直接決済を行う場合の規制確認 |
| 暗号化 | 金融データは AES-256 で暗号化保存。通信は TLS 1.3 |
| 認証 | MFA 対応。セッション管理。パスワードポリシー |
| 監査ログ | エージェントの全アクションをログ記録。7年保存 |
| CSRF | Server Actions + Origin ヘッダー検証 |
| Rate Limiting | Upstash Redis で API レート制限。ティア別上限 |

### 免責表示テンプレート

```
本サービスが提供する情報は、一般的な金融知識の提供を目的としたものであり、
特定の金融商品の勧誘や、個別の投資・税務・法律に関する助言を行うものでは
ありません。金融商品の購入や税務申告等の最終的なご判断は、ご自身の責任に
おいて、必要に応じて専門家にご相談の上、行ってください。
```

---

## 付録: よく使う Claude Code コマンド

```bash
# 開発サーバー起動
npm run dev

# 型チェック
npx tsc --noEmit

# Lint + Format
npx biome check --write .

# テスト実行
npx vitest run

# E2Eテスト
npx playwright test

# Storybook
npm run storybook

# DBマイグレーション
npx drizzle-kit push

# Supabase 型生成
npx supabase gen types typescript --local > src/types/database.ts
```

---

*このドキュメントは開発の進行に合わせて継続的に更新すること。*
*CLAUDE.md は Claude Code の生成品質に直結するため、常に最新に保つ。*
