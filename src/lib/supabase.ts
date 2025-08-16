import { createClient } from '@supabase/supabase-js'

// 環境変数を取得（複数の方法を試行）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                   import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
                   (globalThis as any).process?.env?.NEXT_PUBLIC_SUPABASE_URL

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                       import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                       (globalThis as any).process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY

// デバッグ情報（本番では条件付きで出力）
const isDevelopment = import.meta.env.DEV
if (isDevelopment || !supabaseUrl) {
  console.log('[Supabase Debug]', {
    VITE_URL: import.meta.env.VITE_SUPABASE_URL ? '✓' : '✗',
    NEXT_PUBLIC_URL: import.meta.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗',
    VITE_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓' : '✗',
    NEXT_PUBLIC_KEY: import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓' : '✗',
    finalUrl: supabaseUrl ? 'configured' : 'missing',
    finalKey: supabaseAnonKey ? 'configured' : 'missing'
  })
}

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = isDevelopment 
    ? '[Supabase] 環境変数が設定されていません。VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY または NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。'
    : '[Supabase] Configuration error'
  
  console.error(errorMsg)
  throw new Error('Supabase configuration is missing')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
