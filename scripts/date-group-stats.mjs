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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 运行简单的按日期分组统计
async function runDateGroupStats() {
  console.log('📊 按日期分组统计 - Trending Data')
  console.log('='.repeat(60))
  
  try {
    // 获取原始数据
    const { data: rawData, error } = await supabase
      .from('trending_data')
      .select('date, category, period, stars, stars_today, rank, created_at')
      .order('date', { ascending: false })
    
    if (error) {
      console.error('查询失败:', error)
      return
    }
    
    if (!rawData || rawData.length === 0) {
      console.log('❌ 数据库中无数据')
      return
    }
    
    console.log(`📋 原始数据量: ${rawData.length} 条记录\n`)
    
    // 按日期分组统计
    const statsMap = new Map()
    rawData.forEach(item => {
      const key = item.date
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          date: key,
          total_records: 0,
          categories: new Set(),
          periods: new Set(),
          total_stars: 0,
          total_stars_today: 0,
          min_rank: Infinity,
          max_rank: -Infinity,
          import_times: []
        })
      }
      
      const stats = statsMap.get(key)
      stats.total_records++
      stats.categories.add(item.category)
      stats.periods.add(item.period)
      stats.total_stars += item.stars || 0
      stats.total_stars_today += item.stars_today || 0
      
      if (item.rank) {
        stats.min_rank = Math.min(stats.min_rank, item.rank)
        stats.max_rank = Math.max(stats.max_rank, item.rank)
      }
      
      if (item.created_at) {
        stats.import_times.push(new Date(item.created_at))
      }
    })
    
    // 转换为数组并排序
    const dateStats = Array.from(statsMap.values())
      .map(stats => ({
        date: stats.date,
        total_records: stats.total_records,
        categories_count: stats.categories.size,
        periods_count: stats.periods.size,
        categories: Array.from(stats.categories).sort().join(', '),
        periods: Array.from(stats.periods).sort().join(', '),
        avg_stars: Math.round(stats.total_stars / stats.total_records),
        total_stars_today: stats.total_stars_today,
        min_rank: stats.min_rank === Infinity ? null : stats.min_rank,
        max_rank: stats.max_rank === -Infinity ? null : stats.max_rank,
        data_quality: getDataQuality(stats.total_records),
        first_import: stats.import_times.length > 0 ? 
          new Date(Math.min(...stats.import_times)).toISOString().slice(0, 19).replace('T', ' ') : null,
        last_import: stats.import_times.length > 0 ? 
          new Date(Math.max(...stats.import_times)).toISOString().slice(0, 19).replace('T', ' ') : null
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
    
    // 显示统计结果
    console.log('📈 按日期分组统计结果:')
    console.log('-'.repeat(120))
    
    dateStats.forEach(stats => {
      console.log(`${stats.data_quality} ${stats.date}:`)
      console.log(`   📊 记录数: ${stats.total_records}`)
      console.log(`   🏷️  类别: ${stats.categories_count}个 (${stats.categories})`)  
      console.log(`   ⏰ 周期: ${stats.periods_count}个 (${stats.periods})`)
      console.log(`   ⭐ 平均星数: ${stats.avg_stars}`)
      console.log(`   🌟 今日新增星数: ${stats.total_stars_today}`)
      
      if (stats.min_rank && stats.max_rank) {
        console.log(`   🏆 排名范围: ${stats.min_rank} - ${stats.max_rank}`)
      }
      
      if (stats.first_import) {
        console.log(`   📥 导入时间: ${stats.first_import}${stats.last_import !== stats.first_import ? ' ~ ' + stats.last_import : ''}`)
      }
      
      console.log()
    })
    
    // 汇总统计
    console.log('📊 汇总统计:')
    console.log('-'.repeat(40))
    console.log(`总日期数: ${dateStats.length}`)
    console.log(`总记录数: ${rawData.length}`)
    console.log(`平均每日记录数: ${Math.round(rawData.length / dateStats.length)}`)
    console.log(`最早日期: ${dateStats[dateStats.length - 1]?.date}`)
    console.log(`最晚日期: ${dateStats[0]?.date}`)
    
    // 数据质量分布
    const qualityStats = dateStats.reduce((acc, stats) => {
      acc[stats.data_quality] = (acc[stats.data_quality] || 0) + 1
      return acc
    }, {})
    
    console.log('\n📊 数据质量分布:')
    Object.entries(qualityStats).forEach(([quality, count]) => {
      console.log(`${quality}: ${count} 天`)
    })
    
    // 按月统计
    console.log('\n📅 按月统计:')
    console.log('-'.repeat(40))
    
    const monthlyStats = dateStats.reduce((acc, stats) => {
      const month = stats.date.substring(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = {
          month,
          days: 0,
          total_records: 0,
          dates: []
        }
      }
      acc[month].days++
      acc[month].total_records += stats.total_records
      acc[month].dates.push(stats.date)
      return acc
    }, {})
    
    Object.values(monthlyStats)
      .sort((a, b) => b.month.localeCompare(a.month))
      .forEach(stats => {
        console.log(`${stats.month}: ${stats.days}天, ${stats.total_records}条记录, 平均${Math.round(stats.total_records/stats.days)}条/天`)
      })
    
  } catch (error) {
    console.error('❌ 统计过程中出错:', error)
  }
}

// 数据质量评估函数
function getDataQuality(recordCount) {
  if (recordCount >= 400) return '✅ 完整'
  if (recordCount >= 200) return '⚠️ 部分'  
  return '❌ 不足'
}

// 运行统计
runDateGroupStats().then(() => {
  console.log('\n✅ 统计完成!')
}).catch(console.error)