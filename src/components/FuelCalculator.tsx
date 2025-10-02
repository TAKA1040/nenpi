import React, { useState, useMemo, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { validateFuelRecord } from '@/utils/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
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
  editingRecord: FuelRecord | null
  setEditingRecord: (record: FuelRecord | null) => void
}

const emptyForm = { date: '', amount: '', cost: '', mileage: '', station: '' }

const FuelCalculator: React.FC<FuelCalculatorProps> = ({ user, records, onRecordsUpdate, editingRecord, setEditingRecord }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const stationList = useMemo(() => 
    Array.from(new Set(records.map((r) => r.station))).sort()
  , [records])

  useEffect(() => {
    if (editingRecord) {
      setFormData({
        date: editingRecord.date,
        amount: String(editingRecord.amount),
        cost: String(editingRecord.cost),
        mileage: String(editingRecord.mileage),
        station: editingRecord.station,
      })
    } else {
      setFormData(emptyForm)
    }
  }, [editingRecord])

  const handleSubmit = async () => {
    const validation = validateFuelRecord(formData, records.filter(r => r.id !== editingRecord?.id))
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }

    setLoading(true)
    const payload = {
      ...formData,
      user_id: user.id,
      amount: parseFloat(formData.amount),
      cost: parseInt(formData.cost, 10),
      mileage: parseFloat(formData.mileage),
    }

    const { error } = editingRecord
      ? await supabase.from('fuel_records').update(payload).eq('id', editingRecord.id)
      : await supabase.from('fuel_records').insert(payload)

    if (error) {
      alert(`エラー: ${error.message}`)
    } else {
      setFormData(emptyForm)
      setValidationErrors([])
      setEditingRecord(null)
      onRecordsUpdate()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        {editingRecord ? '記録の編集' : '給油記録の入力'}
      </h2>
      {/* スマホ向け2段レイアウト */}
      <div className="space-y-4">
        {/* 1段目: 給油日 + スタンド名 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">給油日</Label>
            <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="station">スタンド名</Label>
            <Input id="station" type="text" list="stations" value={formData.station} onChange={(e) => setFormData({ ...formData, station: e.target.value })} placeholder="例: ENEOS" />
            <datalist id="stations">
              {stationList.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
        </div>
        
        {/* 2段目: 給油量 + 金額と単価表示 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount">給油量 (L)</Label>
            <Input id="amount" type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="例: 45.5" />
          </div>
          <div>
            <Label htmlFor="cost">金額 (円)</Label>
            <Input id="cost" type="number" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} placeholder="例: 6500" />
            {formData.amount && formData.cost && parseFloat(formData.amount) > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                単価: ¥{(parseInt(formData.cost) / parseFloat(formData.amount)).toFixed(2)}/L
              </p>
            )}
          </div>
        </div>
        
        {/* 3段目: 走行距離 */}
        <div>
          <Label htmlFor="mileage">走行距離 (km)</Label>
          <Input id="mileage" type="number" step="0.1" value={formData.mileage} onChange={(e) => setFormData({ ...formData, mileage: e.target.value })} placeholder="例: 12500.0" />
        </div>
      </div>
      {validationErrors.length > 0 && (
        <div className="mt-2 text-red-500 text-sm">
          {validationErrors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}
      <div className="flex items-center justify-end gap-4 mt-4">
        {editingRecord && (
          <Button variant="outline" onClick={() => setEditingRecord(null)}>キャンセル</Button>
        )}
        <Button onClick={handleSubmit} disabled={loading} className="w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          {loading ? '送信中...' : (editingRecord ? '記録を更新' : '記録を追加')}
        </Button>
      </div>
    </div>
  )
}

export default FuelCalculator
