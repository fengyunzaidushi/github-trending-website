import { NextRequest, NextResponse } from 'next/server'

// Mock language statistics
const mockLanguageStats = [
  {
    language: 'JavaScript',
    total_repos: 25,
    total_stars: 150000,
    avg_stars: 6000
  },
  {
    language: 'TypeScript',
    total_repos: 20,
    total_stars: 180000,
    avg_stars: 9000
  },
  {
    language: 'Python',
    total_repos: 18,
    total_stars: 120000,
    avg_stars: 6666
  },
  {
    language: 'Go',
    total_repos: 15,
    total_stars: 95000,
    avg_stars: 6333
  },
  {
    language: 'Rust',
    total_repos: 12,
    total_stars: 110000,
    avg_stars: 9166
  },
  {
    language: 'Java',
    total_repos: 22,
    total_stars: 88000,
    avg_stars: 4000
  },
  {
    language: 'C++',
    total_repos: 10,
    total_stars: 65000,
    avg_stars: 6500
  },
  {
    language: 'Vue',
    total_repos: 8,
    total_stars: 45000,
    avg_stars: 5625
  }
]

export async function GET(request: NextRequest) {
  console.log('Mock Languages API called')
  
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  console.log('Query date:', date)

  try {
    // 模拟数据处理延迟
    await new Promise(resolve => setTimeout(resolve, 50))

    console.log('Returning mock language stats:', { count: mockLanguageStats.length })

    return NextResponse.json({
      data: mockLanguageStats,
      date
    })

  } catch (error) {
    console.error('Mock Languages API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}