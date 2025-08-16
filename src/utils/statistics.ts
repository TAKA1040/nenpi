import { FuelRecord } from '../components/FuelCalculator'

export interface StatisticsData {
  totalRecords: number
  totalCost: number
  totalAmount: number
  totalDistance: number
  averageFuelEfficiency: number
  averagePrice: number
  averageCostPerMonth: number
  averageAmountPerFillup: number
  bestFuelEfficiency: number
  worstFuelEfficiency: number
  cheapestPrice: number
  expensivePrice: number
  firstRecord?: FuelRecord
  latestRecord?: FuelRecord
  monthlyStats: MonthlyStats[]
  stationStats: StationStats[]
  trends: TrendData
}

export interface MonthlyStats {
  month: string
  displayMonth: string
  recordCount: number
  totalCost: number
  totalAmount: number
  totalDistance: number
  averageFuelEfficiency: number
  averagePrice: number
  costPerKm: number
}

export interface StationStats {
  station: string
  recordCount: number
  totalCost: number
  totalAmount: number
  averagePrice: number
  lastVisit: string
  fuelEfficiency: number
}

export interface TrendData {
  priceChange: number // 前月比価格変動（円/L）
  efficiencyChange: number // 前月比燃費変動（km/L）
  costChange: number // 前月比コスト変動（円）
  isImprovingEfficiency: boolean
  isPriceIncreasing: boolean
}

export const calculateStatistics = (records: FuelRecord[]): StatisticsData => {
  if (records.length === 0) {
    return {
      totalRecords: 0,
      totalCost: 0,
      totalAmount: 0,
      totalDistance: 0,
      averageFuelEfficiency: 0,
      averagePrice: 0,
      averageCostPerMonth: 0,
      averageAmountPerFillup: 0,
      bestFuelEfficiency: 0,
      worstFuelEfficiency: 0,
      cheapestPrice: 0,
      expensivePrice: 0,
      monthlyStats: [],
      stationStats: [],
      trends: {
        priceChange: 0,
        efficiencyChange: 0,
        costChange: 0,
        isImprovingEfficiency: false,
        isPriceIncreasing: false
      }
    }
  }

  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date))
  
  // 基本統計
  const totalCost = sortedRecords.reduce((sum, r) => sum + r.cost, 0)
  const totalAmount = sortedRecords.reduce((sum, r) => sum + r.amount, 0)
  const averagePrice = totalCost / totalAmount
  const averageAmountPerFillup = totalAmount / sortedRecords.length

  // 燃費計算
  const fuelEfficiencies: number[] = []
  let totalDistance = 0
  
  for (let i = 1; i < sortedRecords.length; i++) {
    const current = sortedRecords[i]
    const previous = sortedRecords[i - 1]
    const distance = current.mileage - previous.mileage
    
    if (distance > 0) {
      totalDistance += distance
      const efficiency = distance / current.amount
      fuelEfficiencies.push(efficiency)
    }
  }

  const averageFuelEfficiency = fuelEfficiencies.length > 0 
    ? fuelEfficiencies.reduce((sum, eff) => sum + eff, 0) / fuelEfficiencies.length 
    : 0

  const bestFuelEfficiency = fuelEfficiencies.length > 0 ? Math.max(...fuelEfficiencies) : 0
  const worstFuelEfficiency = fuelEfficiencies.length > 0 ? Math.min(...fuelEfficiencies) : 0

  // 価格統計
  const prices = sortedRecords.map(r => r.cost / r.amount)
  const cheapestPrice = Math.min(...prices)
  const expensivePrice = Math.max(...prices)

  // 月間統計計算
  const monthlyStats = calculateMonthlyStats(sortedRecords)
  
  // スタンド統計計算
  const stationStats = calculateStationStats(sortedRecords)

  // トレンド計算
  const trends = calculateTrends(monthlyStats)

  // 月平均コスト
  const monthCount = monthlyStats.length || 1
  const averageCostPerMonth = totalCost / monthCount

  return {
    totalRecords: sortedRecords.length,
    totalCost,
    totalAmount,
    totalDistance,
    averageFuelEfficiency,
    averagePrice,
    averageCostPerMonth,
    averageAmountPerFillup,
    bestFuelEfficiency,
    worstFuelEfficiency,
    cheapestPrice,
    expensivePrice,
    firstRecord: sortedRecords[0],
    latestRecord: sortedRecords[sortedRecords.length - 1],
    monthlyStats,
    stationStats,
    trends
  }
}

