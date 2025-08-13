import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { TrendingCategory, TrendingPeriod } from '@/types/database'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const query = searchParams.get('q') || ''
  const language = searchParams.get('language')
  const category = (searchParams.get('category') || 'all') as TrendingCategory
  const period = (searchParams.get('period') || 'daily') as TrendingPeriod
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '25')
  const minStars = parseInt(searchParams.get('minStars') || '0')
  const searchField = searchParams.get('searchField') || 'all'

  if (!query.trim()) {
    return NextResponse.json(
      { error: 'Search query is required' },
      { status: 400 }
    )
  }

  try {
    console.log('Search API called:', { query, searchField, language, category, period })

    // 构建搜索查询
    let dbQuery = supabaseAdmin
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
      .eq('trending_data.category', category)
      .eq('trending_data.period', period)
      .gte('trending_data.stars', minStars)

    // 根据搜索字段构建搜索条件
    let searchCondition = ''
    switch (searchField) {
      case 'name':
        searchCondition = `name.ilike.%${query}%`
        break
      case 'description':
        searchCondition = `description.ilike.%${query}%,zh_description.ilike.%${query}%`
        break
      case 'owner':
        searchCondition = `owner.ilike.%${query}%`
        break
      case 'all':
      default:
        searchCondition = `name.ilike.%${query}%,description.ilike.%${query}%,zh_description.ilike.%${query}%,owner.ilike.%${query}%`
        break
    }

    // 搜索条件
    dbQuery = dbQuery.or(searchCondition)

    // 如果指定了语言，添加语言过滤
    if (language) {
      dbQuery = dbQuery.eq('language', language)
    }

    // 按星标数排序
    dbQuery = dbQuery.order('stars', { ascending: false, referencedTable: 'trending_data' })

    // 分页
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    dbQuery = dbQuery.range(from, to)

    const { data, error, count } = await dbQuery

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to search repositories', details: error.message },
        { status: 500 }
      )
    }

    // 转换数据格式
    const transformedData = data?.map(repo => ({
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
      rank: repo.trending_data[0]?.rank || 0,
      date: repo.trending_data[0]?.date,
      category: repo.trending_data[0]?.category,
      period: repo.trending_data[0]?.period
    })) || []

    return NextResponse.json({
      data: transformedData,
      total: count || 0,
      page,
      pageSize,
      query,
      language,
      category,
      period,
      minStars,
      searchField
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}