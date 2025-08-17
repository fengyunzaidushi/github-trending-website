import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topic: string }> }
) {
  try {
    const resolvedParams = await params
    const topic = decodeURIComponent(resolvedParams.topic)
    
    console.log('Simple Topic API called with:', topic)

    // 简化查询 - 只获取基础数据
    const { data: repositories, error, count } = await supabaseAdmin
      .from('topic_repositories')
      .select('*', { count: 'exact' })
      .filter('topics', 'cs', `{${topic}}`)
      .order('stargazers_count', { ascending: false })
      .limit(20)

    console.log('Query result:', { count, error, dataLength: repositories?.length })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      )
    }

    // 获取语言列表
    const languages = [...new Set(
      repositories?.map(repo => repo.language).filter(Boolean) || []
    )].sort()

    // 获取日期列表
    const dates = [...new Set(
      repositories?.map(repo => repo.created_at.split('T')[0]) || []
    )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    const response = {
      data: repositories || [],
      total: count || 0,
      topic: topic,
      languages: languages,
      dates: dates
    }

    console.log('Returning response:', {
      topic: response.topic,
      total: response.total,
      dataLength: response.data.length,
      languages: response.languages.length,
      dates: response.dates.length
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}