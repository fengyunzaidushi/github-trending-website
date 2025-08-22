import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ login: string }> }
) {
  try {
    const { login } = await params
    const searchParams = request.nextUrl.searchParams
    
    // 获取查询参数
    const language = searchParams.get('language') || null
    const minStars = parseInt(searchParams.get('min_stars') || '0')
    const sortBy = searchParams.get('sort') || 'stars' // stars, updated, created, name
    const sortOrder = searchParams.get('order') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!login) {
      return NextResponse.json(
        { error: '用户名不能为空' },
        { status: 400 }
      )
    }

    // 验证参数
    if (limit > 100) {
      return NextResponse.json(
        { error: '每页最多返回100条记录' },
        { status: 400 }
      )
    }

    // 验证排序字段
    const validSortFields = ['stars', 'updated', 'created', 'pushed', 'name']
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json(
        { error: '无效的排序字段' },
        { status: 400 }
      )
    }

    // 验证排序顺序
    if (!['asc', 'desc'].includes(sortOrder)) {
      return NextResponse.json(
        { error: '无效的排序顺序' },
        { status: 400 }
      )
    }

    // 检查用户是否存在
    const { data: userExists, error: userError } = await supabaseAdmin
      .from('users')
      .select('login')
      .eq('login', login)
      .single()

    if (userError || !userExists) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 调用数据库函数获取用户仓库
    const { data: repositories, error } = await supabaseAdmin
      .rpc('get_user_repositories', {
        target_user_login: login,
        target_language: language,
        min_stars: minStars,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit_count: limit,
        offset_count: offset
      })

    if (error) {
      console.error('获取仓库列表失败:', error)
      return NextResponse.json(
        { error: '获取仓库列表失败' },
        { status: 500 }
      )
    }

    // 获取总数（用于分页）
    let countQuery = supabaseAdmin
      .from('user_repositories')
      .select('id', { count: 'exact', head: true })
      .eq('owner', login)
      .gte('stargazers_count', minStars)
    
    if (language) {
      countQuery = countQuery.eq('language', language)
    }
    
    const { data: totalCount, error: countError } = await countQuery

    const total = countError ? 0 : totalCount?.count || 0

    // 格式化返回数据
    const formattedRepos = (repositories || []).map(repo => ({
      id: repo.id,
      github_id: repo.github_id,
      name: repo.name,
      full_name: repo.full_name,
      html_url: repo.html_url,
      description: repo.description,
      zh_description: repo.zh_description,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      pushed_at: repo.pushed_at,
      size: repo.size,
      stargazers_count: repo.stargazers_count,
      language: repo.language,
      topics: repo.topics || [],
      owner: repo.owner,
      readme_content: repo.readme_content
    }))

    return NextResponse.json({
      repositories: formattedRepos,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total
      },
      filters: {
        language,
        min_stars: minStars,
        sort: sortBy,
        order: sortOrder
      }
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}