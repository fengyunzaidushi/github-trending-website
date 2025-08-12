import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  console.log('Date statistics API called')
  
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'basic' // basic, detailed, monthly, missing
  const limit = parseInt(searchParams.get('limit') || '30')

  try {
    let data, error

    switch (type) {
      case 'basic':
        // 基础按日期分组统计
        ({ data, error } = await supabaseAdmin
          .rpc('get_date_basic_stats', { limit_count: limit }))
        break
        
      case 'detailed':
        // 详细统计信息
        ({ data, error } = await supabaseAdmin
          .rpc('get_date_detailed_stats', { limit_count: limit }))
        break
        
      case 'monthly':
        // 按月统计
        ({ data, error } = await supabaseAdmin
          .rpc('get_monthly_stats'))
        break
        
      case 'simple':
        // 最简单的查询 - 直接使用客户端
        const { data: rawData, error: rawError } = await supabaseAdmin
          .from('trending_data')
          .select('date')
          .order('date', { ascending: false })
        
        if (rawError) {
          throw rawError
        }
        
        // 在客户端进行分组统计
        const dateCounts: Record<string, number> = {}
        rawData?.forEach(item => {
          dateCounts[item.date] = (dateCounts[item.date] || 0) + 1
        })
        
        const result = Object.entries(dateCounts)
          .map(([date, count]) => ({
            date,
            total_records: count,
            data_quality: count >= 400 ? '✅ 完整' : count >= 200 ? '⚠️ 部分' : '❌ 不足'
          }))
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, limit)
        
        return NextResponse.json({
          data: result,
          total: result.length,
          type: 'simple'
        })
        
      default:
        // 默认简单统计
        const { data: defaultData, error: defaultError } = await supabaseAdmin
          .from('trending_data')
          .select('date, category, period, stars, stars_today, created_at')
          .order('date', { ascending: false })
        
        if (defaultError) {
          throw defaultError
        }
        
        // 客户端分组统计
        const statsMap = new Map()
        defaultData?.forEach(item => {
          const key = item.date
          if (!statsMap.has(key)) {
            statsMap.set(key, {
              date: key,
              total_records: 0,
              categories: new Set(),
              periods: new Set(), 
              total_stars: 0,
              total_stars_today: 0,
              import_times: []
            })
          }
          const stats = statsMap.get(key)
          stats.total_records++
          stats.categories.add(item.category)
          stats.periods.add(item.period)
          stats.total_stars += item.stars || 0
          stats.total_stars_today += item.stars_today || 0
          stats.import_times.push(item.created_at)
        })
        
        // 转换为最终结果
        data = Array.from(statsMap.values())
          .map(stats => ({
            date: stats.date,
            total_records: stats.total_records,
            categories_count: stats.categories.size,
            periods_count: stats.periods.size,
            avg_stars: Math.round(stats.total_stars / stats.total_records),
            total_stars_today: stats.total_stars_today,
            data_quality: stats.total_records >= 400 ? '✅ 完整' : 
                         stats.total_records >= 200 ? '⚠️ 部分' : '❌ 不足',
            first_import_time: Math.min(...stats.import_times.map((t: string) => new Date(t).getTime())),
            last_import_time: Math.max(...stats.import_times.map((t: string) => new Date(t).getTime()))
          }))
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, limit)
        
        error = null
    }

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch date statistics', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data || [],
      total: data?.length || 0,
      type,
      limit
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}