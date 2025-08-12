#!/usr/bin/env tsx

import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local')
console.log('Loading env from:', envPath)
console.log('Env file exists:', fs.existsSync(envPath))

dotenv.config({ path: envPath })

// Debug environment variables
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET')

import { supabaseAdmin } from '../lib/supabase'
import { TrendingCategory, TrendingPeriod, RawTrendingData } from '../types/database'

// 文件映射配置
const FILE_MAPPINGS = [
  { prefix: '00_alldaily', category: 'all' as TrendingCategory, period: 'daily' as TrendingPeriod },
  { prefix: '01_allweekly', category: 'all' as TrendingCategory, period: 'weekly' as TrendingPeriod },
  { prefix: '02_allmonthly', category: 'all' as TrendingCategory, period: 'monthly' as TrendingPeriod },
  { prefix: '03_daily', category: 'python' as TrendingCategory, period: 'daily' as TrendingPeriod },
  { prefix: '04_weekly', category: 'python' as TrendingCategory, period: 'weekly' as TrendingPeriod },
  { prefix: '05_monthly', category: 'python' as TrendingCategory, period: 'monthly' as TrendingPeriod },
  { prefix: '06_tsdaily', category: 'typescript' as TrendingCategory, period: 'daily' as TrendingPeriod },
  { prefix: '07_tsweekly', category: 'typescript' as TrendingCategory, period: 'weekly' as TrendingPeriod },
  { prefix: '08_tsmonthly', category: 'typescript' as TrendingCategory, period: 'monthly' as TrendingPeriod },
  { prefix: '09_jsdaily', category: 'javascript' as TrendingCategory, period: 'daily' as TrendingPeriod },
  { prefix: '10_jsweekly', category: 'javascript' as TrendingCategory, period: 'weekly' as TrendingPeriod },
  { prefix: '11_jsmonthly', category: 'javascript' as TrendingCategory, period: 'monthly' as TrendingPeriod },
  { prefix: '12_jupyterdaily', category: 'jupyter' as TrendingCategory, period: 'daily' as TrendingPeriod },
  { prefix: '13_jupyterweekly', category: 'jupyter' as TrendingCategory, period: 'weekly' as TrendingPeriod },
  { prefix: '14_jupytermonthly', category: 'jupyter' as TrendingCategory, period: 'monthly' as TrendingPeriod },
  { prefix: '15_vuedaily', category: 'vue' as TrendingCategory, period: 'daily' as TrendingPeriod },
  { prefix: '16_vueweekly', category: 'vue' as TrendingCategory, period: 'weekly' as TrendingPeriod },
  { prefix: '17_vuemonthly', category: 'vue' as TrendingCategory, period: 'monthly' as TrendingPeriod },
]

// 解析星标数字符串
function parseStarsNumber(starsStr: string): number {
  if (!starsStr) return 0
  
  // 移除逗号和其他非数字字符
  const cleaned = starsStr.replace(/[,\s]/g, '')
  const num = parseInt(cleaned)
  return isNaN(num) ? 0 : num
}

// 解析今日星标数
function parseStarsToday(starsTodayStr: string): number {
  if (!starsTodayStr) return 0
  
  // 提取数字部分，例如 "1,217 stars today" -> 1217
  const match = starsTodayStr.match(/(\d{1,3}(?:,\d{3})*)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''))
  }
  return 0
}

// 从仓库名提取owner和repo_name
function parseRepoName(fullName: string) {
  const parts = fullName.split(' /')
  if (parts.length >= 2) {
    return {
      owner: parts[0].trim(),
      repo_name: parts[1].trim()
    }
  }
  return {
    owner: '',
    repo_name: fullName
  }
}

// 转换日期格式
function parseChineseDate(dateStr: string): string {
  // 将 "06月17日" 格式转换为 "2024-06-17" 格式
  const currentYear = new Date().getFullYear()
  const match = dateStr.match(/(\d{1,2})月(\d{1,2})日/)
  
  if (match) {
    const month = match[1].padStart(2, '0')
    const day = match[2].padStart(2, '0')
    return `${currentYear}-${month}-${day}`
  }
  
  return dateStr
}

// 读取JSONL文件
function readJsonlFile(filePath: string): RawTrendingData[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.trim().split('\n').filter(line => line.trim())
    
    return lines.map(line => {
      try {
        return JSON.parse(line) as RawTrendingData
      } catch (e) {
        console.warn(`Failed to parse line: ${line}`)
        return null
      }
    }).filter(Boolean) as RawTrendingData[]
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error)
    return []
  }
}

// 插入或更新仓库信息
async function upsertRepository(repoData: {
  name: string
  url: string
  description: string
  zh_description: string
  language: string
  owner: string
  repo_name: string
}) {
  const { data, error } = await supabaseAdmin
    .from('repositories')
    .upsert(repoData, {
      onConflict: 'url',
      ignoreDuplicates: false
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error upserting repository:', error)
    return null
  }

  return data.id
}

// 插入趋势数据
async function insertTrendingData(trendingData: {
  repository_id: string
  date: string
  category: TrendingCategory
  period: TrendingPeriod
  stars: number
  forks: number
  stars_today: number
  rank: number
}) {
  const { error } = await supabaseAdmin
    .from('trending_data')
    .upsert(trendingData, {
      onConflict: 'repository_id,date,category,period',
      ignoreDuplicates: false
    })

  if (error) {
    console.error('Error inserting trending data:', error)
    return false
  }

  return true
}

// 处理单个文件
async function processFile(filePath: string, category: TrendingCategory, period: TrendingPeriod) {
  console.log(`Processing file: ${filePath} (${category}/${period})`)
  
  const rawData = readJsonlFile(filePath)
  
  for (const dayData of rawData) {
    for (const [dateStr, repos] of Object.entries(dayData)) {
      const date = parseChineseDate(dateStr)
      
      for (let i = 0; i < repos.length; i++) {
        const repo = repos[i]
        const { owner, repo_name } = parseRepoName(repo.name)
        
        // 插入或更新仓库信息
        const repositoryId = await upsertRepository({
          name: repo.name,
          url: repo.url,
          description: repo.description || '',
          zh_description: repo.zh_des || '',
          language: repo.language || '',
          owner,
          repo_name
        })

        if (!repositoryId) {
          console.error(`Failed to upsert repository: ${repo.name}`)
          continue
        }

        // 插入趋势数据
        await insertTrendingData({
          repository_id: repositoryId,
          date,
          category,
          period,
          stars: parseStarsNumber(repo.stars),
          forks: parseStarsNumber(repo.forks),
          stars_today: parseStarsToday(repo.stars_today),
          rank: i + 1
        })
      }
    }
  }
  
  console.log(`Completed processing: ${filePath}`)
}

// 主函数
async function main() {
  const dataDir = path.join(process.cwd(), '../data/github')
  
  console.log('Starting data import...')
  console.log(`Data directory: ${dataDir}`)
  
  for (const mapping of FILE_MAPPINGS) {
    const filePath = path.join(dataDir, `${mapping.prefix}_list.jsonl`)
    
    if (fs.existsSync(filePath)) {
      await processFile(filePath, mapping.category, mapping.period)
    } else {
      console.warn(`File not found: ${filePath}`)
    }
  }
  
  console.log('Data import completed!')
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error)
}