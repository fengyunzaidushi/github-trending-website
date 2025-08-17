'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Topic, TopicListResponse } from '@/types/database'

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 50

  useEffect(() => {
    fetchTopics()
  }, [page])

  const fetchTopics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/topics?page=${page}&pageSize=${pageSize}`)
      
      if (!response.ok) {
        throw new Error('获取话题列表失败')
      }

      const data: TopicListResponse = await response.json()
      setTopics(data.data)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">加载中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchTopics}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            GitHub 热门话题
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            探索 GitHub 上最受欢迎的项目话题，发现感兴趣的开源项目
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/topic/${encodeURIComponent(topic.name)}`}
              className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
            >
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 truncate">
                  {topic.display_name || topic.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {topic.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
                    #{topic.name}
                  </span>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 分页控件 */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                上一页
              </button>
              
              <span className="px-3 py-2 text-gray-700 dark:text-gray-300">
                第 {page} 页，共 {totalPages} 页
              </span>
              
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                下一页
              </button>
            </div>
          </div>
        )}

        {/* 统计信息 */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          共找到 {total} 个话题
        </div>
      </div>
    </div>
  )
}