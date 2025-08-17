import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { TopicRepositoriesResponse } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topic: string }> }
) {
  try {
    const resolvedParams = await params
    const topic = decodeURIComponent(resolvedParams.topic)
    const searchParams = request.nextUrl.searchParams
    const language = searchParams.get('language') || 'all'
    const date = searchParams.get('date') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const offset = (page - 1) * pageSize

    console.log('Topic API called with:', { topic, language, date, page, pageSize })

    // 构建查询条件
    let query = supabaseAdmin
      .from('topic_repositories')
      .select('*')

    // 使用 @> 操作符检查数组包含
    query = query.filter('topics', 'cs', `{${topic}}`)

    // 添加语言筛选
    if (language !== 'all') {
      query = query.eq('language', language)
    }

    // 添加日期筛选
    if (date !== 'all') {
      const targetDate = new Date(date)
      const nextDate = new Date(targetDate)
      nextDate.setDate(nextDate.getDate() + 1)
      
      query = query
        .gte('created_at', targetDate.toISOString())
        .lt('created_at', nextDate.toISOString())
    }

    // 分别获取总数和数据
    const countQuery = supabaseAdmin
      .from('topic_repositories')
      .select('*', { count: 'exact', head: true })
      .filter('topics', 'cs', `{${topic}}`)

    if (language !== 'all') {
      countQuery.eq('language', language)
    }
    if (date !== 'all') {
      const targetDate = new Date(date)
      const nextDate = new Date(targetDate)
      nextDate.setDate(nextDate.getDate() + 1)
      countQuery
        .gte('created_at', targetDate.toISOString())
        .lt('created_at', nextDate.toISOString())
    }

    const [
      { count, error: countError },
      { data: repositories, error: dataError }
    ] = await Promise.all([
      countQuery,
      query.order('stargazers_count', { ascending: false }).range(offset, offset + pageSize - 1)
    ])

    console.log('Query results:', { count, countError, dataLength: repositories?.length, dataError })

    if (dataError) {
      console.error('获取topic仓库数据失败:', dataError)
      return NextResponse.json(
        { error: '获取仓库数据失败' },
        { status: 500 }
      )
    }

    // 获取可用的语言列表
    const { data: languagesData } = await supabaseAdmin
      .from('topic_repositories')
      .select('language')
      .filter('topics', 'cs', `{${topic}}`)
      .not('language', 'is', null)

    const uniqueLanguages = [...new Set(
      languagesData?.map(item => item.language).filter(Boolean) || []
    )].sort()

    // 获取可用的日期列表
    const { data: datesData } = await supabaseAdmin
      .from('topic_repositories')
      .select('created_at')
      .filter('topics', 'cs', `{${topic}}`)
      .order('created_at', { ascending: false })

    const uniqueDates = [...new Set(
      datesData?.map(item => item.created_at.split('T')[0]) || []
    )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    const response: TopicRepositoriesResponse = {
      data: repositories || [],
      total: count || 0,
      topic: topic,
      languages: uniqueLanguages,
      dates: uniqueDates
    }

    console.log('Final response:', {
      topic: response.topic,
      total: response.total,
      dataLength: response.data.length
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('获取topic仓库列表失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}