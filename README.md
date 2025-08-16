# 燃費計算アプリ (Vite + React + TS + Tailwind + Supabase)

このリポジトリは、`fuel_calculator.tsx` のアーティファクトを実行可能なアプリ構成に再構築し、Supabase と連携できるようにした最小実装です。

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
