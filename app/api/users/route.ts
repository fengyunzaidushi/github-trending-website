import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') // User, Organization

    // 验证参数
    if (limit > 100) {
      return NextResponse.json(
        { error: '每页最多返回100条记录' },
        { status: 400 }
      )
    }

    // 先获取用户总数
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    // 由于RPC函数不支持直接count，我们从之前的Python脚本知道有3105个用户有仓库数据
    // 作为临时解决方案，我们可以查询一个大范围来估算总数
    const { data: allUsersWithRepos } = await supabaseAdmin
      .rpc('get_user_stats')
      .range(0, 9999)
    
    const actualUsersWithReposCount = allUsersWithRepos?.length || 0

    // 调用数据库函数获取用户统计，支持大范围分页
    const { data: users, error } = await supabaseAdmin
      .rpc('get_user_stats')
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('获取用户列表失败:', error)
      return NextResponse.json(
        { error: '获取用户列表失败' },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        users: [],
        total: 0,
        allUsersCount: totalUsers,
        limit,
        offset
      })
    }

    // 注意：由于我们使用了数据库层面的分页，这里不再需要客户端分页
    // 但仍需支持类型过滤，如果有过滤条件，需要重新查询
    let finalUsers = users
    let actualTotal = actualUsersWithReposCount || 0

    if (type) {
      // 如果有类型过滤，需要重新查询
      const { data: filteredUsers } = await supabaseAdmin
        .rpc('get_user_stats')
        .eq('user_type', type)
        .range(offset, offset + limit - 1)
      
      finalUsers = filteredUsers || []
      actualTotal = filteredUsers?.length || 0
    }

    // 格式化返回数据  
    const formattedUsers = finalUsers.map((user: {
      user_login: string;
      user_name?: string;
      user_type: 'User' | 'Organization';
      followers: number;
      following: number;
      public_repos: number;
      total_repos_in_db: number;
      total_stars: number;
      avg_stars: number;
      top_language?: string;
      languages_count: number;
      last_repo_update?: string;
      account_created_at: string;
    }) => ({
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
      total: actualTotal,
      allUsersCount: totalUsers, // 数据库中总用户数（包括没有仓库的用户）
      usersWithRepos: actualUsersWithReposCount, // 有仓库数据的用户数
      limit,
      offset,
      has_more: offset + limit < actualTotal
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}