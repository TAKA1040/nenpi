import { FuelRecord } from '../components/FuelCalculator'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface FormValidationData {
  date: string
  amount: string
  cost: string
  mileage: string
  station: string
}

export const validateFuelRecord = (
  formData: FormValidationData,
  existingRecords: FuelRecord[] = []
): ValidationResult => {
  const errors: string[] = []

  // 日付検証
  if (!formData.date) {
    errors.push('給油日を入力してください')
  } else {
    const selectedDate = new Date(formData.date)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // 今日の終わりまで許可

    if (selectedDate > today) {
      errors.push('未来の日付は入力できません')
    }

    // 1年以上前の日付も警告
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    if (selectedDate < oneYearAgo) {
      errors.push('1年以上前の日付が入力されています。正しい日付か確認してください')
    }
  }

  // 給油量検証
  if (!formData.amount) {
    errors.push('給油量を入力してください')
  } else {
    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      errors.push('給油量は正の数値で入力してください')
    } else if (amount > 200) {
      errors.push('給油量が200Lを超えています。正しい値か確認してください')
    } else if (amount < 1) {
      errors.push('給油量が1L未満です。正しい値か確認してください')
    }
  }

  // 金額検証
  if (!formData.cost) {
    errors.push('金額を入力してください')
  } else {
    const cost = parseInt(formData.cost, 10)
    if (isNaN(cost) || cost <= 0) {
      errors.push('金額は正の整数で入力してください')
    } else if (cost > 50000) {
      errors.push('金額が50,000円を超えています。正しい値か確認してください')
    } else if (cost < 100) {
      errors.push('金額が100円未満です。正しい値か確認してください')
    }

    // 単価チェック
    if (formData.amount && !isNaN(parseFloat(formData.amount))) {
      const pricePerLiter = cost / parseFloat(formData.amount)
      if (pricePerLiter > 300) {
        errors.push(`単価が${pricePerLiter.toFixed(1)}円/Lと高額です。正しい値か確認してください`)
      } else if (pricePerLiter < 80) {
        errors.push(`単価が${pricePerLiter.toFixed(1)}円/Lと安すぎます。正しい値か確認してください`)
      }
    }
  }

  // 走行距離検証
  if (!formData.mileage) {
    errors.push('走行距離を入力してください')
  } else {
    const mileage = parseFloat(formData.mileage)
    if (isNaN(mileage) || mileage < 0) {
      errors.push('走行距離は0以上の数値で入力してください')
    } else if (mileage > 1000000) {
      errors.push('走行距離が100万kmを超えています。正しい値か確認してください')
    }

    // 既存レコードとの整合性チェック
    if (existingRecords.length > 0) {
      const sortedRecords = [...existingRecords].sort((a, b) => a.date.localeCompare(b.date))
      const latestRecord = sortedRecords[sortedRecords.length - 1]
      
      if (formData.date && latestRecord) {
        const newDate = new Date(formData.date)
        const latestDate = new Date(latestRecord.date)
        
        if (newDate >= latestDate && mileage < latestRecord.mileage) {
          errors.push(`走行距離が前回（${latestRecord.mileage.toFixed(1)}km）より少なくなっています`)
        }
        
        // 異常に大きな距離の増加をチェック
        if (newDate > latestDate) {
          const daysDiff = Math.ceil((newDate.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24))
          const distanceDiff = mileage - latestRecord.mileage
          if (daysDiff > 0 && distanceDiff / daysDiff > 1000) {
            errors.push(`1日あたり${(distanceDiff / daysDiff).toFixed(0)}kmと異常に長距離です。正しい値か確認してください`)
          }
        }
      }
    }
  }

  // スタンド名検証
  if (!formData.station.trim()) {
    errors.push('スタンド名を入力してください')
  } else if (formData.station.trim().length > 50) {
    errors.push('スタンド名は50文字以内で入力してください')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateImportData = (data: any[]): ValidationResult => {
  const errors: string[] = []
  
  if (!Array.isArray(data)) {
    errors.push('データが配列形式ではありません')
    return { isValid: false, errors }
  }

  if (data.length === 0) {
    errors.push('インポートするデータがありません')
    return { isValid: false, errors }
  }

  data.forEach((record, index) => {
    const rowNum = index + 1
    
    if (!record.date) {
      errors.push(`${rowNum}行目: 給油日が不足しています`)
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
      errors.push(`${rowNum}行目: 給油日の形式が正しくありません（YYYY-MM-DD形式で入力してください）`)
    }
    
    if (record.amount === undefined || record.amount === null) {
      errors.push(`${rowNum}行目: 給油量が不足しています`)
    } else if (isNaN(Number(record.amount)) || Number(record.amount) <= 0) {
      errors.push(`${rowNum}行目: 給油量が正しくありません`)
    }
    
    if (record.cost === undefined || record.cost === null) {
      errors.push(`${rowNum}行目: 金額が不足しています`)
    } else if (isNaN(Number(record.cost)) || Number(record.cost) <= 0) {
      errors.push(`${rowNum}行目: 金額が正しくありません`)
    }
    
    if (record.mileage === undefined || record.mileage === null) {
      errors.push(`${rowNum}行目: 走行距離が不足しています`)
    } else if (isNaN(Number(record.mileage)) || Number(record.mileage) < 0) {
      errors.push(`${rowNum}行目: 走行距離が正しくありません`)
    }
    
    if (!record.station || typeof record.station !== 'string' || record.station.trim() === '') {
      errors.push(`${rowNum}行目: スタンド名が不足しています`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors: errors.slice(0, 20) // 最大20個のエラーまで表示
  }
}