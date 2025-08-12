import { NextRequest, NextResponse } from 'next/server'

// Mock trending data
const mockRepos = [
  {
    id: '1',
    name: 'microsoft/vscode',
    url: 'https://github.com/microsoft/vscode',
    description: 'Visual Studio Code',
    zh_description: 'Visual Studio Code 编辑器',
    language: 'TypeScript',
    owner: 'microsoft',
    repo_name: 'vscode',
    stars: 160000,
    forks: 28000,
    stars_today: 150,
    rank: 1
  },
  {
    id: '2',
    name: 'facebook/react',
    url: 'https://github.com/facebook/react',
    description: 'The library for web and native user interfaces',
    zh_description: 'Web 和原生用户界面库',
    language: 'JavaScript',
    owner: 'facebook',
    repo_name: 'react',
    stars: 220000,
    forks: 45000,
    stars_today: 200,
    rank: 2
  },
  {
    id: '3',
    name: 'pytorch/pytorch',
    url: 'https://github.com/pytorch/pytorch',
    description: 'Tensors and Dynamic neural networks in Python',
    zh_description: 'Python 中的张量和动态神经网络',
    language: 'Python',
    owner: 'pytorch',
    repo_name: 'pytorch',
    stars: 78000,
    forks: 21000,
    stars_today: 120,
    rank: 3
  },
  {
    id: '4',
    name: 'golang/go',
    url: 'https://github.com/golang/go',
    description: 'The Go programming language',
    zh_description: 'Go 编程语言',
    language: 'Go',
    owner: 'golang',
    repo_name: 'go',
    stars: 120000,
    forks: 17000,
    stars_today: 80,
    rank: 4
  },
  {
    id: '5',
    name: 'rust-lang/rust',
    url: 'https://github.com/rust-lang/rust',
    description: 'Empowering everyone to build reliable and efficient software',
    zh_description: '让每个人都能构建可靠高效的软件',
    language: 'Rust',
    owner: 'rust-lang',
    repo_name: 'rust',
    stars: 95000,
    forks: 12000,
    stars_today: 90,
    rank: 5
  }
]

export async function GET(request: NextRequest) {
  console.log('Mock Trending API called')
  
  const { searchParams } = new URL(request.url)
  
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const category = searchParams.get('category') || 'all'
  const period = searchParams.get('period') || 'daily'
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '25')
  const language = searchParams.get('language')

  console.log('Query params:', { date, category, period, page, pageSize, language })

  try {
    // 模拟数据处理延迟
    await new Promise(resolve => setTimeout(resolve, 100))

    // 根据分类筛选
    let filteredRepos = [...mockRepos]
    
    if (category !== 'all' && language) {
      filteredRepos = mockRepos.filter(repo => 
        repo.language?.toLowerCase() === language.toLowerCase()
      )
    } else if (category !== 'all') {
      filteredRepos = mockRepos.filter(repo => 
        repo.language?.toLowerCase() === category.toLowerCase()
      )
    }

    // 添加日期和周期信息
    const reposWithMeta = filteredRepos.map(repo => ({
      ...repo,
      date,
      category,
      period
    }))

    console.log('Returning mock data:', { count: reposWithMeta.length })

    return NextResponse.json({
      data: reposWithMeta,
      total: reposWithMeta.length,
      page,
      pageSize,
      date,
      category,
      period
    })

  } catch (error) {
    console.error('Mock API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}