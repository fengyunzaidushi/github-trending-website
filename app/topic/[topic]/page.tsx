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
  const [repositories, setRepositories] = useState<TopicRepository[]>([])
  const [readmeContents, setReadmeContents] = useState<Record<number, { content: string; preview: string; expanded: boolean }>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState('all')
  const [selectedDate, setSelectedDate] = useState('all')
  const [languages, setLanguages] = useState<string[]>([])
  const [dates, setDates] = useState<string[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchRepositories()
  }, [topic, selectedLanguage, selectedDate])

  const fetchRepositories = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        language: selectedLanguage,
        date: selectedDate
      })
      
      const response = await fetch(`/api/topics/${encodeURIComponent(topic)}?${params}`)
      
      if (!response.ok) {
        throw new Error('获取仓库列表失败')
      }

      const data: TopicRepositoriesResponse = await response.json()
      setRepositories(data.data)
      setLanguages(data.languages)
      setDates(data.dates)
      setTotal(data.total)
      
      // 预加载README内容
      data.data.forEach(repo => {
        fetchReadmeContent(repo.id, repo.owner, repo.name)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  const fetchReadmeContent = async (repoId: number, owner: string, repoName: string) => {
    try {
      const response = await fetch(`/api/readme?owner=${owner}&repo=${repoName}`)
      const data = await response.json()
      
      setReadmeContents(prev => ({
        ...prev,
        [repoId]: {
          content: data.content || '该仓库没有README文件',
          preview: data.preview || '该仓库没有README文件',
          expanded: false
        }
      }))
    } catch (error) {
      setReadmeContents(prev => ({
        ...prev,
        [repoId]: {
          content: '获取README失败',
          preview: '获取README失败',
          expanded: false
        }
      }))
    }
  }

  const toggleReadmeExpansion = (repoId: number) => {
    setReadmeContents(prev => ({
      ...prev,
      [repoId]: {
        ...prev[repoId],
        expanded: !prev[repoId]?.expanded
      }
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

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
              onClick={fetchRepositories}
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
            共找到 {total} 个相关仓库
          </p>
        </div>

        {/* 筛选控件 */}
        <div className="mb-6 flex flex-wrap gap-4">
          {/* 语言筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              编程语言
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部语言</option>
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          {/* 日期筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              创建日期
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部日期</option>
              {dates.map(date => (
                <option key={date} value={date}>{formatDate(date)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：仓库列表 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              仓库列表
            </h2>
            {repositories.map((repo) => (
              <div
                key={repo.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
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

                <div className="flex flex-wrap gap-2 mb-3">
                  {repo.topics.map(topicName => (
                    <Link
                      key={topicName}
                      href={`/topic/${encodeURIComponent(topicName)}`}
                      className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      #{topicName}
                    </Link>
                  ))}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  创建于 {formatDate(repo.created_at)}
                </p>
              </div>
            ))}
          </div>

          {/* 右侧：README内容 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              README 预览
            </h2>
            {repositories.map((repo) => {
              const readmeData = readmeContents[repo.id]
              return (
                <div
                  key={`readme-${repo.id}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {repo.name}
                  </h3>
                  
                  {readmeData ? (
                    <div>
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 mb-3 font-mono">
                        {readmeData.expanded ? readmeData.content : readmeData.preview}
                      </pre>
                      
                      {readmeData.content !== readmeData.preview && (
                        <button
                          onClick={() => toggleReadmeExpansion(repo.id)}
                          className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                        >
                          {readmeData.expanded ? '收起' : '展开'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-xs text-gray-500">加载中...</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}