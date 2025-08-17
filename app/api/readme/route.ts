import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const owner = searchParams.get('owner')
    const repo = searchParams.get('repo')

    if (!owner || !repo) {
      return NextResponse.json(
        { error: '缺少owner或repo参数' },
        { status: 400 }
      )
    }

    // 从GitHub API获取README内容
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GitHub-Trending-Website'
        }
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ content: '该仓库没有README文件' })
      }
      throw new Error(`GitHub API错误: ${response.status}`)
    }

    const data = await response.json()
    
    // 解码base64内容
    const content = Buffer.from(data.content, 'base64').toString('utf-8')
    
    // 限制内容长度（前500字符）
    const previewContent = content.length > 500 
      ? content.substring(0, 500) + '...'
      : content

    return NextResponse.json({
      content: content,
      preview: previewContent,
      encoding: data.encoding,
      size: data.size
    })
  } catch (error) {
    console.error('获取README失败:', error)
    return NextResponse.json(
      { error: '获取README内容失败' },
      { status: 500 }
    )
  }
}