import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  console.log('Test API called')
  
  try {
    // 检查环境变量
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
    
    console.log('Environment variables status:', envVars)
    
    // 测试数据库连接
    const { data, error } = await supabaseAdmin
      .from('repositories')
      .select('id')
      .limit(1)

    console.log('Database test result:', { hasData: !!data, error })

    if (error) {
      return NextResponse.json(
        { 
          error: 'Database connection failed', 
          details: error.message,
          envVars
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'API is working',
      envVars,
      databaseConnected: true,
      sampleDataExists: (data?.length || 0) > 0
    })

  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}