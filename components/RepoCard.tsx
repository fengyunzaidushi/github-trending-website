import { TrendingRepo } from '@/types/database'
import Link from 'next/link'

interface RepoCardProps {
  repo: TrendingRepo
  showRank?: boolean
}

export default function RepoCard({ repo, showRank = true }: RepoCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      JavaScript: 'bg-yellow-400',
      TypeScript: 'bg-blue-400',
      Python: 'bg-green-400',
      Java: 'bg-orange-400',
      'C++': 'bg-pink-400',
      'C#': 'bg-purple-400',
      PHP: 'bg-indigo-400',
      Ruby: 'bg-red-400',
      Go: 'bg-cyan-400',
      Rust: 'bg-orange-600',
      Swift: 'bg-orange-500',
      Kotlin: 'bg-purple-500',
      Vue: 'bg-green-500',
      HTML: 'bg-red-500',
      CSS: 'bg-blue-500',
      Shell: 'bg-gray-400',
      'Jupyter Notebook': 'bg-orange-300',
    }
    return colors[language] || 'bg-gray-400'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {showRank && repo.rank && (
            <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">
              #{repo.rank}
            </span>
          )}
          <div>
            <Link 
              href={repo.url} 
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {repo.name}
            </Link>
            {repo.language && (
              <div className="flex items-center gap-2 mt-1">
                <span 
                  className={`w-3 h-3 rounded-full ${getLanguageColor(repo.language)}`}
                ></span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {repo.language}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{formatNumber(repo.stars)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 7l3.707-3.707a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>{formatNumber(repo.forks)}</span>
          </div>
          
          {repo.stars_today > 0 && (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <span>+{formatNumber(repo.stars_today)}</span>
              <span className="text-xs">today</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        {repo.zh_description && (
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {repo.zh_description}
          </p>
        )}
        
        {repo.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            {repo.description}
          </p>
        )}
      </div>
    </div>
  )
}