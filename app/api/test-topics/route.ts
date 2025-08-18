import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Testing topic repositories table...')
    
    // 1. 测试表是否存在
    const { data: allData, error: allError } = await supabaseAdmin
      .from('topic_repositories')
      .select('*')
      .limit(5)

    if (allError) {
      console.error('Table access error:', allError)
      return NextResponse.json({
        success: false,
        error: 'Table does not exist or access denied',
        details: allError.message
      }, { status: 500 })
    }

    console.log('Found repositories:', allData?.length)
    
    // 2. 测试topics字段格式
    if (allData && allData.length > 0) {
      console.log('Sample data:', allData[0])
      console.log('Topics field:', allData[0].topics)
      console.log('Topics type:', typeof allData[0].topics)
    }

    // 3. 测试查找包含特定topic的记录
    const { data: filteredData, error: filterError } = await supabaseAdmin
      .from('topic_repositories')
      .select('*')
      .filter('topics', 'cs', '{ai-agent}')
      .limit(5)

    if (filterError) {
      console.error('Filter error:', filterError)
    } else {
      console.log('Filtered data found:', filteredData?.length)
    }

    // 4. 尝试alternative查询方式
    const { data: altData, error: altError } = await supabaseAdmin
      .from('topic_repositories')
      .select('*')
      .textSearch('topics', 'ai-agent')
      .limit(5)

    if (altError) {
      console.error('Alternative query error:', altError)
    } else {
      console.log('Alternative query found:', altData?.length)
    }

    return NextResponse.json({
      success: true,
      totalRecords: allData?.length || 0,
      sampleRecord: allData?.[0] || null,
      filteredRecords: filteredData?.length || 0,
      alternativeRecords: altData?.length || 0
    })

  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}