import { NextResponse } from 'next/server'

export async function GET() {
  console.log('Mock Test API called')
  
  try {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const mockEnvVars = {
      NEXT_PUBLIC_SUPABASE_URL: true,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: true,
      SUPABASE_SERVICE_ROLE_KEY: true,
    }
    
    console.log('Mock test completed successfully')

    return NextResponse.json({
      message: 'Mock API is working perfectly',
      envVars: mockEnvVars,
      databaseConnected: true,
      sampleDataExists: true,
      timestamp: new Date().toISOString(),
      status: 'success'
    })

  } catch (error) {
    console.error('Mock Test API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}