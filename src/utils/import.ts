import { validateImportData } from './validation'

export interface ImportResult {
  success: boolean
  data?: any[]
  errors?: string[]
  message?: string
}

export const parseCSV = (csvText: string): ImportResult => {
  try {
    const lines = csvText.trim().split('\n')
    
    if (lines.length < 2) {
      return {
        success: false,
        errors: ['CSVファイルにデータが含まれていません']
      }
    }

    // ヘッダー行を解析
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    // 必要なカラムがあるかチェック
    const requiredColumns = ['日付', '給油量', '金額', '走行距離', 'スタンド名']
    const missingColumns = requiredColumns.filter(col => 
      !headers.some(h => h.includes(col.replace('(L)', '').replace('(円)', '').replace('(km)', '')))
    )
    
    if (missingColumns.length > 0) {
      return {
        success: false,
        errors: [`必要なカラムが不足しています: ${missingColumns.join(', ')}`]
      }
    }

    // データ行を解析
    const data = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      
      if (values.length !== headers.length) {
        continue // スキップ
      }

      const record: any = {}
      headers.forEach((header, index) => {
        const value = values[index]
        
        // カラム名に基づいてマッピング
        if (header.includes('日付')) {
          record.date = value
        } else if (header.includes('給油量')) {
          record.amount = parseFloat(value) || 0
        } else if (header.includes('金額')) {
          record.cost = parseInt(value.replace(/[,¥]/g, ''), 10) || 0
        } else if (header.includes('走行距離')) {
          record.mileage = parseFloat(value) || 0
        } else if (header.includes('スタンド')) {
          record.station = value || ''
        }
      })

      if (record.date && record.amount && record.cost && record.mileage && record.station) {
        data.push(record)
      }
    }

    if (data.length === 0) {
      return {
        success: false,
        errors: ['有効なデータが見つかりませんでした']
      }
    }

    // データを日付順にソート
    data.sort((a, b) => a.date.localeCompare(b.date))

    // バリデーション
    const validation = validateImportData(data)
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      }
    }

    return {
      success: true,
      data,
      message: `${data.length}件のレコードを読み込みました`
    }

  } catch (error) {
    return {
      success: false,
      errors: [`CSVファイルの解析中にエラーが発生しました: ${error}`]
    }
  }
}

export const parseJSON = (jsonText: string): ImportResult => {
  try {
    const parsed = JSON.parse(jsonText)
    
    let data: any[]
    
    // 異なるJSON形式に対応
    if (Array.isArray(parsed)) {
      data = parsed
    } else if (parsed.records && Array.isArray(parsed.records)) {
      data = parsed.records
    } else if (parsed.data && Array.isArray(parsed.data)) {
      data = parsed.data
    } else {
      return {
        success: false,
        errors: ['JSONファイルの形式が正しくありません']
      }
    }

    if (data.length === 0) {
      return {
        success: false,
        errors: ['インポートするデータがありません']
      }
    }

    // データを正規化
    const normalizedData = data.map(record => ({
      date: record.date || record.給油日 || '',
      amount: Number(record.amount || record.給油量 || record['給油量(L)'] || 0),
      cost: Number(record.cost || record.金額 || record['金額(円)'] || 0),
      mileage: Number(record.mileage || record.走行距離 || record['走行距離(km)'] || 0),
      station: String(record.station || record.スタンド名 || record.スタンド || '')
    }))

    // データを日付順にソート
    normalizedData.sort((a, b) => a.date.localeCompare(b.date))

    // バリデーション
    const validation = validateImportData(normalizedData)
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      }
    }

    return {
      success: true,
      data: normalizedData,
      message: `${normalizedData.length}件のレコードを読み込みました`
    }

  } catch (error) {
    return {
      success: false,
      errors: [`JSONファイルの解析中にエラーが発生しました: ${error}`]
    }
  }
}

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('ファイルを文字列として読み込めませんでした'))
      }
    }
    reader.onerror = () => reject(new Error('ファイルの読み込み中にエラーが発生しました'))
    reader.readAsText(file, 'UTF-8')
  })
}

export const generateSampleCSV = (): void => {
  const sampleData = [
    '日付,スタンド名,給油量(L),金額(円),走行距離(km)',
    '2024-01-15,エネオス田中店,40.5,6075,50250.0',
    '2024-02-01,出光セルフ山田SS,38.2,5730,50680.5',
    '2024-02-18,コスモ石油佐藤店,42.1,6315,51120.8'
  ].join('\n')

  const bom = '\uFEFF'
  const blob = new Blob([bom + sampleData], { type: 'text/csv;charset=utf-8;' })
  
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'サンプル燃費データ.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}