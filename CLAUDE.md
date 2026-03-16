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
3. **マイクロインタラクション** — 数値変化のアニメーション、ホバー遷移
4. **和のミニマリズム** — 要素を削ぎ落とす。余白が語る
5. **データ密度** — 一画面で十分な情報量。ただし視覚的ノイズはゼロ

### カラーパレット
- Primary: `#2d5a27` (深緑 — 成長・安定)
- Positive: `#1a7a3a` (収入・プラス表現)
- Negative: `#c4321c` (支出・マイナス表現)
- Surface: `#ffffff` (カード), `#f7f7f5` (ページ背景)
- Ink: `#1a1a1a` (本文), `#6b6b6b` (サブテキスト)
- チャート色は `--chart-1` 〜 `--chart-6` を使用

### タイポグラフィ
- 見出し・大きな数値: Instrument Serif
- 本文: Noto Sans JP
- コード: JetBrains Mono
- 金額: `font-variant-numeric: tabular-nums` で桁揃え

### AIインサイトの表示方法
- チャットバブルにしない。カードの一部として自然に統合する
- アイコン: 葉のモチーフ（スパークル・電球・ロボットは使わない）
- 背景: `var(--color-primary-light)` + 左ボーダー `3px solid var(--color-primary)`
- トーン: 「〜かもしれません」「検討の余地があります」（断定を避ける）

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
- 免責表示を全AIレスポンスに付与

### テスト
- 金融計算ロジックは 100% カバレッジ
- Server Actions は integration test で検証
- 重要なユーザーフローは E2E テスト

### Git コミットメッセージ
- Conventional Commits: `feat(diagnosis): add household score`
- 日本語は commit body に記載可

### 禁止事項
- `any` 型
- `console.log` (logger を使う)
- インラインスタイル（Tailwind を使う）
- `!important`
- ハードコードされた色コード
- barrel export (index.ts)
- relative import で 3階層以上遡る（`@/` を使う）
- shadcn/ui（Radix UI を直接使い、自前デザインシステムを構築する）
