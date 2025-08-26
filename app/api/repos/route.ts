import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface RepoWithUser {
  id: number
  github_id: number
  user_id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  zh_description: string | null
  created_at: string
  updated_at: string
  pushed_at: string | null
  size: number
  stargazers_count: number
  language: string | null
  topics: string[]
  owner: string
  readme_content: string | null
  added_at: string
  user: {
    login: string
    name: string | null
    avatar_url: string | null
    type: 'User' | 'Organization'
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sort = searchParams.get('sort') || 'stars'
    const order = searchParams.get('order') || 'desc'
    const minStars = parseInt(searchParams.get('min_stars') || '0')
    const language = searchParams.get('language')
    const userType = searchParams.get('user_type')
    const userLogin = searchParams.get('user_login')

    console.log('Repos API called with params:', {
      limit,
      offset,
      sort,
      order,
      minStars,
      language,
      userType,
      userLogin
    })

    // 构建查询
    let query = supabaseAdmin
      .from('user_repositories')
      .select(`
        *,
        users!user_repositories_user_id_fkey (
          login,
          name,
          avatar_url,
          type
        )
      `)

    // 添加筛选条件
    if (minStars > 0) {
      query = query.gte('stargazers_count', minStars)
    }

    if (language) {
      query = query.ilike('language', `%${language}%`)
    }

    // 如果有用户相关筛选，需要在用户表上筛选
    if (userType || userLogin) {
      // 先获取符合条件的用户 ID
      let userQuery = supabaseAdmin.from('users').select('id')
      
      if (userType) {
        userQuery = userQuery.eq('type', userType)
      }
      
      if (userLogin) {
        userQuery = userQuery.ilike('login', `%${userLogin}%`)
      }

      const { data: users, error: userError } = await userQuery
      
      if (userError) {
        console.error('Error fetching users:', userError)
        throw new Error('获取用户信息失败')
      }

      if (users && users.length > 0) {
        const userIds = users.map(u => u.id)
        query = query.in('user_id', userIds)
      } else {
        // 没有匹配的用户，返回空结果
        return NextResponse.json({
          repositories: [],
          pagination: {
            total: 0,
            limit,
            offset,
            hasMore: false
          }
        })
      }
    }

    // 添加排序
    let orderColumn = 'stargazers_count'
    switch (sort) {
      case 'stars':
        orderColumn = 'stargazers_count'
        break
      case 'updated':
        orderColumn = 'updated_at'
        break
      case 'created':
        orderColumn = 'created_at'
        break
      case 'name':
        orderColumn = 'name'
        break
    }

    query = query.order(orderColumn, { ascending: order === 'asc' })

    // 获取总数
    const { count, error: countError } = await supabaseAdmin
      .from('user_repositories')
      .select('id', { count: 'exact', head: true })
      .gte('stargazers_count', minStars)
      .ilike('language', language ? `%${language}%` : '%')

    if (countError) {
      console.error('Error getting count:', countError)
    }

    // 添加分页
    query = query.range(offset, offset + limit - 1)

    const { data: repositories, error } = await query

    if (error) {
      console.error('Error fetching repositories:', error)
      throw new Error('获取仓库数据失败')
    }

    // 转换数据格式
    const formattedRepos: RepoWithUser[] = (repositories || []).map((repo: any) => ({
      id: repo.id,
      github_id: repo.github_id,
      user_id: repo.user_id,
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
      readme_content: repo.readme_content,
      added_at: repo.added_at,
      user: {
        login: repo.users.login,
        name: repo.users.name,
        avatar_url: repo.users.avatar_url,
        type: repo.users.type
      }
    }))

    return NextResponse.json({
      repositories: formattedRepos,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0)
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    )
  }
}