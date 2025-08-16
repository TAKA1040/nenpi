import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import FuelCalculator from './FuelCalculator'
import Charts from './Charts'
import { StatisticsData, calculateStatistics } from '../utils/statistics'
import { FuelRecord } from './FuelCalculator'
import type { Session } from '@supabase/supabase-js'
import { LogOut } from 'lucide-react'

interface DashboardProps {
  session: Session
}

const Dashboard = ({ session }: DashboardProps) => {
  const [records, setRecords] = useState<FuelRecord[]>([])
  const [statistics, setStatistics] = useState<StatisticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('fuel_records')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching records:', error)
    } else {
      const typedRecords = data as FuelRecord[]
      setRecords(typedRecords)
      setStatistics(calculateStatistics(typedRecords))
    }
    setLoading(false)
  }, [session.user.id])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">ログイン中</p>
          <h1 className="text-xl font-semibold text-gray-800">{session.user.email}</h1>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          ログアウト
        </button>
      </header>

      {loading ? (
        <p>データを読み込んでいます...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <FuelCalculator 
              user={session.user} 
              records={records} 
              onRecordsUpdate={fetchRecords} // Pass the refetch function directly
            />
          </div>
          <div className="lg:col-span-2">
            {statistics && records.length > 0 ? (
              <Charts records={records} statistics={statistics} />
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <h3 className="text-lg font-semibold">データがありません</h3>
                <p className="text-gray-500 mt-2">最初の燃費記録を追加してください。</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard