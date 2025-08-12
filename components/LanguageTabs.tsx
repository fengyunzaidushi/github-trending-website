import { TrendingCategory } from '@/types/database'

interface LanguageTabsProps {
  currentCategory: TrendingCategory
  onCategoryChange: (category: TrendingCategory) => void
  languageStats?: { language: string; total_repos: number; total_stars: number }[]
}

const CATEGORIES: { key: TrendingCategory; label: string; icon?: string }[] = [
  { key: 'all', label: '全部', icon: '🔥' },
  { key: 'python', label: 'Python', icon: '🐍' },
  { key: 'typescript', label: 'TypeScript', icon: '📘' },
  { key: 'javascript', label: 'JavaScript', icon: '📜' },
  { key: 'jupyter', label: 'Jupyter', icon: '📊' },
  { key: 'vue', label: 'Vue', icon: '💚' },
]

export default function LanguageTabs({ 
  currentCategory, 
  onCategoryChange, 
  languageStats = [] 
}: LanguageTabsProps) {
  const getStatsForCategory = (category: TrendingCategory) => {
    if (category === 'all') {
      return languageStats.reduce(
        (acc, stat) => ({
          total_repos: acc.total_repos + stat.total_repos,
          total_stars: acc.total_stars + stat.total_stars,
        }),
        { total_repos: 0, total_stars: 0 }
      )
    }
    
    const categoryLanguages = {
      python: ['Python'],
      typescript: ['TypeScript'],
      javascript: ['JavaScript'],
      jupyter: ['Jupyter Notebook'],
      vue: ['Vue'],
    }
    
    const languages = categoryLanguages[category] || []
    return languageStats
      .filter(stat => languages.includes(stat.language))
      .reduce(
        (acc, stat) => ({
          total_repos: acc.total_repos + stat.total_repos,
          total_stars: acc.total_stars + stat.total_stars,
        }),
        { total_repos: 0, total_stars: 0 }
      )
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {CATEGORIES.map((category) => {
        const stats = getStatsForCategory(category.key)
        const isActive = currentCategory === category.key
        
        return (
          <button
            key={category.key}
            onClick={() => onCategoryChange(category.key)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
              ${isActive 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
          >
            <span className="text-lg">{category.icon}</span>
            <span className="font-medium">{category.label}</span>
            {stats.total_repos > 0 && (
              <span className={`
                text-xs px-2 py-1 rounded-full
                ${isActive 
                  ? 'bg-white/20 text-white' 
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }
              `}>
                {formatNumber(stats.total_repos)}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}