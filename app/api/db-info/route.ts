import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // 获取数据库中所有可用的日期
    const { data: dates, error } = await supabaseAdmin
      .from('trending_data')
      .select('date')
      .order('date', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch dates', details: error.message },
        { status: 500 }
      )
    }

    // 去重日期
    const uniqueDates = [...new Set(dates?.map(d => d.date) || [])]

    // 获取各个分类的统计
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('trending_data')
      .select('category, period, date')

    if (statsError) {
      return NextResponse.json(
        { error: 'Failed to fetch stats', details: statsError.message },
        { status: 500 }
      )
    }

    // 按分类和周期统计
    const categoryStats = (stats || []).reduce((acc: Record<string, {
      category: string
      period: string
      dates: Set<string>
    }>, item) => {
      const key = `${item.category}-${item.period}`
      if (!acc[key]) {
        acc[key] = {
          category: item.category,
          period: item.period,
          dates: new Set()
        }
      }
      acc[key].dates.add(item.date)
      return acc
    }, {})

    const categoryStatsArray = Object.values(categoryStats).map((stat) => ({
      category: stat.category,
      period: stat.period,
      dateCount: stat.dates.size,
      latestDate: Array.from(stat.dates).sort().reverse()[0] || null
    }))

    return NextResponse.json({
      availableDates: uniqueDates.slice(0, 10), // 最近10个日期
      totalDates: uniqueDates.length,
      categoryStats: categoryStatsArray
    })

  } catch (error) {
    console.error('Database info API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}