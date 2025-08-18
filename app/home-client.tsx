'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import RepoCard from '@/components/RepoCard'
import LanguageTabs from '@/components/LanguageTabs'
import PeriodSelector from '@/components/PeriodSelector'
import DatePicker from '@/components/DatePicker'
import SearchComponent, { SearchParams } from '@/components/SearchComponent'
import StructuredData from '@/components/StructuredData'
import { TrendingRepo, TrendingCategory, TrendingPeriod, LanguageStats } from '@/types/database'

interface HomeClientProps {
  searchParams: { 
    date?: string;
    category?: string;
    period?: string;
    q?: string;
  }
}

export default function HomeClient({ searchParams }: HomeClientProps) {
  const router = useRouter()
  const [repos, setRepos] = useState<TrendingRepo[]>([])
  const [languageStats, setLanguageStats] = useState<LanguageStats[]>([])
  const [currentCategory, setCurrentCategory] = useState<TrendingCategory>(
    (searchParams.category as TrendingCategory) || 'all'
  )
  const [currentPeriod, setCurrentPeriod] = useState<TrendingPeriod>(
    (searchParams.period as TrendingPeriod) || 'daily'
  )
  const [selectedDate, setSelectedDate] = useState<string>(
    searchParams.date || new Date().toISOString().split('T')[0]
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSearchMode, setIsSearchMode] = useState(!!searchParams.q)
  const [searchResults, setSearchResults] = useState<TrendingRepo[]>([])  
  const [searchLoading, setSearchLoading] = useState(false)
  const [lastSearchParams, setLastSearchParams] = useState<SearchParams | null>(null)

  const fetchTrendingData = useCallback(async (category: TrendingCategory, period: TrendingPeriod, date?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching trending data:', { category, period, date: date || selectedDate })
      
      const targetDate = date || selectedDate
      const response = await fetch(`/api/trending?category=${category}&period=${period}&pageSize=25&date=${targetDate}`)
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json() as { error?: string }
        throw new Error(errorData.error || 'Failed to fetch trending data')
      }
      
      const data = await response.json() as { data?: TrendingRepo[] }
      console.log('Received data:', data)
      setRepos(data.data || [])
    } catch (err) {
      console.error('Error fetching trending data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  const fetchLanguageStats = useCallback(async (date?: string) => {
    try {
      console.log('Fetching language stats for date:', date || selectedDate)
      
      const targetDate = date || selectedDate
      const response = await fetch(`/api/languages?date=${targetDate}`)
      
      console.log('Languages response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json() as { error?: string }
        console.error('Languages API error:', errorData)
        return
      }
      
      const data = await response.json() as { data?: LanguageStats[] }
      console.log('Language stats data:', data)
      setLanguageStats(data.data || [])
    } catch (err) {
      console.error('Error fetching language stats:', err)
    }
  }, [selectedDate])

  // 更新URL参数
  const updateUrl = useCallback((params: Record<string, string>) => {
    const url = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== 'daily' && value !== new Date().toISOString().split('T')[0]) {
        url.set(key, value)
      }
    })
    const newUrl = url.toString() ? `?${url.toString()}` : '/'
    router.replace(newUrl, { scroll: false })
  }, [router])

  // 搜索功能
  const handleSearch = async (searchParams: SearchParams) => {
    try {
      setSearchLoading(true)
      setError(null)
      setIsSearchMode(true)
      setLastSearchParams(searchParams)
      
      // 更新URL
      updateUrl({ q: searchParams.query, category: searchParams.category, period: searchParams.period })
      
      console.log('Searching with params:', searchParams)
      
      const params = new URLSearchParams({
        q: searchParams.query,
        category: searchParams.category,
        period: searchParams.period,
        pageSize: '25'
      })
      
      if (searchParams.language) {
        params.append('language', searchParams.language)
      }
      
      if (searchParams.minStars) {
        params.append('minStars', searchParams.minStars.toString())
      }
      
      if (searchParams.searchField && searchParams.searchField !== 'all') {
        params.append('searchField', searchParams.searchField)
      }
      
      const response = await fetch(`/api/search?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json() as { error?: string }
        throw new Error(errorData.error || 'Search failed')
      }
      
      const data = await response.json() as { data?: TrendingRepo[] }
      console.log('Search results:', data)
      setSearchResults(data.data || [])
    } catch (err) {
      console.error('Error searching:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setSearchLoading(false)
    }
  }
  
  const handleBackToTrending = () => {
    setIsSearchMode(false)
    setSearchResults([])
    setLastSearchParams(null)
    setError(null)
    updateUrl({ date: selectedDate, category: currentCategory, period: currentPeriod })
  }

  // 初始化搜索模式
  useEffect(() => {
    if (searchParams.q && !isSearchMode) {
      handleSearch({
        query: searchParams.q,
        category: currentCategory,
        period: currentPeriod,
        searchField: 'all'
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.q])

  useEffect(() => {
    if (!isSearchMode) {
      fetchTrendingData(currentCategory, currentPeriod)
    }
  }, [currentCategory, currentPeriod, selectedDate, fetchTrendingData, isSearchMode])

  useEffect(() => {
    fetchLanguageStats()
  }, [selectedDate, fetchLanguageStats])

  const handleCategoryChange = (category: TrendingCategory) => {
    setCurrentCategory(category)
    if (!isSearchMode) {
      updateUrl({ date: selectedDate, category, period: currentPeriod })
    }
    // 如果在搜索模式，切换分类时重新搜索
    if (isSearchMode && lastSearchParams) {
      handleSearch({ ...lastSearchParams, category })
    }
  }

  const handlePeriodChange = (period: TrendingPeriod) => {
    setCurrentPeriod(period)
    if (!isSearchMode) {
      updateUrl({ date: selectedDate, category: currentCategory, period })
    }
    // 如果在搜索模式，切换周期时重新搜索
    if (isSearchMode && lastSearchParams) {
      handleSearch({ ...lastSearchParams, period })
    }
  }

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    if (!isSearchMode) {
      updateUrl({ date, category: currentCategory, period: currentPeriod })
    }
  }

  const displayRepos = isSearchMode ? searchResults : repos

  return (
    <>
      <StructuredData 
        repos={displayRepos} 
        date={selectedDate} 
        category={currentCategory} 
        period={currentPeriod} 
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Fixed Header and Search Section */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
          {/* Header */}
          <header className="border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    🔥 GitHub Trending
                  </h1>
                  <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                    实时追踪最热门的开源项目
                  </span>
                  
                  {/* Navigation Links */}
                  <nav className="ml-6 flex items-center gap-4">
                    <Link 
                      href="/topic" 
                      className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
                    >
                      主题
                    </Link>
                    <Link 
                      href="/topic/claude-code" 
                      className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
                    >
                      Claude Code
                    </Link>
                  </nav>
                </div>
                
                <div className="flex items-center gap-4">
                  <DatePicker 
                    selectedDate={selectedDate}
                    onDateChange={handleDateChange}
                  />
                  <PeriodSelector 
                    currentPeriod={currentPeriod}
                    onPeriodChange={handlePeriodChange}
                  />
                </div>
              </div>
            </div>
          </header>

          {/* Search Component */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-white dark:bg-gray-800">
            <SearchComponent 
              onSearch={handleSearch}
              isLoading={searchLoading}
              currentCategory={currentCategory}
              currentPeriod={currentPeriod}
            />
          </div>
        </div>

        {/* Spacer to push content below fixed header */}
        <div className="pt-[180px]"></div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Search Results Header */}
          {isSearchMode && (
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToTrending}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  返回趋势榜
                </button>
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  🔍 搜索结果
                </div>
              </div>
            </div>
          )}

          {/* Language Tabs - 只在非搜索模式显示 */}
          {!isSearchMode && (
            <LanguageTabs 
              currentCategory={currentCategory}
              onCategoryChange={handleCategoryChange}
              languageStats={languageStats}
            />
          )}

          {/* Content */}
          {isSearchMode ? (
            // 搜索结果显示
            searchLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <div className="text-gray-600 dark:text-gray-400">
                  🔍 正在搜索...
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 text-lg mb-2">❌ 搜索失败</div>
                <div className="text-gray-600 dark:text-gray-400">{error}</div>
                <button 
                  onClick={() => lastSearchParams && handleSearch(lastSearchParams)}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  重试搜索
                </button>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-2">🔍 未找到结果</div>
                <div className="text-gray-400">请尝试修改搜索条件</div>
              </div>
            ) : (
              <>
                {/* Search Results Summary */}
                <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      找到 {searchResults.length} 个项目
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      搜索关键词: &quot;{lastSearchParams?.query}&quot;
                    </div>
                  </div>
                </div>

                {/* Search Results List */}
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
                  {searchResults.map((repo) => (
                    <RepoCard 
                      key={repo.id} 
                      repo={repo} 
                      showRank={false}
                    />
                  ))}
                </div>
              </>
            )
          ) : (
            // 趋势榜数据显示
            loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <div className="text-gray-600 dark:text-gray-400">
                  正在加载 {selectedDate} 的 {currentCategory === 'all' ? '全部' : currentCategory} {currentPeriod === 'daily' ? '日榜' : currentPeriod === 'weekly' ? '周榜' : '月榜'} 数据...
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 text-lg mb-2">❌ 加载失败</div>
                <div className="text-gray-600 dark:text-gray-400">{error}</div>
                <button 
                  onClick={() => fetchTrendingData(currentCategory, currentPeriod)}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  重试
                </button>
              </div>
            ) : repos.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-2">📭 暂无数据</div>
                <div className="text-gray-400">该分类下暂时没有趋势数据</div>
              </div>
            ) : (
              <>
                {/* Stats Summary */}
                <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      找到 {repos.length} 个项目
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      数据日期: {selectedDate} ({currentPeriod === 'daily' ? '日榜' : currentPeriod === 'weekly' ? '周榜' : '月榜'})
                    </div>
                  </div>
                </div>

                {/* Repository List */}
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
                  {repos.map((repo) => (
                    <RepoCard 
                      key={repo.id} 
                      repo={repo} 
                      showRank={true}
                    />
                  ))}
                </div>
              </>
            )
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p>© 2024 GitHub Trending Dashboard - 基于 Next.js + Supabase + Cloudflare 构建</p>
              <p className="mt-2 text-sm">数据来源: GitHub Trending API</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}