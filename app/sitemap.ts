import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://github-trending.example.com'
  
  const currentDate = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const categories = [
    'all', 'javascript', 'typescript', 'python', 'java', 'go', 'rust', 
    'c++', 'c', 'swift', 'kotlin', 'php', 'ruby', 'vue', 'react'
  ]
  
  const periods = ['daily', 'weekly', 'monthly']
  
  const dates = [currentDate, yesterday, lastWeek, lastMonth]
  
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    }
  ]
  
  // 生成分类页面
  const categoryPages: MetadataRoute.Sitemap = categories.flatMap(category => 
    periods.map(period => ({
      url: `${baseUrl}/?category=${category}&period=${period}`,
      lastModified: new Date(),
      changeFrequency: period === 'daily' ? 'daily' : period === 'weekly' ? 'weekly' : 'monthly' as const,
      priority: category === 'all' ? 0.9 : 0.8,
    }))
  )
  
  // 生成历史日期页面（只生成重要日期）
  const datePages: MetadataRoute.Sitemap = dates.flatMap(date =>
    periods.map(period => ({
      url: `${baseUrl}/?date=${date}&period=${period}`,
      lastModified: new Date(date),
      changeFrequency: 'monthly' as const,
      priority: date === currentDate ? 0.9 : 0.7,
    }))
  )
  
  // 生成热门编程语言的特定日期页面
  const languageDatePages: MetadataRoute.Sitemap = ['javascript', 'typescript', 'python', 'java', 'go'].flatMap(language =>
    [currentDate, yesterday].flatMap(date =>
      periods.map(period => ({
        url: `${baseUrl}/?category=${language}&date=${date}&period=${period}`,
        lastModified: new Date(date),
        changeFrequency: 'daily' as const,
        priority: 0.6,
      }))
    )
  )

  return [
    ...staticPages,
    ...categoryPages,
    ...datePages,
    ...languageDatePages,
  ]
}