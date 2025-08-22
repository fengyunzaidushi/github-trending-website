import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { login: string } }
) {
  try {
    const { login } = params

    if (!login) {
      return NextResponse.json(
        { error: '用户名不能为空' },
        { status: 400 }
      )
    }

    // 调用数据库函数获取用户统计信息
    const { data: userStats, error: statsError } = await supabaseAdmin
      .rpc('get_user_stats', { target_user_login: login })

    if (statsError) {
      console.error('获取用户统计失败:', statsError)
      return NextResponse.json(
        { error: '获取用户信息失败' },
        { status: 500 }
      )
    }

    if (!userStats || userStats.length === 0) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    const userStat = userStats[0]

    // 获取用户详细信息
    const { data: userInfo, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('login', login)
      .single()

    if (userError || !userInfo) {
      console.error('获取用户详细信息失败:', userError)
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 获取语言统计
    const { data: languageStats, error: langError } = await supabaseAdmin
      .rpc('get_language_stats_by_user', { target_user_login: login })

    // 格式化返回数据
    const userData = {
      // 基本信息
      login: userInfo.login,
      name: userInfo.name,
      avatar_url: userInfo.avatar_url,
      html_url: userInfo.html_url,
      type: userInfo.type,
      bio: userInfo.bio,
      location: userInfo.location,
      email: userInfo.email,
      company: userInfo.company,
      blog: userInfo.blog,
      twitter_username: userInfo.twitter_username,
      hireable: userInfo.hireable,
      created_at: userInfo.created_at,
      updated_at: userInfo.updated_at,
      
      // 统计信息
      followers: userStat.followers,
      following: userStat.following,
      public_repos: userStat.public_repos,
      total_repos_in_db: userStat.total_repos_in_db,
      total_stars: userStat.total_stars,
      avg_stars: userStat.avg_stars,
      top_language: userStat.top_language,
      languages_count: userStat.languages_count,
      last_repo_update: userStat.last_repo_update,
      
      // 语言统计
      language_stats: langError ? [] : languageStats || []
    }

    return NextResponse.json({
      user: userData
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}