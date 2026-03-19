#!/usr/bin/env node
/**
 * enrich-repos.mjs
 *
 * 异步富化脚本：
 * - 从 zread.ai 抓取 1-overview 章节文本（中文版）
 * - 从 GitHub API 抓取 README Markdown（base64 解码）
 * - 结果写入 repo_overviews 表
 *
 * available 值语义：
 *   true  = 成功获取内容
 *   false = 确认无内容（404 / 内容为空）
 *   null  = 网络失败/限速，本次未能判断，跳过写入此字段
 *
 * 用法：
 *   node scripts/enrich-repos.mjs [options]
 *
 * 选项：
 *   --limit N       处理的最大 repo 数量（默认 50）
 *   --delay N       每次请求之间的延迟 ms（默认 500）
 *   --dry-run       只打印，不写入数据库
 *   --repo owner/r  只处理指定 repo（格式: owner/repo_name）
 */

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const githubToken = process.env.GITHUB_TOKEN

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('缺少必要环境变量：NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ─── CLI 参数解析 ────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2)
  const opts = { limit: 50, delay: 500, dryRun: false, repo: null }
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit') opts.limit = parseInt(args[++i]) || 50
    else if (args[i] === '--delay') opts.delay = parseInt(args[++i]) || 500
    else if (args[i] === '--dry-run') opts.dryRun = true
    else if (args[i] === '--repo') opts.repo = args[++i]
  }
  return opts
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── zread.ai 抓取 ───────────────────────────────────────────────────────────

/**
 * 从 HTML 中提取 article#article-content 区域的纯文本。
 *
 * zread.ai 使用 React Streaming，内容分批写入，不能用 </article> 闭合标签。
 * 改为 indexOf 找 article 起始后，取到 <footer / </main> / </body> 截止。
 * React Streaming 会注入 $RS()/$RC() 等内联 JS，需额外清理。
 */
