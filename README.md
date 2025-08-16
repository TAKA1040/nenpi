# 🚗 燃費計算アプリ (Vite + React + TS + Tailwind + Supabase + Recharts)

高機能な燃費管理・分析プラットフォーム。給油記録の管理からデータ分析、グラフ表示まで包括的にサポートします。

## 🌐 ライブデモ
**https://nenpi.apaf.me**

## ✨ 主要機能

### 📊 データ管理
- 給油記録の入力・編集・削除
- 高度な入力検証（異常値検出、走行距離整合性チェック）
- 検索・フィルタリング（日付範囲、スタンド別）
- データエクスポート（CSV、JSON、月次レポート）
- データインポート（CSV/JSON一括登録）

### 🎯 ダッシュボード
- 燃費スコア（A+〜Dグレード評価）
- コスト効率の可視化
- 価格トレンド分析（上昇・下降傾向）
- 目標設定・達成度追跡
- 改善提案の自動生成

### 📈 グラフ分析
- 燃費推移チャート
- 月別コスト・燃費比較
- 価格推移ライン
- スタンド別利用統計（円グラフ）
- 月別詳細データ（棒グラフ）

## 🛠️ 技術スタック

### フロントエンド
- **React 18** - UIライブラリ
- **TypeScript** - 型安全な開発
- **Vite** - 高速ビルドツール
- **Tailwind CSS** - ユーティリティファーストCSS
- **Recharts** - データ可視化ライブラリ
- **Lucide React** - アイコンライブラリ

### バックエンド・インフラ
- **Supabase** - データベース・認証
- **Vercel** - ホスティング・デプロイ
- **PostgreSQL** - リレーショナルデータベース

### 開発ツール
- **ESLint** - コード品質
- **PostCSS** - CSS処理
- **Git** - バージョン管理

## 📁 プロジェクト構成
```
src/
├── components/
│   ├── FuelCalculator.tsx    # メインコンポーネント
│   ├── Charts.tsx            # グラフ・チャート
│   └── Dashboard.tsx         # ダッシュボード
├── utils/
│   ├── validation.ts         # 入力検証
│   ├── statistics.ts         # 統計計算
│   ├── export.ts            # データエクスポート
│   └── import.ts            # データインポート
├── lib/
│   └── supabase.ts          # Supabase設定
└── vite-env.d.ts           # 型定義
```

## 構成
- `index.html`: ルート HTML
- `vite.config.ts`: Vite 設定（`@` -> `src/` エイリアス）
- `tsconfig.json`: TypeScript 設定
- `tailwind.config.cjs`, `postcss.config.cjs`, `src/index.css`: Tailwind 設定
- `src/main.tsx`, `src/App.tsx`: エントリポイント
- `src/components/FuelCalculator.tsx`: Supabase 連携済みの燃費計算 UI
- `src/lib/supabase.ts`: Supabase クライアント初期化
- `.env.example`: 必要な環境変数テンプレート
- `supabase_schema.sql`: Supabase 側テーブルとポリシー

## セットアップ
1. 依存をインストール
```powershell
npm install
```

2. 環境変数を設定
```powershell
Copy-Item .env.example .env
# .env を開いて VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY を設定
```

3. Supabase テーブル作成（ダッシュボードの SQL Editor で `supabase_schema.sql` を実行）
   - 開発用に anon でも読書きできるポリシーを付けています。運用では必ず認証ベースに変更してください。

4. 起動
```powershell
npm run dev
```

## 注意
- Tailwind が効かない場合は、`src/index.css` の読み込みと content パスを確認。
- 型エラーは依存未インストールが原因です。`npm install` を実施してください。
- Vite の環境変数は `VITE_` プレフィックスが必須です。