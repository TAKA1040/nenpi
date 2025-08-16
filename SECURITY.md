# セキュリティ対策

## 🔒 実装済みセキュリティ対策

### 1. 環境変数の保護
- `.env` ファイルは `.gitignore` で除外
- 本番環境ではVercelの暗号化された環境変数を使用
- フォールバック機能で `VITE_` および `NEXT_PUBLIC_` プレフィックスに対応

### 2. データベースセキュリティ
- Supabase Row Level Security (RLS) 有効化
- 現在は開発用の匿名アクセス許可（本番では要変更）

### 3. 情報漏洩防止
- API キーやシークレットはソースコードに含めない
- 開発用とプロダクション用の設定分離
- デバッグ情報の本番環境での無効化

## ⚠️ 本番環境での必須変更事項

### 1. データベースアクセス制限
現在のポリシーを以下に変更：

```sql
-- 開発用ポリシーを削除
DROP POLICY "allow anon read" ON public.fuel_records;
DROP POLICY "allow anon insert" ON public.fuel_records;
DROP POLICY "allow anon delete" ON public.fuel_records;

-- 認証済みユーザー用ポリシーを追加
CREATE POLICY "Users can view own records" ON public.fuel_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records" ON public.fuel_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records" ON public.fuel_records
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own records" ON public.fuel_records
    FOR DELETE USING (auth.uid() = user_id);

-- user_id カラムを追加
ALTER TABLE public.fuel_records ADD COLUMN user_id uuid REFERENCES auth.users(id);
```

### 2. 認証システムの実装
- Supabase Auth の導入
- ログイン・ログアウト機能
- ユーザー別データ分離

### 3. CSP（Content Security Policy）の設定
- XSS攻撃の防止
- リソース読み込み制限

## 🚨 緊急時対応

### データ漏洩が疑われる場合
1. 即座にSupabaseダッシュボードでRLSポリシーを確認
2. 不審なアクセスログをチェック
3. 必要に応じてAPIキーをローテーション

### 対応手順
1. Supabaseプロジェクト設定 → API → Reset keys
2. Vercel環境変数の更新
3. アプリケーションの再デプロイ

## 📋 定期メンテナンス

- [ ] 月次でのアクセスログ確認
- [ ] 依存関係の脆弱性チェック (`npm audit`)
- [ ] RLSポリシーの動作確認
- [ ] バックアップの実行確認