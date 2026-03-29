#!/usr/bin/env node
/**
 * export_repositories.mjs
 * 
 * 导出 repositories 表的数据到 excel 和 json，每 1000 条一个文件
 * 写入到 d:\github\2015\08\github-trending-website\data
 * 支持 --dry-run 参数，测试时只导出最多5条数据
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
  console.log(`🚀 开始导出 repositories 数据`)
  console.log(`📁 目标文件夹: ${DATA_DIR}`)
  
  if (!fs.existsSync(DATA_DIR)) {
    console.log(`正在创建数据目录 ${DATA_DIR}...`)
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }

  let offset = 0
  const limit = isDryRun ? 5 : 1000 // 如果是 dry-run 则一次最多 5 条
  let fileIndex = 1
  let hasMore = true

  console.log(isDryRun ? '⚠️ 开启 Dry-run 模式：最多只导出 5 条数据' : '📦 正常模式：每 1000 条数据保存为一个文件')

  while (hasMore) {
    console.log(`\n⏳ 正在获取第 ${offset + 1} 到 ${offset + limit} 条数据...`)
    
    // 从 Supabase 获取数据
    const { data, error } = await supabase
      .from('repositories')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
      
    if (error) {
      console.error('❌ 获取数据失败:', error.message)
      process.exit(1)
    }

    if (!data || data.length === 0) {
      console.log('✅ 所有数据已导出完毕！')
      break
    }

    const baseFilename = `repositories_export_part${fileIndex}`
    const jsonFilename = path.join(DATA_DIR, `${baseFilename}.json`)
    const excelFilename = path.join(DATA_DIR, `${baseFilename}.xlsx`)

    // 1. 导出 JSON
    try {
      fs.writeFileSync(jsonFilename, JSON.stringify(data, null, 2), 'utf-8')
      console.log(`   📄 已保存 JSON 文件: ${jsonFilename} (${data.length} 条记录)`)
    } catch (err) {
      console.error(`   ❌ 保存 JSON 文件失败:`, err.message)
    }

    // 2. 导出 Excel
    try {
      const wb = xlsx.utils.book_new()
      const ws = xlsx.utils.json_to_sheet(data)
      xlsx.utils.book_append_sheet(wb, ws, "Repositories")
      xlsx.writeFile(wb, excelFilename)
      console.log(`   📊 已保存 Excel 文件: ${excelFilename} (${data.length} 条记录)`)
    } catch (err) {
      console.error(`   ❌ 保存 Excel 文件失败:`, err.message)
    }

    if (isDryRun || data.length < limit) {
      hasMore = false
      console.log('\n✅ 导出操作已达到结束条件。')
    } else {
      offset += limit
      fileIndex++
    }
  }
}

main().catch(err => {
  console.error('❌ 脚本异常退出:', err)
  process.exit(1)
})
