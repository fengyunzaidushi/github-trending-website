'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Avatar from 'boring-avatars'
import { UserRepository } from '@/types/database'

// 扩展类型以包含用户信息
interface RepoWithUser extends UserRepository {
  user: {
    login: string
    name: string | null
    avatar_url: string | null
    type: 'User' | 'Organization'
  }
}

interface RepoCardProps {
  repo: RepoWithUser
}

function RepoCard({ repo }: RepoCardProps) {
  const [avatarError, setAvatarError] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            {repo.user.avatar_url && !avatarError ? (
              <img
                src={repo.user.avatar_url}
                alt={`${repo.user.login}的头像`}
                className="w-8 h-8 rounded-full"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <Avatar
                size={32}
                name={repo.user.login}
                variant="beam"
                colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
                square={false}
              />
            )}
            <Link 
              href={`/user/${repo.user.login}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {repo.user.name || repo.user.login}
            </Link>
            <span className={`px-2 py-1 text-xs rounded-full ${
              repo.user.type === 'Organization' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            }`}>
              {repo.user.type === 'Organization' ? '组织' : '用户'}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            <a 
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400"
            >
              {repo.name}
            </a>
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {repo.full_name}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="flex items-center">
            ⭐ {repo.stargazers_count.toLocaleString()}
          </span>
        </div>
      </div>
      
      {repo.description && (
        <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-2">
          {repo.description}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm">
          {repo.language && (
            <span className="flex items-center text-gray-600 dark:text-gray-400">
              <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
              {repo.language}
            </span>
          )}
          <span className="text-gray-600 dark:text-gray-400">
            {(repo.size / 1024).toFixed(1)} MB
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-500">
          <div>创建于 {new Date(repo.created_at).toLocaleDateString()}</div>
          <div>更新于 {new Date(repo.updated_at).toLocaleDateString()}</div>
        </div>
      </div>
      
      {repo.topics && repo.topics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {repo.topics.slice(0, 5).map((topic) => (
            <span
              key={topic}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
            >
              {topic}
            </span>
          ))}
          {repo.topics.length > 5 && (
            <span className="text-xs text-gray-500 dark:text-gray-500">
              +{repo.topics.length - 5} 更多
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default function ReposPage() {
  const [repositories, setRepositories] = useState<RepoWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [limit] = useState(20)
  const [filters, setFilters] = useState({
    language: '',
    min_stars: 0,
    sort: 'stars',
    order: 'desc',
    user_type: '', // 用户类型筛选
    user_login: '' // 用户名筛选
  })

  const fetchRepositories = useCallback(async () => {
    try {
      setLoading(true)
      const searchParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        sort: filters.sort,
        order: filters.order,
        min_stars: filters.min_stars.toString()
      })
      
      if (filters.language) {
        searchParams.append('language', filters.language)
      }
      if (filters.user_type) {
        searchParams.append('user_type', filters.user_type)
      }
      if (filters.user_login) {
        searchParams.append('user_login', filters.user_login)
      }

      const response = await fetch(`/api/repos?${searchParams}`)
      
      if (!response.ok) {
        throw new Error('获取仓库列表失败')
      }

      const data = await response.json() as {
        repositories: RepoWithUser[];
        pagination: { total: number };
      }
      setRepositories(data.repositories)
      setTotal(data.pagination.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }, [limit, offset, filters])

  useEffect(() => {
    fetchRepositories()
  }, [fetchRepositories])

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setOffset(0)
  }

  const handlePrevPage = () => {
    setOffset(Math.max(0, offset - limit))
  }

  const handleNextPage = () => {
    if (offset + limit < total) {
      setOffset(offset + limit)
    }
  }

  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(total / limit)

  if (loading && repositories.length === 0) {
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
            <p className="text-red-600 dark:text-red-400">❌ {error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            所有仓库
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            浏览所有仓库和对应的用户信息（共 {total.toLocaleString()} 个仓库）
          </p>
        </div>

        {/* 筛选器 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">筛选选项</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                用户名
              </label>
              <input
                type="text"
                value={filters.user_login}
                onChange={(e) => handleFilterChange({ user_login: e.target.value })}
                placeholder="搜索用户..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                用户类型
              </label>
              <select
                value={filters.user_type}
                onChange={(e) => handleFilterChange({ user_type: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">全部类型</option>
                <option value="User">用户</option>
                <option value="Organization">组织</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                编程语言
              </label>
              <input
                type="text"
                value={filters.language}
                onChange={(e) => handleFilterChange({ language: e.target.value })}
                placeholder="如: JavaScript"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                最少Stars
              </label>
              <input
                type="number"
                value={filters.min_stars}
                onChange={(e) => handleFilterChange({ min_stars: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                排序
              </label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange({ sort: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="stars">Stars数</option>
                <option value="updated">更新时间</option>
                <option value="created">创建时间</option>
                <option value="name">名称</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                顺序
              </label>
              <select
                value={filters.order}
                onChange={(e) => handleFilterChange({ order: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
            </div>
          </div>
        </div>

        {/* 仓库列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              仓库列表
            </h2>
            {loading && (
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                加载中...
              </div>
            )}
          </div>

          <div className="space-y-4 mb-6">
            {repositories.map((repo) => (
              <RepoCard key={repo.github_id} repo={repo} />
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                显示第 {offset + 1} - {Math.min(offset + limit, total)} 条，共 {total.toLocaleString()} 条记录
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrevPage}
                  disabled={offset === 0}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
                  第 {currentPage} 页，共 {totalPages} 页
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={offset + limit >= total}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          )}

          {repositories.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">没有找到匹配的仓库</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}