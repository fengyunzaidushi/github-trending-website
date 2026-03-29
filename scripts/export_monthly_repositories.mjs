#!/usr/bin/env node
/**
 * export_monthly_repositories.mjs
 * 
 * 获取当月起所有的 repositories 数据（按 created_at 排序）
 * 每次执行会抓取全部当月数据后，覆盖更新一个固定的 JSON 和 Excel 文件。
 * 支持 --dry-run 参数，测试时只导出最多 5 条数据。
 */

import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import xlsx from 'xlsx'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT_DIR = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT_DIR, 'data')

dotenv.config({ path: path.join(ROOT_DIR, '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('缺少必要环境变量：NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// 解析命令行参数
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')

async function main() {
  console.log(`🚀 开始导出当月 repositories 数据`)
  
  // 获取当前月的第一天 00:00:00 的 UTC 时间格式
  const now = new Date()
  const firstDayOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstDayStr = firstDayOfThisMonth.toISOString()
  
  // 当月文件夹，如 month03
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0')
  const TARGET_DIR = path.join(DATA_DIR, `month${currentMonthStr}`)

  console.log(`📅 获取从 ${firstDayStr} 起的数据...`)
  console.log(`📁 目标文件夹: ${TARGET_DIR}`)
  
  if (!fs.existsSync(TARGET_DIR)) {
    console.log(`正在创建数据目录 ${TARGET_DIR}...`)
    fs.mkdirSync(TARGET_DIR, { recursive: true })
  }

  let offset = 0
  const limit = isDryRun ? 5 : 1000 // 如果是 dry-run 则一次最多拉取 5 条
  let hasMore = true
  let allData = []

  console.log(isDryRun ? '⚠️ 开启 Dry-run 模式：最多只导出 5 条数据' : '📦 正常模式：获取当月所有数据后进行文件覆盖')

  while (hasMore) {
    console.log(`\n⏳ 正在获取第 ${offset + 1} 到 ${offset + limit} 条数据...`)
    
    // 从 Supabase 获取数据，按 created_at >= 第一天 & 倒序排列
    const { data, error } = await supabase
      .from('repositories')
      .select('*')
      .gte('created_at', firstDayStr)
      .order('created_at', { ascending: false }) // false=降序(最新在前)，true=升序
      .range(offset, offset + limit - 1)
      
    if (error) {
      console.error('❌ 获取数据失败:', error.message)
      process.exit(1)
    }

    if (!data || data.length === 0) {
      console.log('✅ 当前区间无更多数据！')
      break
    }

    // 收集所有拉取到的数据
    allData = allData.concat(data)

    if (isDryRun || data.length < limit) {
      hasMore = false
      console.log('\n✅ 数据拉取达到结束条件。')
    } else {
      offset += limit
    }
  }

  console.log(`\n🎉 数据拉取完毕！共获取到 ${allData.length} 条当月记录。`)
  
  if (allData.length > 0) {
    // 固定写到一个文件中，实现每日覆盖更新
    const baseFilename = `repositories_current_month`
    const jsonFilename = path.join(TARGET_DIR, `${baseFilename}.json`)
    const excelFilename = path.join(TARGET_DIR, `${baseFilename}.xlsx`)
    const overviewFilename = path.join(TARGET_DIR, `repositories_overview.json`)

    // 1. 导出并覆盖 JSON
    try {
      fs.writeFileSync(jsonFilename, JSON.stringify(allData, null, 2), 'utf-8')
      console.log(`   📄 已覆盖保存 JSON 文件: ${jsonFilename}`)
    } catch (err) {
      console.error(`   ❌ 保存 JSON 文件失败:`, err.message)
    }

    // 2. 导出并覆盖 Excel
    try {
      const wb = xlsx.utils.book_new()
      const ws = xlsx.utils.json_to_sheet(allData)
      xlsx.utils.book_append_sheet(wb, ws, "Repositories")
      xlsx.writeFile(wb, excelFilename)
      console.log(`   📊 已覆盖保存 Excel 文件: ${excelFilename}`)
    } catch (err) {
      console.error(`   ❌ 保存 Excel 文件失败:`, err.message)
    }

    // 3. 导出前 300 条精简版 (保留 overview 字段，但截取前 300 字符)
    try {
      const top300 = allData.slice(0, 300).map(item => {
        const simplifiedItem = { ...item };
        if (typeof simplifiedItem.overview === 'string' && simplifiedItem.overview.length > 300) {
          simplifiedItem.overview = simplifiedItem.overview.substring(0, 300) + '...';
        }
        return simplifiedItem;
      });
      fs.writeFileSync(overviewFilename, JSON.stringify(top300, null, 2), 'utf-8')
      console.log(`   📝 已覆盖保存精简版(Overview) JSON 文件: ${overviewFilename} (${top300.length} 条记录)`)
    } catch (err) {
      console.error(`   ❌ 保存精简版(Overview)文件失败:`, err.message)
    }
  } else {
    console.log('⚠️ 当月尚无新数据，未生成文件。')
  }
}

main().catch(err => {
  console.error('❌ 脚本异常退出:', err)
  process.exit(1)
})
