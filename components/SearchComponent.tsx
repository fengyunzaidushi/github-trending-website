'use client'

import { useState } from 'react'
import { TrendingCategory, TrendingPeriod } from '@/types/database'

interface SearchComponentProps {
  onSearch: (searchParams: SearchParams) => void
  isLoading?: boolean
  currentCategory: TrendingCategory
  currentPeriod: TrendingPeriod
}

export interface SearchParams {
  query: string
  language?: string
  minStars?: number
  category: TrendingCategory
  period: TrendingPeriod
  searchField: 'all' | 'name' | 'description' | 'owner'
}

const POPULAR_LANGUAGES = [
  'Python', 'TypeScript', 'JavaScript', 'Java', 'Go', 'Rust', 
  'C++', 'C', 'Swift', 'Kotlin', 'PHP', 'Ruby', 'Vue', 'React'
]

const SEARCH_FIELDS = [
  { value: 'all', label: '全部字段' },
  { value: 'name', label: '仓库名称' },
  { value: 'description', label: '项目描述' },
  { value: 'owner', label: '作者名称' }
]

export default function SearchComponent({ 
  onSearch, 
  isLoading, 
  currentCategory, 
  currentPeriod 
}: SearchComponentProps) {
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('')
  const [minStars, setMinStars] = useState('')
  const [searchField, setSearchField] = useState<SearchParams['searchField']>('all')
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim()) {
      return
    }

    onSearch({
      query: query.trim(),
      language: language || undefined,
      minStars: minStars ? parseInt(minStars) : undefined,
      category: currentCategory,
      period: currentPeriod,
      searchField
    })
  }

  const handleReset = () => {
    setQuery('')
    setLanguage('')
    setMinStars('')
    setSearchField('all')
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <form onSubmit={handleSearch} className="space-y-4">
        {/* 主搜索框 */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索 GitHub 仓库..."
              className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                搜索中
              </>
            ) : (
              '搜索'
            )}
          </button>
          
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors"
            title="高级搜索选项"
          >
            <svg className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* 高级搜索选项 */}
        {isExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 搜索字段 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  搜索范围
                </label>
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value as SearchParams['searchField'])}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {SEARCH_FIELDS.map(field => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 编程语言 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  编程语言
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">所有语言</option>
                  {POPULAR_LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              {/* 最小星标数 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  最小星标数
                </label>
                <input
                  type="number"
                  value={minStars}
                  onChange={(e) => setMinStars(e.target.value)}
                  placeholder="如：100"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 重置按钮 */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  重置
                </button>
              </div>
            </div>

            {/* 快捷筛选标签 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                快捷筛选
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMinStars('1000')}
                  className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  1000+ ⭐
                </button>
                <button
                  type="button"
                  onClick={() => setMinStars('5000')}
                  className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                >
                  5000+ ⭐
                </button>
                <button
                  type="button"
                  onClick={() => setMinStars('10000')}
                  className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                >
                  10000+ ⭐
                </button>
                <button
                  type="button"
                  onClick={() => { setLanguage('Python'); setSearchField('all') }}
                  className="px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
                >
                  🐍 Python
                </button>
                <button
                  type="button"
                  onClick={() => { setLanguage('TypeScript'); setSearchField('all') }}
                  className="px-3 py-1 text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                >
                  📘 TypeScript
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}