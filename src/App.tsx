import { useEffect } from 'react'

function App() {
  useEffect(() => {
    // 自動的に新しいページにリダイレクト
    window.location.href = 'https://tasuku.apaf.me/tools/nenpi'
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-4 text-6xl">⛽</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          移転しました
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          新しいページに移動しています...
        </p>
        <a
          href="https://tasuku.apaf.me/tools/nenpi"
          className="inline-block mt-4 text-blue-600 hover:text-blue-700 underline"
        >
          自動で移動しない場合はこちらをクリック
        </a>
      </div>
    </div>
  )
}

export default App