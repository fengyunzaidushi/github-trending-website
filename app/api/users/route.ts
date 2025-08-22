import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sort = searchParams.get('sort') || 'stars' // stars, repos, followers, created
    const order = searchParams.get('order') || 'desc'
    const type = searchParams.get('type') // User, Organization

    // 验证参数
    if (limit > 100) {
      return NextResponse.json(
        { error: '每页最多返回100条记录' },
        { status: 400 }
      )
    }

    // 调用数据库函数获取用户统计
    const { data: users, error } = await supabaseAdmin
      .rpc('get_user_stats')

    if (error) {
      console.error('获取用户列表失败:', error)
      return NextResponse.json(
        { error: '获取用户列表失败' },
        { status: 500 }
      )
    }

    if (!users) {
      return NextResponse.json({
        users: [],
        total: 0,
        limit,
        offset
      })
    }

    // 客户端过滤和排序
    let filteredUsers = users

    // 按类型过滤
    if (type) {
      filteredUsers = filteredUsers.filter(user => user.user_type === type)
    }

    // 排序
    filteredUsers.sort((a, b) => {
      let aValue, bValue
      
      switch (sort) {
        case 'stars':
          aValue = a.total_stars || 0
          bValue = b.total_stars || 0
          break
        case 'repos':
          aValue = a.total_repos_in_db || 0
          bValue = b.total_repos_in_db || 0
          break
        case 'followers':
          aValue = a.followers || 0
          bValue = b.followers || 0
          break
        case 'created':
          aValue = new Date(a.account_created_at).getTime()
          bValue = new Date(b.account_created_at).getTime()
          break
        default:
          aValue = a.total_stars || 0
          bValue = b.total_stars || 0
      }

      if (order === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // 分页
    const total = filteredUsers.length
    const paginatedUsers = filteredUsers.slice(offset, offset + limit)

    // 格式化返回数据
    const formattedUsers = paginatedUsers.map(user => ({
      login: user.user_login,
      name: user.user_name,
      type: user.user_type,
      followers: user.followers,
      following: user.following,
      public_repos: user.public_repos,
      total_repos_in_db: user.total_repos_in_db,
      total_stars: user.total_stars,
      avg_stars: user.avg_stars,
      top_language: user.top_language,
      languages_count: user.languages_count,
      last_repo_update: user.last_repo_update,
      account_created_at: user.account_created_at
    }))

    return NextResponse.json({
      users: formattedUsers,
      total,
      limit,
      offset,
      has_more: offset + limit < total
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}