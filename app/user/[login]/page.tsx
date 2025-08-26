'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Avatar from 'boring-avatars'
import { UserResponse, UserRepositoriesResponse, UserRepository } from '@/types/database'

interface RepoCardProps {
  repo: UserRepository
}

function RepoCard({ repo }: RepoCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
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

export default function UserPage({ params }: { params: Promise<{ login: string }> }) {
  const [user, setUser] = useState<UserResponse['user'] | null>(null)
  const [repositories, setRepositories] = useState<UserRepository[]>([])
  const [loading, setLoading] = useState(true)
  const [reposLoading, setReposLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reposTotal, setReposTotal] = useState(0)
  const [reposOffset, setReposOffset] = useState(0)
  const [reposLimit] = useState(20)
  const [avatarError, setAvatarError] = useState(false)
  const [filters, setFilters] = useState({
    language: '',
    min_stars: 0,
    sort: 'stars',
    order: 'desc'
  })

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true)
      const { login } = await params
      const response = await fetch(`/api/user/${login}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('用户不存在')
        }
        throw new Error('获取用户信息失败')
      }

      const data: UserResponse = await response.json()
      setUser(data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }, [params])

  const fetchRepositories = useCallback(async () => {
    try {
      setReposLoading(true)
      const { login } = await params
      const searchParams = new URLSearchParams({
        limit: reposLimit.toString(),
        offset: reposOffset.toString(),
        sort: filters.sort,
        order: filters.order,
        min_stars: filters.min_stars.toString()
      })
      
      if (filters.language) {
        searchParams.append('language', filters.language)
      }

      const response = await fetch(`/api/user/${login}/repos?${searchParams}`)
      
      if (!response.ok) {
        throw new Error('获取仓库列表失败')
      }

      const data: UserRepositoriesResponse = await response.json()
      setRepositories(data.repositories)
      setReposTotal(data.pagination.total)
    } catch (err) {
      console.error('获取仓库失败:', err)
    } finally {
      setReposLoading(false)
    }
  }, [params, reposLimit, reposOffset, filters])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  useEffect(() => {
    if (user) {
      fetchRepositories()
    }
  }, [fetchRepositories, user])

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setReposOffset(0)
  }

  const handlePrevPage = () => {
    setReposOffset(Math.max(0, reposOffset - reposLimit))
  }

  const handleNextPage = () => {
    if (reposOffset + reposLimit < reposTotal) {
      setReposOffset(reposOffset + reposLimit)
    }
  }

  const currentPage = Math.floor(reposOffset / reposLimit) + 1
  const totalPages = Math.ceil(reposTotal / reposLimit)

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

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400">❌ {error || '用户不存在'}</p>
            <Link 
              href="/users"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              返回用户列表
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* 用户信息卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-start space-x-6">
            {user.avatar_url && !avatarError ? (
              <img
                src={user.avatar_url}
                alt={`${user.login}的头像`}
                className="w-24 h-24 rounded-full"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <Avatar
                size={96}
                name={user.login}
                variant="beam"
                colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
                square={false}
              />
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {user.name || user.login}
                </h1>
                <span className={`px-3 py-1 text-sm rounded-full ${
                  user.type === 'Organization' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {user.type === 'Organization' ? '组织' : '用户'}
                </span>
              </div>
              
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">@{user.login}</p>
              
              {user.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-4">{user.bio}</p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
                {user.location && (
                  <span className="flex items-center">📍 {user.location}</span>
                )}
                {user.company && (
                  <span className="flex items-center">🏢 {user.company}</span>
                )}
                {user.blog && (
                  <a 
                    href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    🔗 {user.blog}
                  </a>
                )}
                {user.twitter_username && (
                  <a 
                    href={`https://twitter.com/${user.twitter_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    🐦 @{user.twitter_username}
                  </a>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {user.total_stars.toLocaleString()}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">总 Stars</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {user.total_repos_in_db}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">仓库数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {user.followers.toLocaleString()}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">关注者</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {user.following.toLocaleString()}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">关注</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {user.top_language || '未知'}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">主要语言</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 语言统计 */}
        {user.language_stats && user.language_stats.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">编程语言分布</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {user.language_stats.slice(0, 12).map((lang) => (
                <div key={lang.language} className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {lang.repo_count}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {lang.language}
                  </div>
                  <div className="text-xs text-gray-500">
                    ⭐ {lang.total_stars.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 仓库列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              仓库列表 ({reposTotal.toLocaleString()})
            </h2>
          </div>

          {/* 筛选器 */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                编程语言
              </label>
              <select
                value={filters.language}
                onChange={(e) => handleFilterChange({ language: e.target.value })}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">全部语言</option>
                {user.language_stats?.map((lang) => (
                  <option key={lang.language} value={lang.language}>
                    {lang.language} ({lang.repo_count})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                最少Stars
              </label>
              <input
                type="number"
                value={filters.min_stars}
                onChange={(e) => handleFilterChange({ min_stars: parseInt(e.target.value) || 0 })}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-24"
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
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
            </div>
          </div>

          {/* 仓库列表 */}
          {reposLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">加载仓库中...</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {repositories.map((repo) => (
                  <RepoCard key={repo.github_id} repo={repo} />
                ))}
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    显示第 {reposOffset + 1} - {Math.min(reposOffset + reposLimit, reposTotal)} 条，共 {reposTotal} 条记录
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={reposOffset === 0}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      上一页
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
                      第 {currentPage} 页，共 {totalPages} 页
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={reposOffset + reposLimit >= reposTotal}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}