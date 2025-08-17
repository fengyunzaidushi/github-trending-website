import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { TopicListResponse } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const offset = (page - 1) * pageSize

    // 获取topic列表，按使用频率排序
    const { data: topicsData, error: topicsError } = await supabaseAdmin
      .from('topic_repositories')
      .select('topics')
      .not('topics', 'is', null)

    if (topicsError) {
      console.error('获取topics数据失败:', topicsError)
      return NextResponse.json(
        { error: '获取话题列表失败' },
        { status: 500 }
      )
    }

    // 统计所有topic及其出现次数
    const topicCounts = new Map<string, number>()
    topicsData.forEach(row => {
      if (row.topics && Array.isArray(row.topics)) {
        row.topics.forEach(topic => {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
        })
      }
    })

    // 转换为数组并排序
    const sortedTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1]) // 按使用频率降序排序
      .slice(offset, offset + pageSize)
      .map(([name, count], index) => ({
        id: name,
        name: name,
        display_name: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: `${count} 个仓库使用此话题`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

    const response: TopicListResponse = {
      data: sortedTopics,
      total: topicCounts.size
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('获取topic列表失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}