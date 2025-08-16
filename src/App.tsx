import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import AuthComponent from './components/Auth'
import Dashboard from './components/Dashboard'
import type { Session } from '@supabase/supabase-js'

function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    // ログイン状態の変化を監視
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    // コンポーネントがアンマウントされるときに監視を解除
    return () => {
      authListener.subscription?.unsubscribe()
    }
  }, [])

  // 初回レンダリング時に現在のセッションを取得
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {!session ? (
        <AuthComponent />
      ) : (
        <Dashboard key={session.user.id} session={session} />
      )}
    </div>
  )
}

export default App