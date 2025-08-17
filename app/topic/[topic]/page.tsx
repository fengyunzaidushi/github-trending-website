'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { TopicRepository, TopicRepositoriesResponse } from '@/types/database'

interface Props {
  params: Promise<{ topic: string }>
}

export default function TopicDetailPage({ params }: Props) {
  const resolvedParams = use(params)
  const topic = decodeURIComponent(resolvedParams.topic)
  const [data, setData] = useState<TopicRepositoriesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/topics/${encodeURIComponent(topic)}`)
        
        if (!response.ok) {
          throw new Error('获取数据失败')
        }

        const result: TopicRepositoriesResponse = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [topic])

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
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">没有数据</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* 头部信息 */}
        <div className="mb-8">
          <nav className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <Link href="/topic" className="hover:text-blue-600 dark:hover:text-blue-400">
              话题列表
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 dark:text-white">{topic}</span>
          </nav>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            #{topic}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            共找到 {data.total} 个相关仓库
          </p>
        </div>

        {/* 仓库列表 */}
        <div className="space-y-6">
          {data.data.map((repo) => (
            <div
              key={repo.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold">
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {repo.name}
                  </a>
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {repo.stargazers_count}
                  </span>
                  {repo.language && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      {repo.language}
                    </span>
                  )}
                </div>
              </div>

              {repo.description && (
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  {repo.description}
                </p>
              )}

              {repo.zh_description && (
                <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">
                  {repo.zh_description}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {repo.topics.slice(0, 6).map(topicName => (
                  <Link
                    key={topicName}
                    href={`/topic/${encodeURIComponent(topicName)}`}
                    className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    #{topicName}
                  </Link>
                ))}
                {repo.topics.length > 6 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{repo.topics.length - 6} 更多
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>创建于 {new Date(repo.created_at).toLocaleDateString('zh-CN')}</span>
                <span>大小: {(repo.size / 1024).toFixed(1)}KB</span>
              </div>
            </div>
          ))}
          
          {/* 空状态 */}
          {data.data.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8l-2-2m0 0l-2 2m2-2v6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">暂无相关仓库</h3>
              <p className="text-gray-500 dark:text-gray-400">
                当前话题下没有找到相关的仓库项目
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}