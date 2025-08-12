#!/usr/bin/env node

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local')
dotenv.config({ path: envPath })

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
console.log(supabaseUrl)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 生成日期范围
function generateDateRange(startDate, endDate) {
  const dates = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    dates.push(new Date(dt).toISOString().split('T')[0])
  }
  
  return dates
}

// 检查数据库中的日期覆盖情况
async function checkDateCoverage() {
  console.log('🔍 检查数据库中的日期覆盖情况...\n')
  
  try {
    // 查询数据库中所有唯一的日期
    const { data: allDates, error } = await supabase
      .from('trending_data')
      .select('date')
      .order('date', { ascending: true })
    
    if (error) {
      console.error('查询数据库失败:', error)
      return
    }
    
    // 获取唯一日期列表
    const uniqueDates = [...new Set(allDates.map(item => item.date))].sort()
    
    console.log(`📊 数据库中共有 ${uniqueDates.length} 个不同的日期`)
    console.log(`📅 日期范围: ${uniqueDates[0]} 到 ${uniqueDates[uniqueDates.length - 1]}\n`)
    
    // 生成完整的日期范围
    const expectedDates = generateDateRange(uniqueDates[0], uniqueDates[uniqueDates.length - 1])
    
    // 找出缺失的日期
    const missingDates = expectedDates.filter(date => !uniqueDates.includes(date))
    
    if (missingDates.length > 0) {
      console.log(`❌ 发现 ${missingDates.length} 个缺失的日期:`)
      missingDates.forEach(date => {
        console.log(`   - ${date}`)
      })
    } else {
      console.log('✅ 日期范围内没有缺失的日期')
    }
    
    console.log('\n📈 按日期统计数据量:')
    
    // 统计每个日期的数据量
    const { data: dateStats, error: statsError } = await supabase
      .from('trending_data')
      .select('date, category, period')
      .order('date', { ascending: false })
    
    if (statsError) {
      console.error('统计数据失败:', statsError)
      return
    }
    
    // 按日期分组统计
    const statsMap = new Map()
    dateStats.forEach(item => {
      const key = item.date
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          total: 0,
          categories: new Set(),
          periods: new Set()
        })
      }
      const stats = statsMap.get(key)
      stats.total++
      stats.categories.add(item.category)
      stats.periods.add(item.period)
    })
    
    // 显示统计结果
    for (const [date, stats] of statsMap) {
      const categoriesCount = stats.categories.size
      const periodsCount = stats.periods.size
      const expectedTotal = 6 * 3 * 25 // 6个类别 × 3个周期 × 大约25个项目
      
      let status = '✅'
      if (stats.total < expectedTotal * 0.5) {
        status = '❌'
      } else if (stats.total < expectedTotal * 0.8) {
        status = '⚠️'
      }
      
      console.log(`${status} ${date}: ${stats.total} 条记录, ${categoriesCount} 个类别, ${periodsCount} 个周期`)
      
      if (stats.total < 100) {
        console.log(`     类别: ${Array.from(stats.categories).join(', ')}`)
        console.log(`     周期: ${Array.from(stats.periods).join(', ')}`)
      }
    }
    
    // 检查特定日期的详细情况
    console.log('\n🔍 检查8月1日和8月2日的具体情况:')
    
    const checkDates = ['2025-08-01', '2025-08-02']
    for (const checkDate of checkDates) {
      const { data: dateData, error: dateError } = await supabase
        .from('trending_data')
        .select('*')
        .eq('date', checkDate)
        .limit(5)
      
      if (dateError) {
        console.error(`查询 ${checkDate} 数据失败:`, dateError)
        continue
      }
      
      if (dateData.length === 0) {
        console.log(`❌ ${checkDate}: 无数据`)
      } else {
        console.log(`✅ ${checkDate}: 找到 ${dateData.length} 条记录`)
        console.log(`   示例数据:`, dateData[0])
      }
    }
    
  } catch (error) {
    console.error('检查过程中出错:', error)
  }
}

// 运行检查
checkDateCoverage().then(() => {
  console.log('\n✅ 检查完成!')
}).catch(console.error)