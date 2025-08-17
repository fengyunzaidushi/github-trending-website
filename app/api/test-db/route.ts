import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...')
    
    // 测试基本连接
    const { data, error } = await supabaseAdmin
      .rpc('get_schema_tables')
      .select()

    if (error) {
      // 如果函数不存在，尝试直接查询已知表
      console.log('Function not found, trying direct table access...')
      const { data: testData, error: testError } = await supabaseAdmin
        .from('repositories')
        .select('id')
        .limit(1)

      if (testError) {
        console.error('Direct table access error:', testError)
        return NextResponse.json({
          success: false,
          error: testError.message,
          suggestion: 'Please create the topic_repositories table manually in Supabase SQL Editor'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Basic Supabase connection works',
        tablesFound: ['repositories'],
        topicTableExists: false,
        suggestion: 'Need to create topic_repositories table'
      })
    }

    console.log('Database tables:', data)

    // 检查 topic_repositories 表是否存在
    const topicTableExists = data?.some(table => table.table_name === 'topic_repositories')

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      tables: data?.map(t => t.table_name),
      topicTableExists
    })

  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}