const calculateMonthlyStats = (sortedRecords: FuelRecord[]): MonthlyStats[] => {
  const monthlyMap: Record<string, {
    records: FuelRecord[]
    totalCost: number
    totalAmount: number
    totalDistance: number
  }> = {}

  // 月別にグループ化
  sortedRecords.forEach((record, index) => {
    const month = record.date.substring(0, 7)
    if (!monthlyMap[month]) {
      monthlyMap[month] = {
        records: [],
        totalCost: 0,
        totalAmount: 0,
        totalDistance: 0
      }
    }
    monthlyMap[month].records.push(record)
    monthlyMap[month].totalCost += record.cost
    monthlyMap[month].totalAmount += record.amount

    // 距離計算（前のレコードとの差）
    if (index > 0) {
      const prevRecord = sortedRecords[index - 1]
      const distance = record.mileage - prevRecord.mileage
      if (distance > 0) {
        monthlyMap[month].totalDistance += distance
      }
    }
  })

  // 統計を計算
  return Object.entries(monthlyMap)
    .map(([month, data]) => {
      const averagePrice = data.totalCost / data.totalAmount
      const averageFuelEfficiency = data.totalAmount > 0 && data.totalDistance > 0 
        ? data.totalDistance / data.totalAmount 
        : 0
      const costPerKm = data.totalDistance > 0 ? data.totalCost / data.totalDistance : 0

      return {
        month,
        displayMonth: month.replace('-', '年') + '月',
        recordCount: data.records.length,
        totalCost: data.totalCost,
        totalAmount: data.totalAmount,
        totalDistance: data.totalDistance,
        averageFuelEfficiency,
        averagePrice,
        costPerKm
      }
    })
    .sort((a, b) => a.month.localeCompare(b.month))
}

const calculateStationStats = (sortedRecords: FuelRecord[]): StationStats[] => {
  const stationMap: Record<string, {
    records: FuelRecord[]
    totalCost: number
    totalAmount: number
    totalDistance: number
    lastVisit: string
  }> = {}

  sortedRecords.forEach((record, index) => {
    if (!stationMap[record.station]) {
      stationMap[record.station] = {
        records: [],
        totalCost: 0,
        totalAmount: 0,
        totalDistance: 0,
        lastVisit: record.date
      }
    }

    const station = stationMap[record.station]
    station.records.push(record)
    station.totalCost += record.cost
    station.totalAmount += record.amount
    station.lastVisit = record.date // 最後のレコードが最新

    // このスタンドでの給油後の燃費計算
    if (index < sortedRecords.length - 1) {
      const nextRecord = sortedRecords[index + 1]
      const distance = nextRecord.mileage - record.mileage
      if (distance > 0) {
        station.totalDistance += distance
      }
    }
  })

  return Object.entries(stationMap)
    .map(([station, data]) => ({
      station,
      recordCount: data.records.length,
      totalCost: data.totalCost,
      totalAmount: data.totalAmount,
      averagePrice: data.totalCost / data.totalAmount,
      lastVisit: data.lastVisit,
      fuelEfficiency: data.totalAmount > 0 && data.totalDistance > 0 
        ? data.totalDistance / data.totalAmount 
        : 0
    }))
    .sort((a, b) => b.recordCount - a.recordCount) // 利用回数順
}

const calculateTrends = (monthlyStats: MonthlyStats[]): TrendData => {
  if (monthlyStats.length < 2) {
    return {
      priceChange: 0,
      efficiencyChange: 0,
      costChange: 0,
      isImprovingEfficiency: false,
      isPriceIncreasing: false
    }
  }

  const latest = monthlyStats[monthlyStats.length - 1]
  const previous = monthlyStats[monthlyStats.length - 2]

  const priceChange = latest.averagePrice - previous.averagePrice
  const efficiencyChange = latest.averageFuelEfficiency - previous.averageFuelEfficiency
  const costChange = latest.totalCost - previous.totalCost

  return {
    priceChange,
    efficiencyChange,
    costChange,
    isImprovingEfficiency: efficiencyChange > 0,
    isPriceIncreasing: priceChange > 0
  }
}

export const formatCurrency = (amount: number): string => {
  return `¥${amount.toLocaleString()}`
}

export const formatDistance = (distance: number): string => {
  return `${distance.toFixed(1)}km`
}

export const formatFuelEfficiency = (efficiency: number): string => {
  return `${efficiency.toFixed(1)}km/L`
}

export const formatPrice = (price: number): string => {
  return `¥${price.toFixed(1)}/L`
}

export const getEfficiencyGrade = (efficiency: number): string => {
  if (efficiency >= 20) return 'A+'
  if (efficiency >= 18) return 'A'
  if (efficiency >= 16) return 'B+'
  if (efficiency >= 14) return 'B'
  if (efficiency >= 12) return 'C+'
  if (efficiency >= 10) return 'C'
  return 'D'
}

export const getEfficiencyColor = (efficiency: number): string => {
  if (efficiency >= 18) return 'text-green-600'
  if (efficiency >= 15) return 'text-blue-600'
  if (efficiency >= 12) return 'text-yellow-600'
  return 'text-red-600'
}