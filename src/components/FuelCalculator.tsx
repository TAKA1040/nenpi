import React, { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { validateFuelRecord } from '@/utils/validation'
import { Calendar, Car, DollarSign, Plus, Trash2, Edit, Search, Filter } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

// Type definitions
export type FuelRecord = {
  id: string
  user_id?: string
  date: string
  amount: number
  cost: number
  mileage: number
  station: string
  created_at?: string
}

interface FuelCalculatorProps {
  user: User
  records: FuelRecord[]
  onRecordsUpdate: () => void
}

const emptyForm = { date: '', amount: '', cost: '', mileage: '', station: '' }

const FuelCalculator: React.FC<FuelCalculatorProps> = ({ user, records, onRecordsUpdate }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [editingRecord, setEditingRecord] = useState<FuelRecord | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const stationList = useMemo(() => 
    Array.from(new Set(records.map((r) => r.station))).sort()
  , [records])

  const calculateFuelEfficiency = (current: FuelRecord, previous?: FuelRecord) => {
    if (!previous) return null
    const distance = current.mileage - previous.mileage
    if (distance <= 0) return null
    return distance / current.amount
  }

  const sortedRecords = useMemo(() => 
    [...records].sort((a, b) => a.date.localeCompare(b.date))
  , [records])

  const filteredRecords = useMemo(() => {
    const withEfficiency = sortedRecords.map((record, index) => ({
      ...record,
      fuelEfficiency: calculateFuelEfficiency(record, sortedRecords[index - 1]),
      pricePerLiter: record.cost / record.amount
    }))

    return withEfficiency.filter(record => 
      record.station.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.date.localeCompare(a.date)); // Show newest first
  }, [sortedRecords, searchTerm])

  const handleAddRecord = async () => {
    const validation = validateFuelRecord(formData, records)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }

    setLoading(true)
    const { error } = await supabase.from('fuel_records').insert({
      ...formData,
      user_id: user.id,
    })

    if (error) {
      alert('記録の追加に失敗しました: ' + error.message)
    } else {
      setFormData(emptyForm)
      setValidationErrors([])
      onRecordsUpdate() // Notify parent to refetch
    }
    setLoading(false)
  }

  const handleUpdateRecord = async (recordToUpdate: FuelRecord) => {
    const validation = validateFuelRecord({
        date: recordToUpdate.date,
        amount: String(recordToUpdate.amount),
        cost: String(recordToUpdate.cost),
        mileage: String(recordToUpdate.mileage),
        station: recordToUpdate.station
    }, records.filter(r => r.id !== recordToUpdate.id))

    if (!validation.isValid) {
        alert('入力エラー: ' + validation.errors.join('\n'))
        return
    }

    setLoading(true)
    const { error } = await supabase
      .from('fuel_records')
      .update({ ...recordToUpdate, user_id: user.id })
      .eq('id', recordToUpdate.id)

    if (error) {
      alert('記録の更新に失敗しました: ' + error.message)
    } else {
      setEditingRecord(null)
      onRecordsUpdate() // Notify parent to refetch
    }
    setLoading(false)
  }

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('本当にこの記録を削除しますか？')) {
      setLoading(true)
      const { error } = await supabase.from('fuel_records').delete().eq('id', id)
      if (error) {
        alert('削除に失敗しました: ' + error.message)
      } else {
        onRecordsUpdate() // Notify parent to refetch
      }
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Input Form */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">給油記録の入力</h2>
        {/* ... form fields ... */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full p-2 border rounded" />
            <input type="text" list="stations" value={formData.station} onChange={(e) => setFormData({ ...formData, station: e.target.value })} placeholder="ガソリンスタンド" className="w-full p-2 border rounded" />
            <datalist id="stations">
                {stationList.map(s => <option key={s} value={s} />)}
            </datalist>
            <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="給油量 (L)" className="w-full p-2 border rounded" />
            <input type="number" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} placeholder="金額 (円)" className="w-full p-2 border rounded" />
            <input type="number" value={formData.mileage} onChange={(e) => setFormData({ ...formData, mileage: e.target.value })} placeholder="走行距離 (km)" className="w-full p-2 border rounded" />
        </div>
        <button onClick={handleAddRecord} disabled={loading} className="mt-4 w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-blue-400">
          {loading ? '追加中...' : '記録を追加'}
        </button>
        {validationErrors.length > 0 && (
            <div className="mt-2 text-red-500 text-sm">
                {validationErrors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
        )}
      </div>

      {/* Record List */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">記録一覧</h2>
        <input type="text" placeholder="スタンド名で検索..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 border rounded mb-4" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">日付</th>
                <th className="text-left p-2">スタンド</th>
                <th className="text-right p-2">燃費</th>
                <th className="text-right p-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{record.date}</td>
                  <td className="p-2">{record.station}</td>
                  <td className="text-right p-2">{record.fuelEfficiency ? `${record.fuelEfficiency.toFixed(2)} km/L` : '-' }</td>
                  <td className="p-2 flex justify-end gap-2">
                    <button onClick={() => setEditingRecord(record)} className="text-blue-600"><Edit size={16} /></button>
                    <button onClick={() => handleDeleteRecord(record.id)} className="text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editing Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">記録の編集</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="date" value={editingRecord.date} onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })} className="w-full p-2 border rounded" />
                <input type="text" value={editingRecord.station} onChange={(e) => setEditingRecord({ ...editingRecord, station: e.target.value })} className="w-full p-2 border rounded" />
                <input type="number" value={editingRecord.amount} onChange={(e) => setEditingRecord({ ...editingRecord, amount: Number(e.target.value) })} className="w-full p-2 border rounded" />
                <input type="number" value={editingRecord.cost} onChange={(e) => setEditingRecord({ ...editingRecord, cost: Number(e.target.value) })} className="w-full p-2 border rounded" />
                <input type="number" value={editingRecord.mileage} onChange={(e) => setEditingRecord({ ...editingRecord, mileage: Number(e.target.value) })} className="w-full p-2 border rounded" />
            </div>
            <div className="flex justify-end gap-4 mt-4">
              <button onClick={() => setEditingRecord(null)} className="bg-gray-300 p-2 rounded">キャンセル</button>
              <button onClick={() => handleUpdateRecord(editingRecord)} disabled={loading} className="bg-blue-600 text-white p-2 rounded">
                {loading ? '更新中...' : '更新'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FuelCalculator