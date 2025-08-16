# 🚗 燃費計算アプリ (Vite + React + TS + Tailwind + Supabase + Recharts)

高機能な燃費管理・分析プラットフォーム。給油記録の管理からデータ分析、グラフ表示まで包括的にサポートします。\n\n## 🌐 ライブデモ\n**https://nenpi-pa01oja7r-takas-projects-ebc9ff02.vercel.app**\n\n## ✨ 主要機能\n\n### 📊 データ管理\n- 給油記録の入力・編集・削除\n- 高度な入力検証（異常値検出、走行距離整合性チェック）\n- 検索・フィルタリング（日付範囲、スタンド別）\n- データエクスポート（CSV、JSON、月次レポート）\n- データインポート（CSV/JSON一括登録）\n\n### 🎯 ダッシュボード\n- 燃費スコア（A+〜Dグレード評価）\n- コスト効率の可視化\n- 価格トレンド分析（上昇・下降傾向）\n- 目標設定・達成度追跡\n- 改善提案の自動生成\n\n### 📈 グラフ分析\n- 燃費推移チャート\n- 月別コスト・燃費比較\n- 価格推移ライン\n- スタンド別利用統計（円グラフ）\n- 月別詳細データ（棒グラフ）

## 🛠️ 技術スタック\n\n### フロントエンド\n- **React 18** - UIライブラリ\n- **TypeScript** - 型安全な開発\n- **Vite** - 高速ビルドツール\n- **Tailwind CSS** - ユーティリティファーストCSS\n- **Recharts** - データ可視化ライブラリ\n- **Lucide React** - アイコンライブラリ\n\n### バックエンド・インフラ\n- **Supabase** - データベース・認証\n- **Vercel** - ホスティング・デプロイ\n- **PostgreSQL** - リレーショナルデータベース\n\n### 開発ツール\n- **ESLint** - コード品質\n- **PostCSS** - CSS処理\n- **Git** - バージョン管理\n\n## 📁 プロジェクト構成\n```\nsrc/\n├── components/\n│   ├── FuelCalculator.tsx    # メインコンポーネント\n│   ├── Charts.tsx            # グラフ・チャート\n│   └── Dashboard.tsx         # ダッシュボード\n├── utils/\n│   ├── validation.ts         # 入力検証\n│   ├── statistics.ts         # 統計計算\n│   ├── export.ts            # データエクスポート\n│   └── import.ts            # データインポート\n├── lib/\n│   └── supabase.ts          # Supabase設定\n└── vite-env.d.ts           # 型定義\n```\n\n## 構成
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
