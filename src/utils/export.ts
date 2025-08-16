import { FuelRecord } from '../components/FuelCalculator'

export const exportToCSV = (records: FuelRecord[]): void => {
  if (records.length === 0) {
    alert('エクスポートするデータがありません')
    return
  }

  // ヘッダー行
  const headers = ['日付', 'スタンド名', '給油量(L)', '金額(円)', '単価(円/L)', '走行距離(km)', '燃費(km/L)']
  
  // データ行を作成
  const csvData = records.map((record, index) => {
    const pricePerLiter = (record.cost / record.amount).toFixed(1)
    const prevRecord = index > 0 ? records[index - 1] : null
    const fuelEfficiency = prevRecord 
      ? ((record.mileage - prevRecord.mileage) / record.amount).toFixed(1)
      : '-'
    
    return [
      record.date,
      `"${record.station}"`, // CSVでカンマを含む可能性があるため引用符で囲む
      record.amount.toFixed(1),
      record.cost.toString(),
      pricePerLiter,
      record.mileage.toFixed(1),
      fuelEfficiency
    ].join(',')
  })

  // CSVコンテンツを作成
  const csvContent = [
    headers.join(','),
    ...csvData
  ].join('\n')

  // BOMを追加してExcelで正しく文字化けしないようにする
  const bom = '\uFEFF'
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
  
  // ダウンロード
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `燃費記録_${new Date().toISOString().slice(0, 10)}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportToJSON = (records: FuelRecord[]): void => {
  if (records.length === 0) {
    alert('エクスポートするデータがありません')
    return
  }

  // 追加の計算データを含むエクスポート用データ
  const exportData = records.map((record, index) => {
    const pricePerLiter = record.cost / record.amount
    const prevRecord = index > 0 ? records[index - 1] : null
    const fuelEfficiency = prevRecord 
      ? (record.mileage - prevRecord.mileage) / record.amount
      : null
    
    return {
      ...record,
      pricePerLiter: Math.round(pricePerLiter * 10) / 10,
      fuelEfficiency: fuelEfficiency ? Math.round(fuelEfficiency * 10) / 10 : null,
      distanceFromPrevious: prevRecord ? Math.round((record.mileage - prevRecord.mileage) * 10) / 10 : null
    }
  })

  const jsonContent = JSON.stringify({
    exportDate: new Date().toISOString(),
    totalRecords: records.length,
    records: exportData
  }, null, 2)

  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
  
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `燃費記録_${new Date().toISOString().slice(0, 10)}.json`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const generateMonthlyReport = (records: FuelRecord[]): void => {
  if (records.length === 0) {
    alert('レポートを生成するデータがありません')
    return
  }

  // 月別データを集計
  const monthlyData: Record<string, {
    month: string
    records: FuelRecord[]
    totalCost: number
    totalAmount: number
    totalDistance: number
    averageFuelEfficiency: number
    fillUps: number
  }> = {}

  records.forEach((record, index) => {
    const month = record.date.substring(0, 7)
    if (!monthlyData[month]) {
      monthlyData[month] = {
        month,
        records: [],
        totalCost: 0,
        totalAmount: 0,
        totalDistance: 0,
        averageFuelEfficiency: 0,
        fillUps: 0
      }
    }

    monthlyData[month].records.push(record)
    monthlyData[month].totalCost += record.cost
    monthlyData[month].totalAmount += record.amount
    monthlyData[month].fillUps += 1

    // 前のレコードからの距離を計算
    if (index > 0) {
      const prevRecord = records[index - 1]
      const distance = record.mileage - prevRecord.mileage
      if (distance > 0) {
        monthlyData[month].totalDistance += distance
      }
    }
  })

  // 平均燃費を計算
  Object.values(monthlyData).forEach(data => {
    if (data.totalAmount > 0 && data.totalDistance > 0) {
      data.averageFuelEfficiency = data.totalDistance / data.totalAmount
    }
  })

  // レポート内容を生成
  const reportLines = [
    '# 燃費月次レポート',
    `生成日時: ${new Date().toLocaleString('ja-JP')}`,
    `対象期間: ${records.map(r => r.date).sort()[0]} ～ ${records.map(r => r.date).sort().slice(-1)[0]}`,
    '',
    '## 月別サマリー',
    ''
  ]

  const sortedMonths = Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month))
  
  sortedMonths.forEach(data => {
    const avgPrice = data.totalCost / data.totalAmount
    reportLines.push(`### ${data.month.replace('-', '年')}月`)
    reportLines.push(`- 給油回数: ${data.fillUps}回`)
    reportLines.push(`- 総給油量: ${data.totalAmount.toFixed(1)}L`)
    reportLines.push(`- 総費用: ¥${data.totalCost.toLocaleString()}`)
    reportLines.push(`- 平均単価: ¥${avgPrice.toFixed(1)}/L`)
    reportLines.push(`- 走行距離: ${data.totalDistance.toFixed(1)}km`)
    if (data.averageFuelEfficiency > 0) {
      reportLines.push(`- 平均燃費: ${data.averageFuelEfficiency.toFixed(1)}km/L`)
    }
    reportLines.push('')
  })

  // 全体統計
  const totalCost = records.reduce((sum, r) => sum + r.cost, 0)
  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0)
  const avgPrice = totalCost / totalAmount

  reportLines.push('## 全期間統計')
  reportLines.push(`- 総給油回数: ${records.length}回`)
  reportLines.push(`- 総給油量: ${totalAmount.toFixed(1)}L`)
  reportLines.push(`- 総費用: ¥${totalCost.toLocaleString()}`)
  reportLines.push(`- 全期間平均単価: ¥${avgPrice.toFixed(1)}/L`)

  const reportContent = reportLines.join('\n')
  const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' })
  
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `燃費月次レポート_${new Date().toISOString().slice(0, 10)}.txt`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}