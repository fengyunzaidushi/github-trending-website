import { NextRequest, NextResponse } from 'next/server'

// Mock repository data for search
const mockSearchRepos = [
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
    name: 'vercel/next.js',
    url: 'https://github.com/vercel/next.js',
    description: 'The React Framework',
    zh_description: 'React 应用框架',
    language: 'JavaScript',
    owner: 'vercel',
    repo_name: 'next.js',
    stars: 120000,
    forks: 26000,
    stars_today: 80,
    rank: 3
  },
  {
    id: '4',
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
    rank: 4
  },
  {
    id: '5',
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
    rank: 5
  },
  {
    id: '6',
    name: 'microsoft/TypeScript',
    url: 'https://github.com/microsoft/TypeScript',
    description: 'TypeScript is a superset of JavaScript',
    zh_description: 'TypeScript 是 JavaScript 的超集',
    language: 'TypeScript',
    owner: 'microsoft',
    repo_name: 'TypeScript',
    stars: 98000,
    forks: 12000,
    stars_today: 60,
    rank: 6
  }
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const query = searchParams.get('q') || ''
  const language = searchParams.get('language')
  const category = searchParams.get('category') || 'all'
  const period = searchParams.get('period') || 'daily'
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '25')
  const minStars = parseInt(searchParams.get('minStars') || '0')
  const searchField = searchParams.get('searchField') || 'all'

  if (!query.trim()) {
    return NextResponse.json(
      { error: 'Search query is required' },
      { status: 400 }
    )
  }

  try {
    console.log('Mock Search API called:', { query, searchField, language })
    
    // 模拟数据处理延迟
    await new Promise(resolve => setTimeout(resolve, 100))

    // 根据搜索字段筛选
    let filteredRepos = mockSearchRepos.filter(repo => {
      const queryLower = query.toLowerCase()
      
      switch (searchField) {
        case 'name':
          return repo.name.toLowerCase().includes(queryLower)
        case 'description':
          return repo.description.toLowerCase().includes(queryLower) ||
                 (repo.zh_description && repo.zh_description.toLowerCase().includes(queryLower))
        case 'owner':
          return repo.owner.toLowerCase().includes(queryLower)
        case 'all':
        default:
          return repo.name.toLowerCase().includes(queryLower) ||
                 repo.description.toLowerCase().includes(queryLower) ||
                 (repo.zh_description && repo.zh_description.toLowerCase().includes(queryLower)) ||
                 repo.owner.toLowerCase().includes(queryLower)
      }
    })

    // 语言筛选
    if (language) {
      filteredRepos = filteredRepos.filter(repo => 
        repo.language?.toLowerCase() === language.toLowerCase()
      )
    }

    // 最小星标数筛选
    if (minStars > 0) {
      filteredRepos = filteredRepos.filter(repo => repo.stars >= minStars)
    }

    // 添加元数据
    const transformedData = filteredRepos.map(repo => ({
      ...repo,
      date: new Date().toISOString().split('T')[0],
      category,
      period
    }))

    console.log('Mock search results:', { count: transformedData.length })

    return NextResponse.json({
      data: transformedData,
      total: transformedData.length,
      page,
      pageSize,
      query,
      language,
      category,
      period,
      minStars,
      searchField
    })

  } catch (error) {
    console.error('Mock Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}