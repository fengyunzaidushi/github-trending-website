#!/usr/bin/env node

import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
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

// 执行SQL查询的辅助函数
async function executeQuery(queryName, sql) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📊 ${queryName}`)
  console.log(`${'='.repeat(60)}`)
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      // 如果RPC函数不存在，直接使用原始查询
      const { data: rawData, error: rawError } = await supabase
        .from('trending_data')
        .select('*')
        .limit(1)
      
      if (rawError) {
        console.error('❌ 查询失败:', error.message)
        return
      }
      
      console.log('⚠️  需要在Supabase中执行SQL查询，无法在客户端直接运行复杂SQL')
      console.log('💡 请在Supabase Dashboard的SQL编辑器中运行以下查询:')
      console.log('\n```sql')
      console.log(sql)
      console.log('```\n')
      return
    }
    
    if (data && data.length > 0) {
      console.table(data)
    } else {
      console.log('📭 无数据返回')
    }
    
  } catch (err) {
    console.error('❌ 执行查询时出错:', err.message)
  }
}

// 简化版本的数据统计 - 使用Supabase客户端API
async function runBasicAnalysis() {
  console.log('🔍 GitHub Trending 数据库统计分析')
  console.log('='.repeat(60))
  
  try {
    // 1. 基本统计信息
    console.log('\n📈 1. 基本统计信息')
    console.log('-'.repeat(40))
    
    const { data: totalData, error: totalError } = await supabase
      .from('trending_data')
      .select('*', { count: 'exact', head: true })
    
    if (totalError) {
      console.error('查询总数失败:', totalError)
    } else {
      console.log(`总记录数: ${totalData?.length || 0}`)
    }
    
    // 2. 日期范围统计
    console.log('\n📅 2. 日期范围统计')
    console.log('-'.repeat(40))
    
    const { data: dateRange, error: dateError } = await supabase
      .from('trending_data')
      .select('date')
      .order('date', { ascending: true })
      .limit(1)
    
    const { data: dateRangeMax, error: dateErrorMax } = await supabase
      .from('trending_data')
      .select('date')
      .order('date', { ascending: false })
      .limit(1)
    
    if (!dateError && !dateErrorMax && dateRange?.length > 0 && dateRangeMax?.length > 0) {
      console.log(`最早日期: ${dateRange[0].date}`)
      console.log(`最晚日期: ${dateRangeMax[0].date}`)
    }
    
    // 3. 获取所有唯一日期
    const { data: uniqueDates, error: uniqueError } = await supabase
      .from('trending_data')
      .select('date')
    
    if (!uniqueError && uniqueDates) {
      const dates = [...new Set(uniqueDates.map(item => item.date))].sort()
      console.log(`唯一日期数量: ${dates.length}`)
      
      // 4. 按日期统计记录数
      console.log('\n📊 3. 每日记录统计 (前10天)')
      console.log('-'.repeat(40))
      
      const dateCounts = {}
      uniqueDates.forEach(item => {
        dateCounts[item.date] = (dateCounts[item.date] || 0) + 1
      })
      
      const sortedDates = Object.entries(dateCounts)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 10)
      
      sortedDates.forEach(([date, count]) => {
        let status = '✅'
        if (count < 100) status = '❌'
        else if (count < 300) status = '⚠️'
        
        console.log(`${status} ${date}: ${count} 条记录`)
      })
    }
    
    // 5. 类别和周期统计
    console.log('\n🏷️  4. 类别和周期统计')
    console.log('-'.repeat(40))
    
    const { data: categories, error: catError } = await supabase
      .from('trending_data')
      .select('category')
    
    const { data: periods, error: perError } = await supabase
      .from('trending_data')
      .select('period')
    
    if (!catError && categories) {
      const uniqueCategories = [...new Set(categories.map(item => item.category))]
      console.log(`类别: ${uniqueCategories.join(', ')}`)
    }
    
    if (!perError && periods) {
      const uniquePeriods = [...new Set(periods.map(item => item.period))]
      console.log(`周期: ${uniquePeriods.join(', ')}`)
    }
    
    // 6. 查找特定日期的数据
    console.log('\n🔍 5. 特定日期检查')
    console.log('-'.repeat(40))
    
    const checkDates = ['2025-08-01', '2025-08-02', '2025-08-10']
    
    for (const checkDate of checkDates) {
      const { data: dateData, error: dateCheckError } = await supabase
        .from('trending_data')
        .select('*')
        .eq('date', checkDate)
        .limit(5)
      
      if (!dateCheckError) {
        if (dateData.length === 0) {
          console.log(`❌ ${checkDate}: 无数据`)
        } else {
          console.log(`✅ ${checkDate}: ${dateData.length} 条记录`)
        }
      }
    }
    
    // 7. 最近的数据
    console.log('\n⏰ 6. 最新数据概览')
    console.log('-'.repeat(40))
    
    const { data: latestData, error: latestError } = await supabase
      .from('trending_data')
      .select('date, category, period')
      .order('date', { ascending: false })
      .limit(10)
    
    if (!latestError && latestData && latestData.length > 0) {
      console.log(`最新记录日期: ${latestData[0].date}`)
      console.log('最近记录:')
      latestData.slice(0, 5).forEach(record => {
        console.log(`  - ${record.date} | ${record.category} | ${record.period}`)
      })
    }
    
  } catch (error) {
    console.error('❌ 分析过程中出错:', error)
  }
}

// 生成完整的SQL报告
async function generateSQLReport() {
  console.log('\n📝 完整的SQL查询报告')
  console.log('='.repeat(60))
  console.log('请在Supabase Dashboard的SQL编辑器中运行以下查询来获取详细统计：')
  
  const sqlFile = path.join(__dirname, '..', 'database', 'trending_data_analysis.sql')
  
  if (fs.existsSync(sqlFile)) {
    const sqlContent = fs.readFileSync(sqlFile, 'utf-8')
    console.log('\n```sql')
    console.log(sqlContent)
    console.log('```')
  } else {
    console.log('❌ SQL文件未找到:', sqlFile)
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--sql-only')) {
    await generateSQLReport()
  } else {
    await runBasicAnalysis()
    
    if (args.includes('--with-sql')) {
      await generateSQLReport()
    }
  }
  
  console.log('\n✅ 分析完成!')
  console.log('\n💡 使用参数:')
  console.log('  --sql-only    只显示SQL查询')
  console.log('  --with-sql    运行分析并显示SQL查询')
}

// 运行脚本
main().catch(console.error)