function extractZreadText(html) {
  const startTagMatch = html.match(/<article[^>]*id="article-content"[^>]*>/)
  if (!startTagMatch) return null

  const startIdx = startTagMatch.index + startTagMatch[0].length
  let endIdx = html.length
  for (const b of ['<footer', '</main>', '</body>']) {
    const idx = html.indexOf(b, startIdx)
    if (idx !== -1 && idx < endIdx) endIdx = idx
  }

  let t = html.slice(startIdx, endIdx)
  t = t
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--\$\??-->|<!--\/-->/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<img[^>]*alt="([^"]*)"[^>]*\/?>/gi, (_m, alt) => alt ? '[' + alt + ']' : '')
    .replace(/<img[^>]*\/?>/gi, '')
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_m, s) => '\n# ' + s.replace(/<[^>]+>/g, '').trim() + '\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_m, s) => '\n## ' + s.replace(/<[^>]+>/g, '').trim() + '\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_m, s) => '\n### ' + s.replace(/<[^>]+>/g, '').trim() + '\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_m, s) => '\n#### ' + s.replace(/<[^>]+>/g, '').trim() + '\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, s) => '\n- ' + s.replace(/<[^>]+>/g, '').trim())
    .replace(/<\/p>/gi, '\n').replace(/<\/div>/gi, '\n').replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    // 清理 React Streaming 内联 JS 残留（$RS/$RC/$RB/$RT/$RV 等注入文本节点之间）
    .replace(/\$R[SBCVT][A-Za-z0-9_]*\s*[=(][^\n]*/g, '')
    .replace(/\(function\(\)\{[\s\S]*?\}\)\(\);?/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'").replace(/&#x2F;/g, '/').replace(/&#x60;/g, '`')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (t.length > 8000) t = t.slice(0, 8000) + '\n\n...(截断)'
  return t.length > 50 ? t : null
}

/**
 * 抓取 zread.ai 1-overview
 * 返回：
 *   { available: true,  text: '...' }  — 成功
 *   { available: false, text: null  }  — 404 / 内容为空（确认无内容）
 *   { available: null,  text: null  }  — 网络失败，不写入数据库
 */
async function fetchZreadOverview(owner, repoName) {
  const url = 'https://zread.ai/' + owner + '/' + repoName + '/1-overview'
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; github-trending-bot/1.0)',
        'Accept': 'text/html',
        'Accept-Language': 'zh-CN,zh;q=0.9'
      },
      signal: AbortSignal.timeout(10000)
    })
    if (res.status === 404) return { available: false, text: null }
    if (!res.ok) {
      console.warn('  zread HTTP ' + res.status + ' for ' + owner + '/' + repoName)
      // 非 404 的 HTTP 错误，不确定是否有内容，用 null 跳过写入
      return { available: null, text: null }
    }
    const html = await res.text()
    const text = extractZreadText(html)
    if (!text) return { available: false, text: null }
    return { available: true, text }
  } catch (err) {
    const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError'
    console.warn('  zread ' + (isTimeout ? '超时' : '请求失败') + ' for ' + owner + '/' + repoName)
    // 网络异常 → 用 null 跳过写入，不清空已有数据
    return { available: null, text: null }
  }
}

// ─── GitHub API 抓取 ─────────────────────────────────────────────────────────

async function fetchGithubReadme(owner, repoName) {
  const url = 'https://api.github.com/repos/' + owner + '/' + repoName + '/readme'
  const headers = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'github-trending-bot/1.0' }
  if (githubToken) headers['Authorization'] = 'Bearer ' + githubToken

  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) })
    if (res.status === 404) return { available: false, content: null }
    if (res.status === 403 || res.status === 429) {
      const reset = res.headers.get('x-ratelimit-reset')
      const resetTime = reset ? new Date(parseInt(reset) * 1000).toLocaleTimeString() : '未知'
      console.warn('  GitHub API 限速，重置时间: ' + resetTime)
      return { available: null, content: null }
    }
    if (!res.ok) {
      console.warn('  GitHub API HTTP ' + res.status + ' for ' + owner + '/' + repoName)
      return { available: null, content: null }
    }
    const data = await res.json()
    if (!data.content) return { available: false, content: null }
    const decoded = Buffer.from(data.content, 'base64').toString('utf-8')
    const content = decoded.length > 20000 ? decoded.slice(0, 20000) + '\n\n...(截断)' : decoded
    return { available: true, content }
  } catch (err) {
    const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError'
    console.warn('  GitHub ' + (isTimeout ? '超时' : '请求失败') + ' for ' + owner + '/' + repoName)
    return { available: null, content: null }
  }
}

// ─── 数据库 ──────────────────────────────────────────────────────────────────

async function upsertOverview(repositoryId, payload) {
  const { error } = await supabase
    .from('repo_overviews')
    .upsert({ repository_id: repositoryId, ...payload }, { onConflict: 'repository_id' })
  if (error) { console.error('  DB 写入失败:', error.message); return false }
  return true
}

async function fetchPendingRepos(opts) {
  if (opts.repo) {
    const parts = opts.repo.split('/')
    if (parts.length < 2) { console.error('--repo 格式应为 owner/repo_name'); process.exit(1) }
    const [owner, repoName] = parts
    const { data, error } = await supabase.from('repositories').select('id, owner, repo_name')
      .eq('owner', owner).eq('repo_name', repoName).limit(1)
    if (error) throw error
    return data || []
  }

  const { data: repos, error: err1 } = await supabase.from('repositories')
    .select('id, owner, repo_name')
    .not('owner', 'is', null).not('repo_name', 'is', null)
    .neq('owner', '').neq('repo_name', '')
    .limit(opts.limit * 3)
  if (err1) throw err1

  const { data: existing } = await supabase.from('repo_overviews').select('repository_id')
  const existingIds = new Set((existing || []).map(r => r.repository_id))

  return (repos || []).filter(r => !existingIds.has(r.id)).slice(0, opts.limit)
}

// ─── 主流程 ──────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs()

  console.log('🚀 repo 富化脚本启动')
  console.log('   limit: ' + opts.limit + ' | delay: ' + opts.delay + 'ms | dry-run: ' + opts.dryRun)
  if (opts.repo) console.log('   指定 repo: ' + opts.repo)
  console.log('   GitHub Token: ' + (githubToken ? '✅ 已配置（5000次/小时）' : '⚠️  未配置（匿名 60次/小时）'))
  console.log('')

  let repos
  try {
    console.log('📋 查询待富化的 repo...')
    repos = await fetchPendingRepos(opts)
  } catch (err) {
    console.error('❌ 查询失败:', err.message)
    process.exit(1)
  }

  if (repos.length === 0) {
    console.log('✅ 没有待处理的 repo，已全部富化！')
    return
  }

  console.log('📦 共 ' + repos.length + ' 个 repo 待处理\n')
  let successCount = 0, zreadHit = 0, readmeHit = 0

  for (let i = 0; i < repos.length; i++) {
    const { id, owner, repo_name } = repos[i]
    console.log('[' + (i + 1) + '/' + repos.length + '] ' + owner + '/' + repo_name)

    // 1. zread overview
    const zread = await fetchZreadOverview(owner, repo_name)
    if (zread.available === true) {
      console.log('   zread ✅  ' + (zread.text || '').slice(0, 100).replace(/\n/g, ' '))
      zreadHit++
    } else if (zread.available === false) {
      console.log('   zread ❌  未收录（404 或内容为空）')
    } else {
      console.log('   zread ⚠️  网络失败，保留已有数据')
    }
    await sleep(opts.delay)

    // 2. GitHub README
    const gh = await fetchGithubReadme(owner, repo_name)
    if (gh.available === true) {
      console.log('   github ✅  ' + (gh.content || '').slice(0, 80).replace(/\n/g, ' '))
      readmeHit++
    } else if (gh.available === false) {
      console.log('   github ❌  无 README')
    } else {
      console.log('   github ⚠️  限速或超时，保留已有数据')
    }
    await sleep(opts.delay)

    // 3. 写入 DB
    if (!opts.dryRun) {
      const now = new Date().toISOString()
      const payload = { updated_at: now }

      // 只有确定有结论（true/false）时才写 zread 相关字段；网络失败(null)则跳过
      if (zread.available !== null) {
        payload.zread_available = zread.available
        payload.overview = zread.text ?? null
        payload.overview_fetched_at = now
      }

      // 只有确定有结论（true/false）时才写 github 相关字段
      if (gh.available !== null) {
        payload.readme_available = gh.available
        payload.readme = gh.content ?? null
        payload.readme_fetched_at = now
      }

      const ok = await upsertOverview(id, payload)
      if (ok) { successCount++; console.log('   💾 写入成功') }
    } else {
      console.log('   [dry-run] 跳过写入')
      successCount++
    }
    console.log('')
  }

  console.log('─'.repeat(50))
  console.log('✅ 完成！处理 ' + repos.length + ' 个 repo')
  console.log('   写入成功：' + (opts.dryRun ? '(dry-run)' : successCount + ' 个'))
  console.log('   zread 有数据：' + zreadHit + ' 个')
  console.log('   GitHub README 获取成功：' + readmeHit + ' 个')
}

main().catch(err => { console.error('❌ 脚本异常退出:', err); process.exit(1) })
