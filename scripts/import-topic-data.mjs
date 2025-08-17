import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oavfrzhquoxhmbluwgny.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hdmZyemhxdW94aG1ibHV3Z255Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDI0NTk2NCwiZXhwIjoyMDU5ODIxOTY0fQ.fvKlV0c_gHQ_FqR6A8hjTnuv7VOxldf8rJU1fdJcPTI'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少Supabase环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GitHubRepo数据结构
// {
//   id: number
//   name: string
//   full_name: string
//   html_url: string
//   description: string | null
//   created_at: string
//   updated_at: string
//   pushed_at: string | null
//   size: number
//   stargazers_count: number
//   language: string | null
//   topics: string[]
//   owner: string
// }

async function importTopicData(jsonFilePath) {
  try {
    console.log(`📖 正在读取文件: ${jsonFilePath}`)
    
    if (!fs.existsSync(jsonFilePath)) {
      throw new Error(`文件不存在: ${jsonFilePath}`)
    }

    const fileContent = fs.readFileSync(jsonFilePath, 'utf-8')
    const repositories = JSON.parse(fileContent)

    console.log(`📊 找到 ${repositories.length} 个仓库记录`)

    // 批量导入数据
    const batchSize = 50
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < repositories.length; i += batchSize) {
      const batch = repositories.slice(i, i + batchSize)
      
      console.log(`📦 正在处理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(repositories.length / batchSize)}`)

      try {
        // 转换数据格式
        const dataToInsert = batch.map(repo => ({
          github_id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          html_url: repo.html_url,
          description: repo.description,
          zh_description: null, // 暂时为空，可以后续翻译
          created_at: repo.created_at,
          updated_at: repo.updated_at,
          pushed_at: repo.pushed_at,
          size: repo.size,
          stargazers_count: repo.stargazers_count,
          language: repo.language,
          topics: repo.topics,
          owner: repo.owner,
          readme_content: repo.readme, // 暂时为空，可以后续获取
          added_at: new Date().toISOString()
        }))

        // 使用upsert避免重复数据
        const { data, error } = await supabase
          .from('topic_repositories')
          .upsert(dataToInsert, {
            onConflict: 'github_id',
            ignoreDuplicates: false
          })

        if (error) {
          console.error(`❌ 批次 ${Math.floor(i / batchSize) + 1} 导入失败:`, error)
          errorCount += batch.length
        } else {
          console.log(`✅ 批次 ${Math.floor(i / batchSize) + 1} 导入成功`)
          successCount += batch.length
        }
      } catch (batchError) {
        console.error(`❌ 批次 ${Math.floor(i / batchSize) + 1} 处理失败:`, batchError)
        errorCount += batch.length
      }

      // 添加延迟避免API限制
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`\n📈 导入完成统计:`)
    console.log(`✅ 成功: ${successCount} 条记录`)
    console.log(`❌ 失败: ${errorCount} 条记录`)
    console.log(`📊 总计: ${repositories.length} 条记录`)

    // 显示统计信息
    await showStats()

  } catch (error) {
    console.error('❌ 导入过程出现错误:', error)
    process.exit(1)
  }
}

async function showStats() {
  try {
    console.log('\n📊 数据库统计信息:')
    
    // 总仓库数
    const { count: totalRepos } = await supabase
      .from('topic_repositories')
      .select('*', { count: 'exact', head: true })
    
    console.log(`📦 总仓库数: ${totalRepos}`)

    // 按语言统计
    const { data: languageStats } = await supabase
      .from('topic_repositories')
      .select('language')
      .not('language', 'is', null)

    if (languageStats) {
      const langCounts = languageStats.reduce((acc, { language }) => {
        acc[language] = (acc[language] || 0) + 1
        return acc
      }, {})

      const topLanguages = Object.entries(langCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)

      console.log('\n🔤 热门编程语言 (前10):')
      topLanguages.forEach(([lang, count], index) => {
        console.log(`${index + 1}. ${lang}: ${count} 个仓库`)
      })
    }

    // 按topic统计
    const { data: topicData } = await supabase
      .from('topic_repositories')
      .select('topics')
      .not('topics', 'is', null)

    if (topicData) {
      const topicCounts = new Map()
      topicData.forEach(({ topics }) => {
        if (topics && Array.isArray(topics)) {
          topics.forEach(topic => {
            topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
          })
        }
      })

      const topTopics = Array.from(topicCounts.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)

      console.log('\n🏷️ 热门话题 (前10):')
      topTopics.forEach(([topic, count], index) => {
        console.log(`${index + 1}. ${topic}: ${count} 个仓库`)
      })
    }

  } catch (error) {
    console.error('❌ 获取统计信息失败:', error)
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log('使用方法: node import-topic-data.mjs <json文件路径>')
    console.log('例如: node import-topic-data.mjs "../docs/claude code_2025-07-24_created_2025-07-22..2025-07-24_topic_claude_code_6.json"')
    process.exit(1)
  }

  const jsonFilePath = path.resolve(args[0])
  
  console.log('🚀 开始导入topic数据...')
  console.log(`📁 数据文件: ${jsonFilePath}`)
  
  await importTopicData(jsonFilePath)
  
  console.log('🎉 导入完成!')
}

main().catch(console.error)