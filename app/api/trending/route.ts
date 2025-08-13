import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { TrendingCategory, TrendingPeriod } from '@/types/database'

export async function GET(request: NextRequest) {
  console.log('Trending API called')
  
  const { searchParams } = new URL(request.url)
  
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const category = (searchParams.get('category') || 'all') as TrendingCategory
  const period = (searchParams.get('period') || 'daily') as TrendingPeriod
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '25')
  const language = searchParams.get('language')

  console.log('Query params:', { date, category, period, page, pageSize, language })

  try {
    // 首先尝试使用数据库函数获取趋势数据
    const { data: functionData, error: functionError } = await supabaseAdmin
      .rpc('get_trending_repos', {
        target_date: date,
        target_category: category,
        target_period: period,
        limit_count: pageSize
      })

    console.log('Database function result:', { data: functionData?.length, error: functionError })

    let data = functionData
    
    // 如果数据库函数失败，使用备用查询方式
    if (functionError || !functionData || functionData.length === 0) {
      console.log('Falling back to direct query')
      
      const query = supabaseAdmin
        .from('repositories')
        .select(`
          id,
          name,
          url,
          description,
          zh_description,
          language,
          owner,
          repo_name,
          trending_data!inner(
            date,
            category,
            period,
            stars,
            forks,
            stars_today,
            rank
          )
        `)
        .eq('trending_data.date', date)
        .eq('trending_data.category', category)
        .eq('trending_data.period', period)
        .order('stars', { ascending: false, referencedTable: 'trending_data' })
        .limit(pageSize)

      const fallbackResult = await query

      if (fallbackResult.error) {
        console.error('Fallback query error:', fallbackResult.error)
        // 如果备用查询也失败，返回空数据而不是错误
        data = []
      } else {
        // 转换数据格式
        data = fallbackResult.data?.map(repo => ({
          id: repo.id,
          name: repo.name,
          url: repo.url,
          description: repo.description,
          zh_description: repo.zh_description,
          language: repo.language,
          owner: repo.owner,
          repo_name: repo.repo_name,
          stars: repo.trending_data[0]?.stars || 0,
          forks: repo.trending_data[0]?.forks || 0,
          stars_today: repo.trending_data[0]?.stars_today || 0,
          rank: repo.trending_data[0]?.rank || null,
          date: repo.trending_data[0]?.date,
          category: repo.trending_data[0]?.category,
          period: repo.trending_data[0]?.period
        })) || []
      }
    }

    return NextResponse.json({
      data: data || [],
      total: data?.length || 0,
      page,
      pageSize,
      date,
      category,
      period
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}