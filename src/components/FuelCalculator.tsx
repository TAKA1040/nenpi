import React, { useEffect, useMemo, useState } from 'react'
import { Calendar, Car, DollarSign, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// 型定義
export type FuelRecord = {
  id: string
  date: string // YYYY-MM-DD
  amount: number // L
  cost: number // JPY
  mileage: number // km (odometer)
  station: string
  created_at?: string
}

const emptyForm = { date: '', amount: '', cost: '', mileage: '', station: '' }

type FormState = typeof emptyForm

const FuelCalculator: React.FC = () => {
  const [records, setRecords] = useState<FuelRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormState>(emptyForm)
  const [stationList, setStationList] = useState<string[]>([])
  const [isAddingNewStation, setIsAddingNewStation] = useState(false)
  const [newStationName, setNewStationName] = useState('')
  const [error, setError] = useState<string | null>(null)

  // 初回読み込み
  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('fuel_records')
        .select('*')
        .order('date', { ascending: true })
      if (error) {
        setError(error.message)
      } else {
        const parsed = (data || []).map((r) => ({
          id: String(r.id),
          date: r.date as string,
          amount: Number(r.amount),
          cost: Number(r.cost),
          mileage: Number(r.mileage),
          station: String(r.station),
          created_at: r.created_at as string | undefined,
        }))
        setRecords(parsed)
      }
      setLoading(false)
    }

    fetchRecords()
  }, [])

  // スタンドの候補は既存レコードから生成
  useEffect(() => {
    const s = Array.from(new Set(records.map((r) => r.station))).sort()
    setStationList(s)
  }, [records])

  const addNewStation = () => {
    if (!newStationName.trim()) {
      alert('スタンド名を入力してください')
      return
    }
    if (stationList.includes(newStationName.trim())) {
      alert('このスタンド名は既に登録されています')
      return
    }
    setStationList([...stationList, newStationName.trim()])
    setFormData({ ...formData, station: newStationName.trim() })
    setNewStationName('')
    setIsAddingNewStation(false)
  }

  const addRecord = async () => {
    if (!formData.date || !formData.amount || !formData.cost || !formData.mileage || !formData.station) {
      alert('すべての項目を入力してください')
      return
    }

    const payload = {
      date: formData.date,
      amount: parseFloat(String(formData.amount)),
      cost: parseInt(String(formData.cost), 10),
      mileage: parseFloat(String(formData.mileage)),
      station: formData.station,
    }

    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('fuel_records')
      .insert(payload)
      .select()
      .single()

    if (error) {
      setError(error.message)
    } else if (data) {
      const newRecord: FuelRecord = {
        id: String(data.id),
        date: data.date,
        amount: Number(data.amount),
        cost: Number(data.cost),
        mileage: Number(data.mileage),
        station: String(data.station),
        created_at: data.created_at,
      }
      const updated = [...records, newRecord].sort((a, b) => a.date.localeCompare(b.date))
      setRecords(updated)
      setFormData(emptyForm)
    }
    setLoading(false)
  }

  const deleteRecord = async (id: string) => {
    const prev = records
    setRecords(records.filter((r) => r.id !== id))

    const { error } = await supabase.from('fuel_records').delete().eq('id', id)
    if (error) {
      // rollback
      setRecords(prev)
      alert('削除に失敗しました: ' + error.message)
    }
  }

  // 燃費計算（直前レコードとの差）
  const calculateFuelEfficiency = (current: FuelRecord, previous?: FuelRecord) => {
    if (!previous) return null
    const distance = current.mileage - previous.mileage
    if (distance <= 0) return null
    return distance / current.amount
  }

  // 月別集計
  const monthlyData = useMemo(() => {
    const monthlyMap: Record<string, { month: string; totalCost: number; totalAmount: number; records: (FuelRecord & { fuelEfficiency: number | null; pricePerLiter: number })[] }> = {}

    records.forEach((record, index) => {
      const month = record.date.substring(0, 7)
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, totalCost: 0, totalAmount: 0, records: [] }
      }
      const pricePerLiter = record.cost / record.amount
      const prev = records[index - 1]
      monthlyMap[month].totalCost += record.cost
      monthlyMap[month].totalAmount += record.amount
      monthlyMap[month].records.push({
        ...record,
        pricePerLiter,
        fuelEfficiency: calculateFuelEfficiency(record, prev),
      })
    })

    return Object.values(monthlyMap).sort((a, b) => b.month.localeCompare(a.month))
  }, [records])

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <Car className="mr-3 text-blue-600" />
          燃費計算アプリ
        </h1>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            エラー: {error}
          </div>
        )}

        {/* 入力フォーム */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">給油記録の入力</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                給油日
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">スタンド名</label>
              <div className="relative">
                {isAddingNewStation ? (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newStationName}
                      onChange={(e) => setNewStationName(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="新しいスタンド名"
                      onKeyDown={(e) => e.key === 'Enter' && addNewStation()}
                    />
                    <button onClick={addNewStation} className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
                      追加
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingNewStation(false)
                        setNewStationName('')
                      }}
                      className="px-3 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 text-sm"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <select
                      value={formData.station}
                      onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                      className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">スタンドを選択</option>
                      {stationList.map((s, idx) => (
                        <option key={idx} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setIsAddingNewStation(true)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      title="新しいスタンドを追加"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">給油量（L）</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="例: 45.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline w-4 h-4 mr-1" />
                金額（円）
              </label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="例: 6500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">走行距離（km）</label>
              <input
                type="number"
                step="0.1"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="例: 12500.0"
              />
            </div>
          </div>
          <button onClick={addRecord} disabled={loading} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-60">
            <Plus className="w-4 h-4 mr-2" />
            {loading ? '送信中...' : '記録を追加'}
          </button>
        </div>

        {/* 月別燃費表 */}
        {monthlyData.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 p-4 border-b">月別燃費表</h2>
            {monthlyData.map((month) => (
              <div key={month.month} className="border-b last:border-b-0">
                <div className="bg-gray-50 p-4">
                  <h3 className="text-lg font-medium text-gray-800">{month.month.replace('-', '年')}月</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 text-sm">
                    <div>
                      <span className="font-medium">月のガソリン代:</span>
                      <span className="ml-2 text-red-600 font-bold">¥{month.totalCost.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="font-medium">給油量合計:</span>
                      <span className="ml-2 text-blue-600 font-bold">{month.totalAmount.toFixed(1)}L</span>
                    </div>
                    <div>
                      <span className="font-medium">平均単価:</span>
                      <span className="ml-2 text-green-600 font-bold">¥{(month.totalCost / month.totalAmount).toFixed(1)}/L</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">日付</th>
                          <th className="text-left p-2">スタンド名</th>
                          <th className="text-right p-2">給油量(L)</th>
                          <th className="text-right p-2">金額(円)</th>
                          <th className="text-right p-2">単価(円/L)</th>
                          <th className="text-right p-2">走行距離(km)</th>
                          <th className="text-right p-2">燃費(km/L)</th>
                          <th className="text-center p-2">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {month.records.map((record) => (
                          <tr key={record.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">{record.date}</td>
                            <td className="p-2">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">{record.station}</span>
                            </td>
                            <td className="text-right p-2">{record.amount.toFixed(1)}</td>
                            <td className="text-right p-2">¥{record.cost.toLocaleString()}</td>
                            <td className="text-right p-2">¥{record.pricePerLiter.toFixed(1)}</td>
                            <td className="text-right p-2">{record.mileage.toFixed(1)}</td>
                            <td className="text-right p-2">
                              {record.fuelEfficiency ? (
                                <span className="font-medium text-green-600">{record.fuelEfficiency.toFixed(1)}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="text-center p-2">
                              <button onClick={() => deleteRecord(record.id)} className="text-red-600 hover:text-red-800 p-1" title="削除">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {records.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <Car className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>まだ給油記録がありません</p>
            <p className="text-sm">上のフォームから最初の記録を追加してください</p>
          </div>
        )}

        {records.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">💡 使い方のコツ</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 燃費は前回の給油からの走行距離で計算されます</li>
              <li>• 最初の記録では燃費は表示されません</li>
              <li>• 走行距離は累積距離（オドメーター）を入力してください</li>
              <li>• スタンド名は一度入力すると選択リストに追加されます</li>
              <li>• データはSupabaseに保存されます</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default FuelCalculator
