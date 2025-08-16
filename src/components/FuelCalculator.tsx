import React, { useEffect, useMemo, useState, useRef } from 'react'
import { Calendar, Car, DollarSign, Plus, Trash2, Download, Upload, BarChart3, Search, Filter, Edit, Target, AlertCircle, FileText, TrendingUp, TrendingDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { validateFuelRecord, ValidationResult } from '@/utils/validation'
import { exportToCSV, exportToJSON, generateMonthlyReport } from '@/utils/export'
import { parseCSV, parseJSON, readFileAsText, generateSampleCSV } from '@/utils/import'
import { calculateStatistics, StatisticsData, formatCurrency, formatFuelEfficiency, formatPrice, getEfficiencyGrade, getEfficiencyColor } from '@/utils/statistics'
import Charts from './Charts'
import Dashboard from './Dashboard'

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
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [editingRecord, setEditingRecord] = useState<FuelRecord | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' })
  const [stationFilter, setStationFilter] = useState('')
  const [showStats, setShowStats] = useState(false)
  const [activeTab, setActiveTab] = useState<'data' | 'charts' | 'dashboard'>('data')
  const [showImportModal, setShowImportModal] = useState(false)
  const [fuelEfficiencyGoal, setFuelEfficiencyGoal] = useState(15)
  const [monthlyBudget, setMonthlyBudget] = useState(20000)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [statistics, setStatistics] = useState<StatisticsData | null>(null)

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

  // 統計データを計算
  useEffect(() => {
    if (records.length > 0) {
      const stats = calculateStatistics(records)
      setStatistics(stats)
    } else {
      setStatistics(null)
    }
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
    // バリデーション
    const validation = validateFuelRecord(formData, records)
    setValidationErrors(validation.errors)
    
    if (!validation.isValid) {
      return
    }

    const payload = {
      date: formData.date,
      amount: parseFloat(String(formData.amount)),
      cost: parseInt(String(formData.cost), 10),
      mileage: parseFloat(String(formData.mileage)),
      station: formData.station.trim(),
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
      setValidationErrors([])
    }
    setLoading(false)
  }

  const updateRecord = async (updatedRecord: FuelRecord) => {
    const validation = validateFuelRecord({
      date: updatedRecord.date,
      amount: updatedRecord.amount.toString(),
      cost: updatedRecord.cost.toString(),
      mileage: updatedRecord.mileage.toString(),
      station: updatedRecord.station
    }, records.filter(r => r.id !== updatedRecord.id))

    if (!validation.isValid) {
      alert('入力エラー: ' + validation.errors.join('\n'))
      return
    }

    setLoading(true)
    setError(null)
    const { error } = await supabase
      .from('fuel_records')
      .update({
        date: updatedRecord.date,
        amount: updatedRecord.amount,
        cost: updatedRecord.cost,
        mileage: updatedRecord.mileage,
        station: updatedRecord.station
      })
      .eq('id', updatedRecord.id)

    if (error) {
      setError(error.message)
    } else {
      const updated = records.map(r => r.id === updatedRecord.id ? updatedRecord : r)
        .sort((a, b) => a.date.localeCompare(b.date))
      setRecords(updated)
      setEditingRecord(null)
    }
    setLoading(false)
  }

  const handleImport = async (file: File) => {
    try {
      const text = await readFileAsText(file)
      const fileExt = file.name.toLowerCase().split('.').pop()
      
      let result
      if (fileExt === 'csv') {
        result = parseCSV(text)
      } else if (fileExt === 'json') {
        result = parseJSON(text)
      } else {
        alert('サポートされていないファイル形式です。CSVまたはJSONファイルを選択してください。')
        return
      }

      if (!result.success) {
        alert('インポートエラー:\n' + result.errors?.join('\n'))
        return
      }

      if (!result.data || result.data.length === 0) {
        alert('インポートするデータがありません')
        return
      }

      setLoading(true)
      let successCount = 0
      
      for (const record of result.data) {
        const { error } = await supabase
          .from('fuel_records')
          .insert(record)
        
        if (!error) {
          successCount++
        }
      }

      // データを再読み込み
      const { data, error } = await supabase
        .from('fuel_records')
        .select('*')
        .order('date', { ascending: true })
      
      if (!error && data) {
        const parsed = data.map((r) => ({
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
      setShowImportModal(false)
      alert(`${successCount}件のレコードをインポートしました`)
    } catch (error) {
      setLoading(false)
      alert('ファイルの読み込み中にエラーが発生しました: ' + error)
    }
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

  // フィルタリングされたレコード
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // テキスト検索
      if (searchTerm && !record.station.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      
      // 日付フィルター
      if (dateFilter.start && record.date < dateFilter.start) {
        return false
      }
      if (dateFilter.end && record.date > dateFilter.end) {
        return false
      }
      
      // スタンドフィルター
      if (stationFilter && record.station !== stationFilter) {
        return false
      }
      
      return true
    })
  }, [records, searchTerm, dateFilter, stationFilter])

  // 月別集計
  const monthlyData = useMemo(() => {
    const monthlyMap: Record<string, { month: string; totalCost: number; totalAmount: number; records: (FuelRecord & { fuelEfficiency: number | null; pricePerLiter: number })[] }> = {}

    filteredRecords.forEach((record, index) => {
      const month = record.date.substring(0, 7)
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, totalCost: 0, totalAmount: 0, records: [] }
      }
      const pricePerLiter = record.cost / record.amount
      const prev = filteredRecords[index - 1]
      monthlyMap[month].totalCost += record.cost
      monthlyMap[month].totalAmount += record.amount
      monthlyMap[month].records.push({
        ...record,
        pricePerLiter,
        fuelEfficiency: calculateFuelEfficiency(record, prev),
      })
    })

    return Object.values(monthlyMap).sort((a, b) => b.month.localeCompare(a.month))
  }, [filteredRecords])

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
            <Car className="mr-2 sm:mr-3 text-blue-600" />
            燃費計算アプリ
          </h1>
          
          {/* タブナビゲーション */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('data')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'data'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              データ管理
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ダッシュボード
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'charts'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              グラフ分析
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            エラー: {error}
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <strong>入力エラー:</strong>
            <ul className="mt-1 list-disc list-inside">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 統計情報 */}
        {statistics && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <BarChart3 className="mr-2 text-blue-600" />
                統計情報
              </h2>
              <button
                onClick={() => setShowStats(!showStats)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {showStats ? '非表示' : '詳細表示'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatFuelEfficiency(statistics.averageFuelEfficiency)}
                </div>
                <div className="text-sm text-gray-600">平均燃費</div>
                <div className={`text-xs ${getEfficiencyColor(statistics.averageFuelEfficiency)}`}>
                  グレード: {getEfficiencyGrade(statistics.averageFuelEfficiency)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(statistics.totalCost)}
                </div>
                <div className="text-sm text-gray-600">総コスト</div>
                <div className="text-xs text-gray-500">
                  月平均: {formatCurrency(statistics.averageCostPerMonth)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatPrice(statistics.averagePrice)}
                </div>
                <div className="text-sm text-gray-600">平均単価</div>
                <div className="flex items-center justify-center text-xs mt-1">
                  {statistics.trends.isPriceIncreasing ? (
                    <TrendingUp className="w-3 h-3 text-red-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-green-500 mr-1" />
                  )}
                  <span className={statistics.trends.isPriceIncreasing ? 'text-red-500' : 'text-green-500'}>
                    {statistics.trends.priceChange > 0 ? '+' : ''}{statistics.trends.priceChange.toFixed(1)}円/L
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {statistics.totalRecords}
                </div>
                <div className="text-sm text-gray-600">総記録数</div>
                <div className="text-xs text-gray-500">
                  {statistics.totalAmount.toFixed(1)}L 総給油量
                </div>
              </div>
            </div>

            {showStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">燃費パフォーマンス</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>最高燃費:</span>
                      <span className="text-green-600 font-medium">{formatFuelEfficiency(statistics.bestFuelEfficiency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>最低燃費:</span>
                      <span className="text-red-600 font-medium">{formatFuelEfficiency(statistics.worstFuelEfficiency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>総走行距離:</span>
                      <span className="font-medium">{statistics.totalDistance.toFixed(1)}km</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">価格情報</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>最安単価:</span>
                      <span className="text-green-600 font-medium">{formatPrice(statistics.cheapestPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>最高単価:</span>
                      <span className="text-red-600 font-medium">{formatPrice(statistics.expensivePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>価格幅:</span>
                      <span className="font-medium">{formatPrice(statistics.expensivePrice - statistics.cheapestPrice)}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">目標達成度</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>燃費目標:</span>
                      <span className={statistics.averageFuelEfficiency >= fuelEfficiencyGoal ? 'text-green-600' : 'text-red-600'}>
                        {statistics.averageFuelEfficiency >= fuelEfficiencyGoal ? '✓' : '✗'} {fuelEfficiencyGoal}km/L
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>月予算:</span>
                      <span className={statistics.averageCostPerMonth <= monthlyBudget ? 'text-green-600' : 'text-red-600'}>
                        {statistics.averageCostPerMonth <= monthlyBudget ? '✓' : '✗'} {formatCurrency(monthlyBudget)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ツールバー */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {/* 検索 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="スタンド名で検索"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm w-40"
                />
              </div>
              
              {/* 日付フィルター */}
              <input
                type="date"
                placeholder="開始日"
                value={dateFilter.start}
                onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="date"
                placeholder="終了日"
                value={dateFilter.end}
                onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              
              {/* スタンドフィルター */}
              <select
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">全スタンド</option>
                {stationList.map((station, idx) => (
                  <option key={idx} value={station}>{station}</option>
                ))}
              </select>
              
              {/* フィルタークリア */}
              {(searchTerm || dateFilter.start || dateFilter.end || stationFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setDateFilter({start: '', end: ''})
                    setStationFilter('')
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md text-sm hover:bg-gray-200"
                >
                  クリア
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* エクスポート */}
              <button
                onClick={() => exportToCSV(filteredRecords)}
                className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 flex items-center"
              >
                <Download className="w-4 h-4 mr-1" />
                CSV
              </button>
              <button
                onClick={() => exportToJSON(filteredRecords)}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center"
              >
                <Download className="w-4 h-4 mr-1" />
                JSON
              </button>
              <button
                onClick={() => generateMonthlyReport(filteredRecords)}
                className="px-3 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 flex items-center"
              >
                <FileText className="w-4 h-4 mr-1" />
                レポート
              </button>
              
              {/* インポート */}
              <button
                onClick={() => setShowImportModal(true)}
                className="px-3 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700 flex items-center"
              >
                <Upload className="w-4 h-4 mr-1" />
                インポート
              </button>
            </div>
          </div>
        </div>

        {/* インポートモーダル */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">データインポート</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">ファイルを選択</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.json"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleImport(file)
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">CSVまたはJSONファイルを選択してください</p>
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={generateSampleCSV}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    サンプルダウンロード
                  </button>
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
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
          <div className="flex items-center justify-between mt-4">
            <button onClick={addRecord} disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-60">
              <Plus className="w-4 h-4 mr-2" />
              {loading ? '送信中...' : '記録を追加'}
            </button>
            
            {validationErrors.length === 0 && formData.date && formData.amount && formData.cost && formData.mileage && (
              <div className="text-sm text-gray-600">
                予想単価: ¥{(parseInt(formData.cost) / parseFloat(formData.amount)).toFixed(1)}/L
              </div>
            )}
          </div>
        </div>

        {/* 検索結果表示 */}
        {(searchTerm || dateFilter.start || dateFilter.end || stationFilter) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <Filter className="w-4 h-4 mr-2 text-blue-600" />
              <span className="text-sm text-blue-800">
                {records.length}件中 {filteredRecords.length}件を表示中
                {searchTerm && ` | スタンド: "${searchTerm}"`}
                {dateFilter.start && ` | ${dateFilter.start}以降`}
                {dateFilter.end && ` | ${dateFilter.end}以前`}
                {stationFilter && ` | ${stationFilter}のみ`}
              </span>
            </div>
          </div>
        )}

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
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  onClick={() => setEditingRecord(record)} 
                                  className="text-blue-600 hover:text-blue-800 p-1" 
                                  title="編集"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => deleteRecord(record.id)} 
                                  className="text-red-600 hover:text-red-800 p-1" 
                                  title="削除"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
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
            <p className="text-sm mt-2">またはツールバーからサンプルデータをインポートできます</p>
          </div>
        )}

        {/* 編集モーダル */}
        {editingRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">記録の編集</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">給油日</label>
                  <input
                    type="date"
                    value={editingRecord.date}
                    onChange={(e) => setEditingRecord({...editingRecord, date: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">スタンド名</label>
                  <input
                    type="text"
                    value={editingRecord.station}
                    onChange={(e) => setEditingRecord({...editingRecord, station: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">給油量(L)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingRecord.amount}
                      onChange={(e) => setEditingRecord({...editingRecord, amount: parseFloat(e.target.value) || 0})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">金額(円)</label>
                    <input
                      type="number"
                      value={editingRecord.cost}
                      onChange={(e) => setEditingRecord({...editingRecord, cost: parseInt(e.target.value) || 0})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">走行距離(km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingRecord.mileage}
                    onChange={(e) => setEditingRecord({...editingRecord, mileage: parseFloat(e.target.value) || 0})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setEditingRecord(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => updateRecord(editingRecord)}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
                  >
                    {loading ? '更新中...' : '更新'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 目標設定 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Target className="mr-2 text-green-600" />
            目標設定
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                燃費目標 (km/L)
              </label>
              <input
                type="number"
                step="0.1"
                value={fuelEfficiencyGoal}
                onChange={(e) => setFuelEfficiencyGoal(parseFloat(e.target.value) || 15)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                月間予算 (円)
              </label>
              <input
                type="number"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(parseInt(e.target.value) || 20000)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          {statistics && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg ${statistics.averageFuelEfficiency >= fuelEfficiencyGoal ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center">
                  {statistics.averageFuelEfficiency >= fuelEfficiencyGoal ? (
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                  )}
                  <span className="text-sm font-medium">
                    燃費目標: {statistics.averageFuelEfficiency >= fuelEfficiencyGoal ? '達成' : '未達成'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  現在: {formatFuelEfficiency(statistics.averageFuelEfficiency)} / 目標: {fuelEfficiencyGoal}km/L
                </p>
              </div>
              
              <div className={`p-3 rounded-lg ${statistics.averageCostPerMonth <= monthlyBudget ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center">
                  {statistics.averageCostPerMonth <= monthlyBudget ? (
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                  )}
                  <span className="text-sm font-medium">
                    予算: {statistics.averageCostPerMonth <= monthlyBudget ? '達成' : '超過'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  月平均: {formatCurrency(statistics.averageCostPerMonth)} / 予算: {formatCurrency(monthlyBudget)}
                </p>
              </div>
            </div>
          )}
        </div>

        {records.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">💡 使い方のコツ</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 燃費は前回の給油からの走行距離で計算されます</li>
              <li>• 最初の記録では燃費は表示されません</li>
              <li>• 走行距離は累積距離（オドメーター）を入力してください</li>
              <li>• スタンド名は一度入力すると選択リストに追加されます</li>
              <li>• データはSupabaseに保存されます</li>
              <li>• エクスポート機能でCSV、JSON、レポートを出力できます</li>
              <li>• 検索・フィルター機能でデータを絞り込みできます</li>
            </ul>
          </div>
        )}

        {/* グラフやチャートが空の場合のメッセージ */}
        {activeTab === 'charts' && records.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">グラフを表示するにはデータが必要です</p>
            <p className="text-sm mt-2">まずは給油記録を追加してください</p>
            <button
              onClick={() => setActiveTab('data')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              データ管理に移動
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (!statistics || records.length === 0) && (
          <div className="text-center py-16 text-gray-500">
            <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">ダッシュボードを表示するにはデータが必要です</p>
            <p className="text-sm mt-2">まずは給油記録を追加してください</p>
            <button
              onClick={() => setActiveTab('data')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              データ管理に移動
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default FuelCalculator
