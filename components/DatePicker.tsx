interface DatePickerProps {
  selectedDate: string
  onDateChange: (date: string) => void
}

export default function DatePicker({ selectedDate, onDateChange }: DatePickerProps) {
  const today = new Date().toISOString().split('T')[0]
  
  // 生成最近30天的日期选项
  const generateDateOptions = () => {
    const dates = []
    const currentDate = new Date()
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(currentDate)
      date.setDate(currentDate.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const displayDate = date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        weekday: 'short'
      })
      dates.push({
        value: dateStr,
        label: i === 0 ? '今天' : displayDate,
        isToday: i === 0
      })
    }
    return dates
  }

  const dateOptions = generateDateOptions()

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        选择日期:
      </label>
      <select
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
        className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        {dateOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label} ({option.value})
          </option>
        ))}
      </select>
      
      {/* 自定义日期输入 */}
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
        max={today}
        className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        title="选择自定义日期"
      />
    </div>
  )
}