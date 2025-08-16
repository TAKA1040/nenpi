import React from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { FuelRecord } from './FuelCalculator'
import { StatisticsData, formatCurrency, formatFuelEfficiency, formatPrice } from '@/utils/statistics'

interface ChartsProps {
  records: FuelRecord[]
  statistics: StatisticsData
}

const Charts: React.FC<ChartsProps> = ({ records }) => {
  // 燃費推移データを生成
  const fuelEfficiencyData = records.map((record, index) => {
    const prevRecord = index > 0 ? records[index - 1] : null
    const efficiency = prevRecord 
      ? (record.mileage - prevRecord.mileage) / record.amount
      : null
    
    return {
      date: record.date,
      efficiency: efficiency && efficiency > 0 ? efficiency : null,
      amount: record.amount,
      cost: record.cost,
      pricePerLiter: record.cost / record.amount
    }
  })

  // 月別データを生成
  const monthlyDataMap: Record<string, any> = {}

  records.forEach((record, index) => {
    const month = record.date.substring(0, 7)
    if (!monthlyDataMap[month]) {
      monthlyDataMap[month] = {
        month,
        totalCost: 0,
        totalAmount: 0,
        fillUps: 0,
        efficiencies: [],
        prices: []
      }
    }

    monthlyDataMap[month].totalCost += record.cost
    monthlyDataMap[month].totalAmount += record.amount
    monthlyDataMap[month].fillUps += 1
    monthlyDataMap[month].prices.push(record.cost / record.amount)

    if (index > 0) {
      const prevRecord = records[index - 1]
      const distance = record.mileage - prevRecord.mileage
      if (distance > 0) {
        const efficiency = distance / record.amount
        if (efficiency > 0) {
          monthlyDataMap[month].efficiencies.push(efficiency)
        }
      }
    }
  })

  const monthlyData = Object.values(monthlyDataMap)
    .map((data: any) => ({
      month: data.month.replace('-', '/'),
      totalCost: data.totalCost,
      totalAmount: data.totalAmount,
      averagePrice: data.prices.reduce((sum: number, price: number) => sum + price, 0) / data.prices.length,
      averageEfficiency: data.efficiencies.length > 0 
        ? data.efficiencies.reduce((sum: number, eff: number) => sum + eff, 0) / data.efficiencies.length
        : 0,
      fillUps: data.fillUps
    }))
    .sort((a, b) => a.month.localeCompare(b.month))

  // スタンド別データを生成
  const stationDataMap: Record<string, any> = {}
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6']

  records.forEach((record) => {
    if (!stationDataMap[record.station]) {
      stationDataMap[record.station] = {
        station: record.station,
        count: 0,
        totalCost: 0,
        totalAmount: 0
      }
    }

    const stationData = stationDataMap[record.station]
    stationData.count += 1
    stationData.totalCost += record.cost
    stationData.totalAmount += record.amount
  })

  const stationData = Object.values(stationDataMap)
    .map((data: any, index) => ({
      station: data.station,
      count: data.count,
      totalCost: data.totalCost,
      averagePrice: data.totalCost / data.totalAmount,
      fill: colors[index % colors.length]
    }))
    .sort((a, b) => b.count - a.count)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === 'efficiency' && entry.value ? 
                `${entry.name}: ${formatFuelEfficiency(entry.value)}` :
              entry.dataKey === 'totalCost' ?
                `${entry.name}: ${formatCurrency(entry.value)}` :
              entry.dataKey === 'averagePrice' || entry.dataKey === 'pricePerLiter' ?
                `${entry.name}: ${formatPrice(entry.value)}` :
                `${entry.name}: ${entry.value}`
              }
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* 燃費推移グラフ */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">燃費推移</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={fuelEfficiencyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => value.substring(5)}
            />
            <YAxis 
              domain={['dataMin - 1', 'dataMax + 1']}
              tickFormatter={(value) => `${value.toFixed(1)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="efficiency" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2 }}
              connectNulls={false}
              name="燃費"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 月別コストと燃費 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">月別コストと燃費</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="cost" orientation="left" tickFormatter={(value) => `¥${(value/1000).toFixed(0)}k`} />
            <YAxis yAxisId="efficiency" orientation="right" tickFormatter={(value) => `${value.toFixed(1)}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              yAxisId="cost"
              type="monotone"
              dataKey="totalCost"
              stackId="1"
              stroke="#EF4444"
              fill="#FEE2E2"
              name="月間コスト"
            />
            <Line
              yAxisId="efficiency"
              type="monotone"
              dataKey="averageEfficiency"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ fill: '#10B981' }}
              name="平均燃費"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 価格推移 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">単価推移</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={fuelEfficiencyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => value.substring(5)}
              />
              <YAxis 
                domain={['dataMin - 5', 'dataMax + 5']}
                tickFormatter={(value) => `¥${value.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="pricePerLiter" 
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={{ fill: '#F59E0B', strokeWidth: 2 }}
                name="単価"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* スタンド別利用回数 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">スタンド別利用回数</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ station, count, percent }) => 
                  (percent || 0) > 0.05 ? `${station} (${count})` : ''
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {stationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 月別詳細データ */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">月別給油回数と平均単価</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="fillUps" orientation="left" />
            <YAxis yAxisId="price" orientation="right" tickFormatter={(value) => `¥${value.toFixed(0)}`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              yAxisId="fillUps" 
              dataKey="fillUps" 
              fill="#8B5CF6" 
              name="給油回数"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="averagePrice"
              stroke="#EC4899"
              strokeWidth={2}
              dot={{ fill: '#EC4899' }}
              name="平均単価"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default Charts