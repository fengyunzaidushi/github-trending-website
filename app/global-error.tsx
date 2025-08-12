'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 记录错误到控制台
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <div className="text-6xl mb-4">💥</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                应用出现错误
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                抱歉，应用遇到了意外错误。这可能是由于网络连接或服务器问题导致的。
              </p>
              <div className="space-y-3">
                <button
                  onClick={reset}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                >
                  🔄 重新尝试
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  🔃 刷新页面
                </button>
              </div>
              <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                <details>
                  <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                    查看错误详情
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-left text-xs">
                    <strong>错误信息:</strong> {error.message}<br/>
                    {error.digest && (
                      <>
                        <strong>错误ID:</strong> {error.digest}<br/>
                      </>
                    )}
                    <strong>错误堆栈:</strong>
                    <pre className="whitespace-pre-wrap mt-1">
                      {error.stack}
                    </pre>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}