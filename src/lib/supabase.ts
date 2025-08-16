import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL) as string
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string

if (!supabaseUrl || !supabaseAnonKey) {
  // 本番環境では詳細なエラー情報を隠す
  const isDevelopment = import.meta.env.DEV
  if (isDevelopment) {
    console.warn('[Supabase] Supabase環境変数が設定されていません。VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY または NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。')
  } else {
    console.error('[Supabase] Configuration error')
  }
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
