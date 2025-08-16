import React, { useState, useEffect } from 'react';
import { Calendar, Car, DollarSign, Plus, Trash2 } from 'lucide-react';

const FuelCalculator = () => {
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState({
    date: '',
    amount: '',
    cost: '',
    mileage: '',
    station: ''
  });

  // スタンド名のマスターリスト
  const [stationList, setStationList] = useState([]);
  const [isAddingNewStation, setIsAddingNewStation] = useState(false);
  const [newStationName, setNewStationName] = useState('');

  const addNewStation = () => {
    if (!newStationName.trim()) {
      alert('スタンド名を入力してください');
      return;
    }
    
    if (stationList.includes(newStationName.trim())) {
      alert('このスタンド名は既に登録されています');
      return;
    }
    
    setStationList([...stationList, newStationName.trim()]);
    setFormData({...formData, station: newStationName.trim()});
    setNewStationName('');
    setIsAddingNewStation(false);
  };

  const addRecord = () => {
    if (!formData.date || !formData.amount || !formData.cost || !formData.mileage || !formData.station) {
      alert('すべての項目を入力してください');
      return;
    }

    // スタンド名をリストに追加（重複チェック）
    if (!stationList.includes(formData.station)) {
      setStationList([...stationList, formData.station]);
    }

    const newRecord = {
      id: Date.now(),
      date: formData.date,
      amount: parseFloat(formData.amount),
      cost: parseFloat(formData.cost),
      mileage: parseFloat(formData.mileage),
      station: formData.station,
      pricePerLiter: parseFloat(formData.cost) / parseFloat(formData.amount)
    };

    const updatedRecords = [...records, newRecord].sort((a, b) => new Date(a.date) - new Date(b.date));
    setRecords(updatedRecords);
    setFormData({ date: '', amount: '', cost: '', mileage: '', station: '' });
  };

  const deleteRecord = (id) => {
    setRecords(records.filter(record => record.id !== id));
  };

  // 燃費を計算（前回の走行距離との差分から）
  const calculateFuelEfficiency = (currentRecord, previousRecord) => {
    if (!previousRecord) return null;
    const distance = currentRecord.mileage - previousRecord.mileage;
    if (distance <= 0) return null;
    return distance / currentRecord.amount;
  };

  // 月別データを集計
  const getMonthlyData = () => {
    const monthlyMap = {};
    
    records.forEach((record, index) => {
      const month = record.date.substring(0, 7); // YYYY-MM
      if (!monthlyMap[month]) {
        monthlyMap[month] = {
          month,
          totalCost: 0,
          totalAmount: 0,
          records: []
        };
      }
      
      monthlyMap[month].totalCost += record.cost;
      monthlyMap[month].totalAmount += record.amount;
      monthlyMap[month].records.push({
        ...record,
        fuelEfficiency: calculateFuelEfficiency(record, records[index - 1])
      });
    });

    return Object.values(monthlyMap).sort((a, b) => b.month.localeCompare(a.month));
  };

  const monthlyData = getMonthlyData();

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <Car className="mr-3 text-blue-600" />
          燃費計算アプリ
        </h1>

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
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                スタンド名
              </label>
              <div className="relative">
                {isAddingNewStation ? (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newStationName}
                      onChange={(e) => setNewStationName(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="新しいスタンド名"
                      onKeyPress={(e) => e.key === 'Enter' && addNewStation()}
                    />
                    <button
                      onClick={addNewStation}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      追加
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingNewStation(false);
                        setNewStationName('');
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
                      onChange={(e) => setFormData({...formData, station: e.target.value})}
                      className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">スタンドを選択</option>
                      {stationList.map((station, index) => (
                        <option key={index} value={station}>{station}</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                給油量（L）
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
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
                onChange={(e) => setFormData({...formData, cost: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="例: 6500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                走行距離（km）
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.mileage}
                onChange={(e) => setFormData({...formData, mileage: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="例: 12500.0"
              />
            </div>
          </div>
          <button
            onClick={addRecord}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            記録を追加
          </button>
        </div>

        {/* 月別燃費表 */}
        {monthlyData.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 p-4 border-b">月別燃費表</h2>
            {monthlyData.map(month => (
              <div key={month.month} className="border-b last:border-b-0">
                <div className="bg-gray-50 p-4">
                  <h3 className="text-lg font-medium text-gray-800">
                    {month.month.replace('-', '年')}月
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 text-sm">
                    <div>
                      <span className="font-medium">月のガソリン代:</span>
                      <span className="ml-2 text-red-600 font-bold">
                        ¥{month.totalCost.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">給油量合計:</span>
                      <span className="ml-2 text-blue-600 font-bold">
                        {month.totalAmount.toFixed(1)}L
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">平均単価:</span>
                      <span className="ml-2 text-green-600 font-bold">
                        ¥{(month.totalCost / month.totalAmount).toFixed(1)}/L
                      </span>
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
                        {month.records.map(record => (
                          <tr key={record.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">{record.date}</td>
                            <td className="p-2">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                {record.station}
                              </span>
                            </td>
                            <td className="text-right p-2">{record.amount.toFixed(1)}</td>
                            <td className="text-right p-2">¥{record.cost.toLocaleString()}</td>
                            <td className="text-right p-2">¥{record.pricePerLiter.toFixed(1)}</td>
                            <td className="text-right p-2">{record.mileage.toFixed(1)}</td>
                            <td className="text-right p-2">
                              {record.fuelEfficiency ? 
                                <span className="font-medium text-green-600">
                                  {record.fuelEfficiency.toFixed(1)}
                                </span> : 
                                <span className="text-gray-400">-</span>
                              }
                            </td>
                            <td className="text-center p-2">
                              <button
                                onClick={() => deleteRecord(record.id)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="削除"
                              >
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

        {records.length === 0 && (
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
              <li>• データはページを閉じるまで保存されます</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default FuelCalculator;