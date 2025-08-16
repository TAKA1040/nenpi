import React from 'react'
import { BarChart3, TrendingUp, TrendingDown, AlertCircle, Target, Award, DollarSign, Gauge } from 'lucide-react'
import { StatisticsData, formatCurrency, formatFuelEfficiency, formatPrice, getEfficiencyGrade, getEfficiencyColor } from '@/utils/statistics'
import { FuelRecord } from './FuelCalculator'

interface DashboardProps {
  statistics: StatisticsData
  records: FuelRecord[]
  fuelEfficiencyGoal: number
  monthlyBudget: number
}

const Dashboard: React.FC<DashboardProps> = ({ 
  statistics, 
  records, 
  fuelEfficiencyGoal, 
  monthlyBudget 
}) => {
  // 最近の傾向を分析
  const getRecentTrend = () => {
    if (records.length < 2) return null
    
    const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date))
    const recent = sortedRecords.slice(-5)
    const older = sortedRecords.slice(-10, -5)
    
    if (recent.length < 2 || older.length < 2) return null

    const calculateAvgEfficiency = (recordList: FuelRecord[]) => {
      const efficiencies: number[] = []
      for (let i = 1; i < recordList.length; i++) {
        const distance = recordList[i].mileage - recordList[i-1].mileage
        if (distance > 0) {
          efficiencies.push(distance / recordList[i].amount)
        }
      }
      return efficiencies.length > 0 ? efficiencies.reduce((sum, eff) => sum + eff, 0) / efficiencies.length : 0
    }

    const recentAvgEfficiency = calculateAvgEfficiency(recent)
    const olderAvgEfficiency = calculateAvgEfficiency(older)
    
    const recentAvgPrice = recent.reduce((sum, r) => sum + (r.cost / r.amount), 0) / recent.length
    const olderAvgPrice = older.reduce((sum, r) => sum + (r.cost / r.amount), 0) / older.length

    return {
      efficiencyImprovement: recentAvgEfficiency - olderAvgEfficiency,
      priceChange: recentAvgPrice - olderAvgPrice,
      isEfficiencyImproving: recentAvgEfficiency > olderAvgEfficiency,
      isPriceIncreasing: recentAvgPrice > olderAvgPrice
    }
  }

  const trend = getRecentTrend()

  // 目標達成度の計算
  const fuelEfficiencyAchievement = statistics.averageFuelEfficiency / fuelEfficiencyGoal
  const budgetAchievement = monthlyBudget / statistics.averageCostPerMonth

  // アラートの生成
  const alerts = []
  if (statistics.averageFuelEfficiency < fuelEfficiencyGoal) {
    alerts.push({
      type: 'warning',
      message: `燃費が目標を${(fuelEfficiencyGoal - statistics.averageFuelEfficiency).toFixed(1)}km/L下回っています`
    })
  }
  if (statistics.averageCostPerMonth > monthlyBudget) {
    alerts.push({
      type: 'danger',
      message: `月間コストが予算を${formatCurrency(statistics.averageCostPerMonth - monthlyBudget)}超過しています`
    })
  }
  if (trend && !trend.isEfficiencyImproving) {
    alerts.push({
      type: 'info',
      message: '最近の燃費が悪化傾向にあります'
    })
  }

  // 推奨アクション
  const recommendations = []
  if (statistics.averageFuelEfficiency < fuelEfficiencyGoal) {
    recommendations.push('エコドライブを心がけましょう（急発進・急ブレーキを避ける）')
    recommendations.push('タイヤの空気圧をチェックしましょう')
    recommendations.push('定期的なメンテナンスを実施しましょう')
  }
  if (statistics.expensivePrice - statistics.cheapestPrice > 20) {
    recommendations.push('価格差の大きいスタンドがあります。安いスタンドを活用しましょう')
  }
  if (statistics.stationStats.length > 3) {
    recommendations.push('利用頻度の高いスタンドでの割引サービスを確認しましょう')
  }

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 燃費スコア */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">燃費スコア</p>
              <p className="text-2xl font-bold text-blue-900">
                {getEfficiencyGrade(statistics.averageFuelEfficiency)}
              </p>
              <p className="text-sm text-blue-600">
                {formatFuelEfficiency(statistics.averageFuelEfficiency)}
              </p>
            </div>
            <Gauge className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-blue-600">
              <span>目標: {fuelEfficiencyGoal}km/L</span>
              <span>{(fuelEfficiencyAchievement * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(fuelEfficiencyAchievement * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* コスト効率 */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">コスト効率</p>
              <p className="text-2xl font-bold text-green-900">
                {budgetAchievement >= 1 ? 'A' : budgetAchievement >= 0.8 ? 'B' : 'C'}
              </p>
              <p className="text-sm text-green-600">
                {formatCurrency(statistics.averageCostPerMonth)}/月
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-green-600">
              <span>予算: {formatCurrency(monthlyBudget)}</span>
              <span>{(budgetAchievement * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2 mt-1">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(budgetAchievement * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 価格トレンド */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">価格動向</p>
              <p className="text-2xl font-bold text-yellow-900 flex items-center">
                {trend?.isPriceIncreasing ? (
                  <TrendingUp className="w-5 h-5 mr-1 text-red-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 mr-1 text-green-500" />
                )}
                {trend?.isPriceIncreasing ? '上昇' : '安定'}
              </p>
              <p className="text-sm text-yellow-600">
                {formatPrice(statistics.averagePrice)}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-yellow-600" />
          </div>
          {trend && (
            <div className="mt-4 text-xs text-yellow-700">
              前回比: {trend.priceChange > 0 ? '+' : ''}{trend.priceChange.toFixed(1)}円/L
            </div>
          )}
        </div>

        {/* 総合評価 */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">総合評価</p>
              <p className="text-2xl font-bold text-purple-900">
                {alerts.length === 0 ? 'A' : alerts.length <= 2 ? 'B' : 'C'}
              </p>
              <p className="text-sm text-purple-600">
                {alerts.length === 0 ? '良好' : alerts.length <= 2 ? '注意' : '要改善'}
              </p>
            </div>
            <Award className="w-8 h-8 text-purple-600" />
          </div>
          <div className="mt-4 text-xs text-purple-700">
            記録数: {statistics.totalRecords}件
          </div>
        </div>
      </div>

      {/* アラートセクション */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <AlertCircle className="mr-2 text-orange-500" />
            注意事項
          </h3>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  alert.type === 'danger' ? 'bg-red-50 border-red-200 text-red-800' :
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                  'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 推奨アクション */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Target className="mr-2 text-green-500" />
            改善提案
          </h3>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 主要統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-800 mb-4">燃費パフォーマンス</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">ベスト記録:</span>
              <span className="font-semibold text-green-600">
                {formatFuelEfficiency(statistics.bestFuelEfficiency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ワースト記録:</span>
              <span className="font-semibold text-red-600">
                {formatFuelEfficiency(statistics.worstFuelEfficiency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">改善余地:</span>
              <span className="font-semibold text-blue-600">
                {formatFuelEfficiency(statistics.bestFuelEfficiency - statistics.averageFuelEfficiency)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-800 mb-4">コスト分析</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">最安単価:</span>
              <span className="font-semibold text-green-600">
                {formatPrice(statistics.cheapestPrice)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">最高単価:</span>
              <span className="font-semibold text-red-600">
                {formatPrice(statistics.expensivePrice)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">価格差:</span>
              <span className="font-semibold text-orange-600">
                {formatPrice(statistics.expensivePrice - statistics.cheapestPrice)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-800 mb-4">利用パターン</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">平均給油間隔:</span>
              <span className="font-semibold text-blue-600">
                {statistics.totalRecords > 1 ? 
                  Math.round((new Date(statistics.latestRecord?.date || '').getTime() - 
                            new Date(statistics.firstRecord?.date || '').getTime()) / 
                           (1000 * 60 * 60 * 24) / (statistics.totalRecords - 1)) + '日'
                  : '-'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">1回平均給油量:</span>
              <span className="font-semibold text-blue-600">
                {statistics.averageAmountPerFillup.toFixed(1)}L
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">よく使うスタンド:</span>
              <span className="font-semibold text-blue-600">
                {statistics.stationStats[0]?.station || '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard