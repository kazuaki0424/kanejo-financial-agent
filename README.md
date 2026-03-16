# Kanejo — パーソナル金融エージェント

> すべての人に、自分だけのCFOを。

AI駆動のパーソナル金融エージェントサービス。家計診断・ライフプランシミュレーション・節税最適化・金融サービス比較を一つのプラットフォームで提供します。

## セットアップ

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.local.example .env.local
# .env.local を編集して以下を設定:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   DATABASE_URL
#   ANTHROPIC_API_KEY

# DBマイグレーション
npx drizzle-kit push

# シードデータ投入
npx tsx scripts/seed-subsidies.ts
npx tsx scripts/seed-services.ts
npx tsx scripts/update-tax-rates.ts

# 開発サーバー起動
npm run dev
```

## コマンド

| コマンド | 用途 |
|---------|------|
| `npm run dev` | 開発サーバー (localhost:3000) |
| `npm run build` | 本番ビルド |
| `npm run test` | ユニットテスト |
| `npm run test:watch` | テスト（ウォッチモード） |
| `npm run typecheck` | TypeScript型チェック |
| `npm run lint` | ESLint |
| `npm run check` | Biome チェック |
| `npm run storybook` | Storybook (localhost:6006) |

## アーキテクチャ

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # 認証ページ (login, register)
│   ├── (dashboard)/        # メインアプリ (認証必須)
│   │   ├── page.tsx        # ダッシュボード
│   │   ├── diagnosis/      # 家計診断
│   │   ├── simulation/     # ライフプランシミュレーション
│   │   ├── tax/            # 節税・補助金
│   │   ├── compare/        # サービス比較
│   │   ├── agent/          # AIエージェント
│   │   ├── learn/          # 金融リテラシー
│   │   ├── alerts/         # アラート・通知
│   │   └── settings/       # 設定
│   ├── (marketing)/        # ランディングページ
│   ├── api/                # APIルート
│   └── onboarding/         # オンボーディング
├── components/             # 共有コンポーネント
│   ├── ui/                 # プリミティブ (Radix UI)
│   ├── charts/             # チャート (Recharts)
│   ├── layout/             # レイアウト
│   └── shared/             # 共有ユーティリティ
├── lib/                    # ビジネスロジック
│   ├── ai/                 # AI (Claude API, ツール)
│   ├── constants/          # 定数データ
│   ├── db/                 # Drizzle ORM
│   ├── supabase/           # Supabase クライアント
│   ├── utils/              # 計算エンジン群
│   └── validations/        # Zod スキーマ
├── hooks/                  # カスタムフック
└── types/                  # 型定義
```

## 主要機能

### 家計診断
- 5指標の家計スコア (ティア別ウェイト)
- 月次収支チャート (12ヶ月, 季節変動)
- 支出カテゴリ分析 (ドーナツチャート)
- 資産ポートフォリオ可視化

### シミュレーション
- 最大50年のキャッシュフロー予測
- 7種のライフイベントテンプレート
- 3シナリオ並列比較
- パラメータ感度分析 (±1%)

### 節税
- 所得税・住民税計算 (7段階累進課税)
- ふるさと納税上限計算 + 返礼品シミュレーション
- iDeCo/NISA複利シミュレーション
- 補助金マッチング (12補助金)
- 確定申告ガイド + 年末調整ウィザード

### AIエージェント
- Claude API Tool Use (7ツール)
- 3段階承認フロー (提案→詳細→承認)
- タスク進捗管理

## API

| エンドポイント | メソッド | 用途 |
|---------------|---------|------|
| `/api/auth/callback` | GET | OAuth/メール確認 |
| `/api/diagnosis` | POST | 家計診断AI (SSE) |
| `/api/simulation` | POST | シミュレーション分析AI (SSE) |
| `/api/tax-advice` | POST | 税務アドバイスAI (SSE) |
| `/api/agent/chat` | POST | エージェントチャット (SSE + Tool Use) |
| `/api/cron/subsidies` | GET | 補助金データ鮮度チェック |

## テスト

```bash
npm run test        # 474テスト, 26ファイル
npm run typecheck   # TypeScript 型チェック
```

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router, Turbopack)
- **言語**: TypeScript 5 (strict)
- **スタイリング**: Tailwind CSS 4
- **UI**: Radix UI (ヘッドレス)
- **アニメーション**: Framer Motion 12
- **チャート**: Recharts 3
- **DB**: Supabase PostgreSQL + Drizzle ORM
- **AI**: Anthropic Claude API (Tool Use)
- **テスト**: Vitest 4
