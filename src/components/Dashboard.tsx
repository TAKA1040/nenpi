import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import FuelCalculator, { FuelRecord } from './FuelCalculator'
import Charts from './Charts'
import { 
  StatisticsData, 
  calculateStatistics, 
  formatCurrency, 
  formatFuelEfficiency, 
  formatPrice, 
  getEfficiencyGrade 
} from '../utils/statistics'
import { Button } from '@/components/ui/button'
import { LogOut, BarChart3, TrendingUp, TrendingDown, AlertCircle, Target, Award, DollarSign, Gauge, Edit, Trash2, Car } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'

// --- Helper Components for Empty States ---
const SummaryCardPlaceholder = ({ title, icon }: { title: string, icon: React.ReactNode }) => (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6 animate-pulse">
        {icon} <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-400">-</p>
        <p className="text-sm text-gray-400">データがありません</p>
    </div>
)

const Dashboard = ({ session }: { session: Session }) => {
  const [records, setRecords] = useState<FuelRecord[]>([])
  const [statistics, setStatistics] = useState<StatisticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingRecord, setEditingRecord] = useState<FuelRecord | null>(null)

  const fuelEfficiencyGoal = 15
  const monthlyBudget = 20000

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('fuel_records').select('*').eq('user_id', session.user.id).order('date', { ascending: true })
    if (error) console.error('Error fetching records:', error)
    else {
      const typedRecords = data as FuelRecord[]
      setRecords(typedRecords)
      setStatistics(calculateStatistics(typedRecords))
    }
    setLoading(false)
  }, [session.user.id])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('この記録を本当に削除しますか？')) {
        await supabase.from('fuel_records').delete().eq('id', id)
        fetchRecords()
    }
  }

  const handleSignOut = async () => { await supabase.auth.signOut() }

  const monthlyGroupedRecords = useMemo(() => {
    if (!statistics || !statistics.monthlyStats) return []
    const sortedRecordsWithData = records.map((record, index) => {
        const prev = index > 0 ? records[index - 1] : null
        const distance = prev ? record.mileage - prev.mileage : 0
        const efficiency = distance > 0 ? distance / record.amount : null
        return {...record, fuelEfficiency: efficiency, pricePerLiter: record.cost / record.amount}
    }).sort((a, b) => b.date.localeCompare(a.date))
    return statistics.monthlyStats.map(monthStats => ({
      ...monthStats,
      records: sortedRecordsWithData.filter(r => r.date.startsWith(monthStats.month))
    })).sort((a,b) => b.month.localeCompare(a.month))
  }, [statistics, records])

  const alerts = useMemo(() => {
    const alerts = []
    if (!statistics || statistics.totalRecords === 0) return []
    if (statistics.averageFuelEfficiency < fuelEfficiencyGoal) alerts.push(`燃費が目標を${(fuelEfficiencyGoal - statistics.averageFuelEfficiency).toFixed(1)}km/L下回っています`)
    if (statistics.averageCostPerMonth > monthlyBudget) alerts.push(`月間コストが予算を${formatCurrency(statistics.averageCostPerMonth - monthlyBudget)}超過しています`)
    if (statistics.trends && !statistics.trends.isImprovingEfficiency && statistics.trends.efficiencyChange !== 0) alerts.push('最近の燃費が悪化傾向にあります')
    return alerts
  }, [statistics, fuelEfficiencyGoal, monthlyBudget])

  if (loading) {
    return <div className="p-8 text-center">データを読み込んでいます...</div>
  }

  const hasData = statistics && statistics.totalRecords > 0

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">燃費ダッシュボード</h1>
          <p className="text-sm text-gray-500">ログイン中: {session.user.email}</p>
        </div>
        <Button onClick={handleSignOut} variant="outline"><LogOut className="w-4 h-4 mr-2" />ログアウト</Button>
      </header>

      <main className="space-y-8">
        {/* --- Summary Section --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {hasData ? (
                <>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6"><Gauge className="w-8 h-8 text-blue-600 mb-2" /> <p className="text-sm font-medium text-blue-800">燃費スコア</p><p className="text-2xl font-bold text-blue-900">{getEfficiencyGrade(statistics.averageFuelEfficiency)}</p><p className="text-sm text-blue-600">{formatFuelEfficiency(statistics.averageFuelEfficiency)}</p></div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6"><DollarSign className="w-8 h-8 text-green-600 mb-2" /><p className="text-sm font-medium text-green-800">月平均コスト</p><p className="text-2xl font-bold text-green-900">{formatCurrency(statistics.averageCostPerMonth)}</p><p className="text-sm text-green-600">予算達成度: {statistics.averageCostPerMonth > 0 ? ((monthlyBudget / statistics.averageCostPerMonth) * 100).toFixed(0) : '-'}%</p></div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6"><BarChart3 className="w-8 h-8 text-yellow-600 mb-2" /><p className="text-sm font-medium text-yellow-800">価格動向</p><p className="text-2xl font-bold text-yellow-900 flex items-center">{statistics.trends.isPriceIncreasing ? <TrendingUp className="text-red-500"/> : <TrendingDown className="text-green-500"/>} {statistics.trends.isPriceIncreasing ? '上昇' : '安定'}</p><p className="text-sm text-yellow-600">平均: {formatPrice(statistics.averagePrice)}</p></div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6"><Target className="w-8 h-8 text-orange-600 mb-2" /><p className="text-sm font-medium text-orange-800">リッター単価</p><p className="text-2xl font-bold text-orange-900">{formatPrice(statistics.averagePrice)}</p><p className="text-sm text-orange-600">L当たりの平均価格</p></div>
                </>
            ) : (
                <>
                    <SummaryCardPlaceholder title="燃費スコア" icon={<Gauge className="w-8 h-8 text-gray-400 mb-2" />} />
                    <SummaryCardPlaceholder title="月平均コスト" icon={<DollarSign className="w-8 h-8 text-gray-400 mb-2" />} />
                    <SummaryCardPlaceholder title="価格動向" icon={<BarChart3 className="w-8 h-8 text-gray-400 mb-2" />} />
                    <SummaryCardPlaceholder title="リッター単価" icon={<Target className="w-8 h-8 text-gray-400 mb-2" />} />
                </>
            )}
        </div>

        {/* --- Data Management Section --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <FuelCalculator user={session.user} records={records} onRecordsUpdate={fetchRecords} editingRecord={editingRecord} setEditingRecord={setEditingRecord} />
            </div>
            <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-lg">
                <h3 className="font-bold text-lg mb-4">記録一覧</h3>
                {hasData ? (
                    <div className="space-y-6">
                        {monthlyGroupedRecords.map(month => (
                            <div key={month.month}>
                                <h4 className="font-semibold text-gray-800 bg-gray-100 p-3 rounded-t-lg">{month.displayMonth}</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="text-left p-2 font-medium">日付</th><th className="text-left p-2 font-medium">スタンド</th><th className="text-right p-2 font-medium">燃費</th><th className="text-right p-2 font-medium">L単価</th><th className="text-right p-2 font-medium">金額</th><th className="text-center p-2 font-medium">操作</th></tr></thead>
                                        <tbody>
                                            {month.records.map(r => (
                                                <tr key={r.id} className="border-b hover:bg-gray-50"><td className="p-2">{r.date}</td><td className="p-2"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">{r.station}</span></td><td className="text-right p-2">{r.fuelEfficiency ? formatFuelEfficiency(r.fuelEfficiency) : '-'}</td><td className="text-right p-2">{formatPrice(r.pricePerLiter)}</td><td className="text-right p-2">{formatCurrency(r.cost)}</td><td className="text-center p-2"><div className="flex items-center justify-center gap-2"><Button variant="ghost" size="icon" onClick={() => setEditingRecord(r)}><Edit className="w-4 h-4 text-blue-600"/></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteRecord(r.id)}><Trash2 className="w-4 h-4 text-red-600"/></Button></div></td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 text-gray-500 border-2 border-dashed rounded-lg">
                        <Car className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-semibold">まだ記録がありません</h3>
                        <p className="mt-1">左のフォームから最初の燃費記録を追加して、ダッシュボードを始めましょう。</p>
                    </div>
                )}
            </div>
        </div>

        {/* --- Evaluation and Alerts Section --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hasData && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                        <Award className="w-8 h-8 text-purple-600 mr-3" />
                        <h3 className="text-lg font-semibold text-purple-800">総合評価</h3>
                    </div>
                    <p className="text-3xl font-bold text-purple-900 mb-2">{alerts.length === 0 ? 'A' : alerts.length <= 1 ? 'B' : 'C'}</p>
                    <p className="text-purple-600">{alerts.length === 0 ? '良好な状態です' : '改善の余地があります'}</p>
                </div>
            )}
            
            {alerts.length > 0 && (
                <div className="bg-white rounded-lg shadow border p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <AlertCircle className="mr-2 text-orange-500"/>注意事項
                    </h3>
                    <div className="space-y-2">
                        {alerts.map((a,i) => (
                            <div key={i} className="p-3 rounded-lg bg-orange-50 border border-orange-200 text-orange-800">
                                {a}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* --- Charts Section --- */}
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">グラフ分析</h3>
            {hasData ? (
                <Charts records={records} statistics={statistics} />
            ) : (
                <div className="text-center py-16 text-gray-500 border-2 border-dashed rounded-lg">
                    <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-semibold">グラフはまだありません</h3>
                    <p className="mt-1">データを追加すると、自動的にグラフが生成されます。</p>
                </div>
            )}
        </div>
      </main>
    </div>
  )
}

export default Dashboard
