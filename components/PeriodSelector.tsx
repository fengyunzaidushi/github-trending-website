import { TrendingPeriod } from '@/types/database'

interface PeriodSelectorProps {
  currentPeriod: TrendingPeriod
  onPeriodChange: (period: TrendingPeriod) => void
}

const PERIODS: { key: TrendingPeriod; label: string; description: string }[] = [
  { key: 'daily', label: '今日', description: '过去24小时' },
  { key: 'weekly', label: '本周', description: '过去7天' },
  { key: 'monthly', label: '本月', description: '过去30天' },
]

export default function PeriodSelector({ currentPeriod, onPeriodChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
      {PERIODS.map((period) => {
        const isActive = currentPeriod === period.key
        
        return (
          <button
            key={period.key}
            onClick={() => onPeriodChange(period.key)}
            className={`
              flex-1 px-4 py-2 rounded-md transition-all duration-200 text-sm font-medium
              ${isActive 
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
            title={period.description}
          >
            {period.label}
          </button>
        )
      })}
    </div>
  )
}