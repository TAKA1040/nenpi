import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import FuelCalculator, { FuelRecord } from './FuelCalculator'
import Charts from './Charts'
import { StatisticsData, calculateStatistics, formatCurrency, formatFuelEfficiency, formatPrice, getEfficiencyGrade } from '../utils/statistics'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { LogOut, BarChart3, TrendingUp, TrendingDown, AlertCircle, Target, Award, DollarSign, Gauge, Edit, Trash2 } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'

const Dashboard = ({ session }: { session: Session }) => {
  const [records, setRecords] = useState<FuelRecord[]>([])
  const [statistics, setStatistics] = useState<StatisticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fuelEfficiencyGoal, setFuelEfficiencyGoal] = useState(15)
  const [monthlyBudget, setMonthlyBudget] = useState(20000)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('fuel_records')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: true })

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
    await supabase.auth.signOut()
  }

  const monthlyGroupedRecords = useMemo(() => {
    if (!statistics) return []
    return statistics.monthlyStats.map(monthStats => ({
      ...monthStats,
      records: records
        .filter(r => r.date.startsWith(monthStats.month))
        .map((record, index, arr) => {
            const prev = records.find(r => r.date < record.date)
            const distance = prev ? record.mileage - prev.mileage : 0
            const efficiency = distance > 0 ? distance / record.amount : null
            return {...record, fuelEfficiency: efficiency, pricePerLiter: record.cost / record.amount}
        })
        .sort((a, b) => b.date.localeCompare(a.date))
    })).sort((a,b) => b.month.localeCompare(a.month))
  }, [statistics, records])

  const alerts = useMemo(() => {
    const alerts = []
    if (!statistics) return []
    if (statistics.averageFuelEfficiency < fuelEfficiencyGoal) {
      alerts.push(`燃費が目標を${(fuelEfficiencyGoal - statistics.averageFuelEfficiency).toFixed(1)}km/L下回っています`)
    }
    if (statistics.averageCostPerMonth > monthlyBudget) {
      alerts.push(`月間コストが予算を${formatCurrency(statistics.averageCostPerMonth - monthlyBudget)}超過しています`)
    }
    if (statistics.trends && !statistics.trends.isImprovingEfficiency) {
      alerts.push('最近の燃費が悪化傾向にあります')
    }
    return alerts
  }, [statistics, fuelEfficiencyGoal, monthlyBudget])

  if (loading) {
    return <div className="p-8">データを読み込んでいます...</div>
  }

  if (!statistics || records.length === 0) {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">ようこそ, {session.user.email}</h1>
            <FuelCalculator user={session.user} records={records} onRecordsUpdate={fetchRecords} />
        </div>
    )
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">燃費ダッシュボード</h1>
          <p className="text-sm text-gray-500">ログイン中: {session.user.email}</p>
        </div>
        <Button onClick={handleSignOut} variant="destructive">
          <LogOut className="w-4 h-4 mr-2" />
          ログアウト
        </Button>
      </header>

      <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">ダッシュボード</TabsTrigger>
          <TabsTrigger value="data">データ管理</TabsTrigger>
          <TabsTrigger value="charts">グラフ分析</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border rounded-lg p-4"><Gauge className="w-6 h-6 text-blue-600 mb-2" /> <p>燃費スコア</p><p className="text-2xl font-bold">{getEfficiencyGrade(statistics.averageFuelEfficiency)}</p><p>{formatFuelEfficiency(statistics.averageFuelEfficiency)}</p></div>
                <div className="bg-white border rounded-lg p-4"><DollarSign className="w-6 h-6 text-green-600 mb-2" /><p>月平均コスト</p><p className="text-2xl font-bold">{formatCurrency(statistics.averageCostPerMonth)}</p><p>予算達成度: {((monthlyBudget / statistics.averageCostPerMonth) * 100).toFixed(0)}%</p></div>
                <div className="bg-white border rounded-lg p-4"><BarChart3 className="w-6 h-6 text-yellow-600 mb-2" /><p>価格動向</p><p className="text-2xl font-bold flex items-center">{statistics.trends.isPriceIncreasing ? <TrendingUp className="text-red-500"/> : <TrendingDown className="text-green-500"/>} {statistics.trends.isPriceIncreasing ? '上昇' : '安定'}</p><p>平均: {formatPrice(statistics.averagePrice)}</p></div>
                <div className="bg-white border rounded-lg p-4"><Award className="w-6 h-6 text-purple-600 mb-2" /><p>総合評価</p><p className="text-2xl font-bold">{alerts.length === 0 ? 'A' : alerts.length <= 2 ? 'B' : 'C'}</p><p>{alerts.length === 0 ? '良好' : '要注意'}</p></div>
            </div>
            {/* Alerts */}
            {alerts.length > 0 && <div className="bg-white border rounded-lg p-4 mb-6"><h3 className="font-bold mb-2 flex items-center"><AlertCircle className="mr-2 text-orange-500"/>注意事項</h3><ul className="list-disc pl-5">{alerts.map((a,i) => <li key={i}>{a}</li>)}</ul></div>}
        </TabsContent>

        <TabsContent value="data" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <FuelCalculator user={session.user} records={records} onRecordsUpdate={fetchRecords} />
                </div>
                <div className="lg:col-span-2 bg-white p-4 rounded-lg border">
                    <h3 className="font-bold text-lg mb-4">記録一覧</h3>
                    <div className="space-y-6">
                        {monthlyGroupedRecords.map(month => (
                            <div key={month.month}>
                                <h4 className="font-bold text-gray-700 bg-gray-100 p-2 rounded">{month.displayMonth}</h4>
                                <table className="w-full text-sm mt-2">
                                    <thead><tr className="border-b"><th className="text-left p-2">日付</th><th className="text-left p-2">スタンド</th><th className="text-right p-2">燃費</th><th className="text-right p-2">金額</th></tr></thead>
                                    <tbody>
                                        {month.records.map(r => (
                                            <tr key={r.id} className="border-b hover:bg-gray-50">
                                                <td className="p-2">{r.date}</td><td className="p-2">{r.station}</td><td className="text-right p-2">{r.fuelEfficiency ? formatFuelEfficiency(r.fuelEfficiency) : '-'}</td><td className="text-right p-2">{formatCurrency(r.cost)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </TabsContent>

        <TabsContent value="charts" className="mt-6">
          <Charts records={records} statistics={statistics} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Dashboard
