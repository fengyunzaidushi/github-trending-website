'use client'

import { useState } from 'react'
import RepoCard from '@/components/RepoCard'
import { TrendingRepo, TrendingCategory, TrendingPeriod } from '@/types/database'

// Completely static data - no API calls possible
const STATIC_REPOS: TrendingRepo[] = [
  {
    id: '1',
    name: 'microsoft/vscode',
    url: 'https://github.com/microsoft/vscode',
    description: 'Visual Studio Code',
    zh_description: 'Visual Studio Code 编辑器',
    language: 'TypeScript',
    owner: 'microsoft',
    repo_name: 'vscode',
    stars: 160000,
    forks: 28000,
    stars_today: 150,
    rank: 1,
    date: '2025-01-11',
    category: 'all' as TrendingCategory,
    period: 'daily' as TrendingPeriod,
    created_at: '2025-01-11',
    updated_at: '2025-01-11'
  },
  {
    id: '2',
    name: 'facebook/react',
    url: 'https://github.com/facebook/react',
    description: 'The library for web and native user interfaces',
    zh_description: 'Web 和原生用户界面库',
    language: 'JavaScript',
    owner: 'facebook',
    repo_name: 'react',
    stars: 220000,
    forks: 45000,
    stars_today: 200,
    rank: 2,
    date: '2025-01-11',
    category: 'all' as TrendingCategory,
    period: 'daily' as TrendingPeriod,
    created_at: '2025-01-11',
    updated_at: '2025-01-11'
  },
  {
    id: '3',
    name: 'pytorch/pytorch',
    url: 'https://github.com/pytorch/pytorch',
    description: 'Tensors and Dynamic neural networks in Python',
    zh_description: 'Python 中的张量和动态神经网络',
    language: 'Python',
    owner: 'pytorch',
    repo_name: 'pytorch',
    stars: 78000,
    forks: 21000,
    stars_today: 120,
    rank: 3,
    date: '2025-01-11',
    category: 'all' as TrendingCategory,
    period: 'daily' as TrendingPeriod,
    created_at: '2025-01-11',
    updated_at: '2025-01-11'
  },
  {
    id: '4',
    name: 'golang/go',
    url: 'https://github.com/golang/go',
    description: 'The Go programming language',
    zh_description: 'Go 编程语言',
    language: 'Go',
    owner: 'golang',
    repo_name: 'go',
    stars: 120000,
    forks: 17000,
    stars_today: 80,
    rank: 4,
    date: '2025-01-11',
    category: 'all' as TrendingCategory,
    period: 'daily' as TrendingPeriod,
    created_at: '2025-01-11',
    updated_at: '2025-01-11'
  },
  {
    id: '5',
    name: 'rust-lang/rust',
    url: 'https://github.com/rust-lang/rust',
    description: 'Empowering everyone to build reliable and efficient software',
    zh_description: '让每个人都能构建可靠高效的软件',
    language: 'Rust',
    owner: 'rust-lang',
    repo_name: 'rust',
    stars: 95000,
    forks: 12000,
    stars_today: 90,
    rank: 5,
    date: '2025-01-11',
    category: 'all' as TrendingCategory,
    period: 'daily' as TrendingPeriod,
    created_at: '2025-01-11',
    updated_at: '2025-01-11'
  }
]

const LANGUAGE_OPTIONS = [
  { name: 'all', label: '全部', count: 5 },
  { name: 'javascript', label: 'JavaScript', count: 1 },
  { name: 'typescript', label: 'TypeScript', count: 1 },
  { name: 'python', label: 'Python', count: 1 },
  { name: 'go', label: 'Go', count: 1 },
  { name: 'rust', label: 'Rust', count: 1 }
]

const PERIOD_OPTIONS = [
  { value: 'daily', label: '今日' },
  { value: 'weekly', label: '本周' },
  { value: 'monthly', label: '本月' }
]

export default function StaticHome() {
  const [selectedLanguage, setSelectedLanguage] = useState('all')
  const [selectedPeriod, setSelectedPeriod] = useState<TrendingPeriod>('daily')
  const [selectedDate, setSelectedDate] = useState('2025-01-11')

  // Filter repos based on selected language
  const filteredRepos = selectedLanguage === 'all' 
    ? STATIC_REPOS 
    : STATIC_REPOS.filter(repo => repo.language?.toLowerCase() === selectedLanguage.toLowerCase())

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🔥 GitHub Trending
              </h1>
              <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                实时追踪最热门的开源项目（演示版）
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as TrendingPeriod)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {PERIOD_OPTIONS.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Language Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {LANGUAGE_OPTIONS.map((language) => (
                <button
                  key={language.name}
                  onClick={() => setSelectedLanguage(language.name)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    selectedLanguage === language.name
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  {language.label}
                  <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {language.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Static Search Box */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="搜索功能仅在演示模式下可用..."
                disabled
                className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <button
              disabled
              className="px-6 py-3 bg-gray-400 cursor-not-allowed text-white font-medium rounded-lg"
            >
              搜索
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-lg font-medium text-gray-900 dark:text-white">
              找到 {filteredRepos.length} 个项目
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              数据日期: {selectedDate} ({selectedPeriod === 'daily' ? '日榜' : selectedPeriod === 'weekly' ? '周榜' : '月榜'})
            </div>
          </div>
        </div>

        {/* Repository List */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
          {filteredRepos.map((repo) => (
            <RepoCard 
              key={repo.id} 
              repo={repo} 
              showRank={true}
            />
          ))}
        </div>

        {/* Info Banner */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                演示模式说明
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  当前显示静态演示数据，包含5个热门开源项目。
                  您可以通过语言标签筛选不同编程语言的项目，或使用日期和周期选择器查看不同时间段的数据。
                  搜索功能在演示模式下暂不可用。
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>© 2024 GitHub Trending Dashboard - 静态演示版本</p>
            <p className="mt-2 text-sm">
              此版本使用静态数据，无任何网络请求。完全离线可用。
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}