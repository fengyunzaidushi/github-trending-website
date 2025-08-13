import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  console.log('Languages API called')
  
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  console.log('Query date:', date)

  try {
    // 首先尝试使用数据库函数获取语言统计
    const { data: functionData, error: functionError } = await supabaseAdmin
      .rpc('get_language_stats', {
        target_date: date
      })

    console.log('Database function result:', { data: functionData?.length, error: functionError })

    if (!functionError && functionData && functionData.length > 0) {
      return NextResponse.json({
        data: functionData,
        date
      })
    }

    // 如果数据库函数失败，使用备用查询方式
    console.log('Falling back to manual aggregation')
    
    const { data, error } = await supabaseAdmin
      .from('repositories')
      .select(`
        language,
        trending_data!inner(
          stars
        )
      `)
      .eq('trending_data.date', date)
      .eq('trending_data.period', 'daily')
      .not('language', 'is', null)
      .neq('language', '')

    console.log('Database query result:', { data: data?.length, error })

    if (error) {
      console.error('Database error:', error)
      // 返回空数据而不是错误
      return NextResponse.json({
        data: [],
        date
      })
    }

    // 手动聚合数据
    const languageStats = (data || []).reduce((acc: Record<string, {
      language: string
      total_repos: number
      total_stars: number
      avg_stars: number
    }>, item) => {
      const language = item.language
      if (!acc[language]) {
        acc[language] = {
          language,
          total_repos: 0,
          total_stars: 0,
          avg_stars: 0
        }
      }
      acc[language].total_repos += 1
      acc[language].total_stars += item.trending_data?.[0]?.stars || 0
      return acc
    }, {})

    // 计算平均值并转换为数组
    const result = Object.values(languageStats).map((stat) => ({
      ...stat,
      avg_stars: stat.total_repos > 0 ? stat.total_stars / stat.total_repos : 0
    })).sort((a, b) => b.total_stars - a.total_stars)

    return NextResponse.json({
      data: result,
      date
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}