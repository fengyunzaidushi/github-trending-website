'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { User, UserListResponse } from '@/types/database'

interface UserCardProps {
  user: User
}

function UserCard({ user }: UserCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start space-x-4">
        <img
          src={user.avatar_url || '/default-avatar.png'}
          alt={`${user.login}的头像`}
          className="w-16 h-16 rounded-full"
          onError={(e) => {
            e.currentTarget.src = '/default-avatar.png'
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <Link 
              href={`/user/${user.login}`}
              className="text-xl font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate"
            >
              {user.name || user.login}
            </Link>
            <span className={`px-2 py-1 text-xs rounded-full ${
              user.type === 'Organization' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            }`}>
              {user.type === 'Organization' ? '组织' : '用户'}
            </span>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">@{user.login}</p>
          
          {user.bio && (
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-2">
              {user.bio}
            </p>
          )}
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
            {user.location && (
              <span className="flex items-center">
                📍 {user.location}
              </span>
            )}
            {user.company && (
              <span className="flex items-center">
                🏢 {user.company}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {(user.total_stars || 0).toLocaleString()}
              </div>
              <div className="text-gray-600 dark:text-gray-400">总 Stars</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {user.total_repos_in_db || 0}
              </div>
              <div className="text-gray-600 dark:text-gray-400">仓库数</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {(user.followers || 0).toLocaleString()}
              </div>
              <div className="text-gray-600 dark:text-gray-400">关注者</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {user.top_language || '未知'}
              </div>
              <div className="text-gray-600 dark:text-gray-400">主要语言</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [filters, setFilters] = useState({
    type: '',
    sort: 'stars',
    order: 'desc'
  })

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        sort: filters.sort,
        order: filters.order
      })
      
      if (filters.type) {
        params.append('type', filters.type)
      }

      const response = await fetch(`/api/users?${params}`)
      
      if (!response.ok) {
        throw new Error('获取用户列表失败')
      }

      const data: UserListResponse = await response.json()
      setUsers(data.users)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }, [limit, offset, filters])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setOffset(0) // 重置到第一页
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
            <p className="text-red-600 dark:text-red-400">❌ {error}</p>
            <button 
              onClick={fetchUsers}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            GitHub 用户
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            发现优秀的开发者和组织，共找到 {total.toLocaleString()} 个用户
          </p>
        </div>

        {/* 筛选器 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                用户类型
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange({ type: e.target.value })}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">全部</option>
                <option value="User">个人用户</option>
                <option value="Organization">组织</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                排序方式
              </label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange({ sort: e.target.value })}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="stars">总 Stars</option>
                <option value="repos">仓库数量</option>
                <option value="followers">关注者数</option>
                <option value="created">注册时间</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                排序顺序
              </label>
              <select
                value={filters.order}
                onChange={(e) => handleFilterChange({ order: e.target.value })}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
            </div>
          </div>
        </div>

        {/* 用户列表 */}
        <div className="space-y-4 mb-8">
          {users.map((user) => (
            <UserCard key={user.login} user={user} />
          ))}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              显示第 {offset + 1} - {Math.min(offset + limit, total)} 条，共 {total} 条记录
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
      </div>
    </div>
  )
}