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

    // 构建查询条件
    let query = supabaseAdmin
      .from('topic_repositories')
      .select('*')
      .contains('topics', [topic])
      .order('stargazers_count', { ascending: false })

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

    // 获取总数
    const { count } = await query
      .select('*', { count: 'exact', head: true })

    // 获取分页数据
    const { data: repositories, error } = await query
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('获取topic仓库数据失败:', error)
      return NextResponse.json(
        { error: '获取仓库数据失败' },
        { status: 500 }
      )
    }

    // 获取可用的语言列表
    const { data: languagesData } = await supabaseAdmin
      .from('topic_repositories')
      .select('language')
      .contains('topics', [topic])
      .not('language', 'is', null)

    const uniqueLanguages = [...new Set(
      languagesData?.map(item => item.language).filter(Boolean) || []
    )].sort()

    // 获取可用的日期列表
    const { data: datesData } = await supabaseAdmin
      .from('topic_repositories')
      .select('created_at')
      .contains('topics', [topic])
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

    return NextResponse.json(response)
  } catch (error) {
    console.error('获取topic仓库列表失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}