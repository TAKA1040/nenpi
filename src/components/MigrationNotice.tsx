import { ArrowRight, Package, Zap, Shield, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function MigrationNotice() {
  const handleMigrate = () => {
    window.location.href = 'https://tasuku.apaf.me/tools/nenpi'
  }

  const handleLoginFirst = () => {
    window.location.href = 'https://tasuku.apaf.me/login'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-6">
        {/* Main Card */}
        <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mb-4 flex justify-center">
              <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full">
                <Package className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ⛽ 燃費記録アプリが移転しました
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              tasukuアプリに統合され、より便利になりました
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    統合管理
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    タスクと燃費記録を一つのアプリで
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    安全な認証
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ユーザー別の完全なデータ保護
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    機能向上
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    継続的なアップデートとサポート
                  </p>
                </div>
              </div>
            </div>

            {/* Migration Steps */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">
                ✅ データ移行について
              </h3>
              <div className="space-y-3 text-gray-700 dark:text-gray-300">
                <p className="font-semibold text-green-700 dark:text-green-400">
                  既存のユーザーのデータは移行完了済みです！
                </p>
                <p>
                  これまでの給油記録は、tasukuの燃費記録ページですぐにご確認いただけます。
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>過去の給油履歴すべて</li>
                  <li>燃費の計算結果</li>
                  <li>スタンド名の履歴</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleMigrate}
                size="lg"
                className="flex-1 text-lg py-6"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                新しい燃費記録ページへ
              </Button>
              <Button
                onClick={handleLoginFirst}
                variant="outline"
                size="lg"
                className="flex-1 text-lg py-6"
              >
                先にログイン
              </Button>
            </div>

            {/* Note */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">💡 新機能:</span>
                スタンド名のオートコンプリート、日付の自動入力など、より使いやすくなりました！
                詳しくは使い方マニュアルをご覧ください。
              </p>
            </div>

            {/* URLs */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p>
                新しいURL:{' '}
                <a
                  href="https://tasuku.apaf.me/tools/nenpi"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  tasuku.apaf.me/tools/nenpi
                </a>
              </p>
              <p>
                ログイン:{' '}
                <a
                  href="https://tasuku.apaf.me/login"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  tasuku.apaf.me/login
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>このページ（nenpi.apaf.me）は案内専用です</p>
          <p className="mt-1">今後は tasuku.apaf.me をご利用ください</p>
        </div>
      </div>
    </div>
  )
}
