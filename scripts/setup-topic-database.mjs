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
  console.error('请设置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  try {
    console.log('🚀 开始设置topic数据库...')
    
    // 读取SQL脚本文件
    const sqlFilePath = path.join(__dirname, 'setup-topic-database.sql')
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL脚本文件不存在: ${sqlFilePath}`)
    }

    const sqlScript = fs.readFileSync(sqlFilePath, 'utf-8')
    
    console.log('📖 正在执行SQL脚本...')
    
    // 执行SQL脚本
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlScript })
    
    if (error) {
      console.error('❌ 执行SQL脚本失败:', error)
      
      // 如果rpc方法不存在，尝试逐条执行SQL语句
      console.log('🔄 尝试逐条执行SQL语句...')
      await executeSqlStepByStep(sqlScript)
    } else {
      console.log('✅ SQL脚本执行成功')
    }

    // 验证表是否创建成功
    await verifyTables()
    
    console.log('🎉 数据库设置完成!')
    
  } catch (error) {
    console.error('❌ 数据库设置失败:', error)
    process.exit(1)
  }
}

async function executeSqlStepByStep(sqlScript) {
  // 分割SQL语句（以分号分隔，但忽略函数内的分号）
  const statements = splitSqlStatements(sqlScript)
  
  console.log(`📝 发现 ${statements.length} 条SQL语句`)
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim()
    
    if (!statement || statement.startsWith('--')) {
      continue // 跳过空语句和注释
    }
    
    console.log(`执行语句 ${i + 1}/${statements.length}...`)
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
      
      if (error) {
        console.error(`❌ 语句 ${i + 1} 执行失败:`, error.message)
        console.log('SQL:', statement.substring(0, 100) + '...')
      } else {
        console.log(`✅ 语句 ${i + 1} 执行成功`)
      }
    } catch (err) {
      console.error(`❌ 语句 ${i + 1} 执行异常:`, err)
    }
    
    // 添加延迟避免过快请求
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

function splitSqlStatements(sql) {
  // 简单的SQL语句分割，可能需要根据实际情况调整
  const statements = []
  let current = ''
  let inFunction = false
  let dollarQuoteTag = null
  
  const lines = sql.split('\n')
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // 检查是否进入或退出函数定义
    if (trimmedLine.includes('$$')) {
      if (!dollarQuoteTag) {
        dollarQuoteTag = '$$'
        inFunction = true
      } else if (trimmedLine.includes(dollarQuoteTag)) {
        inFunction = false
        dollarQuoteTag = null
      }
    }
    
    current += line + '\n'
    
    // 如果不在函数内且遇到分号，则分割语句
    if (!inFunction && trimmedLine.endsWith(';') && !trimmedLine.startsWith('--')) {
      statements.push(current.trim())
      current = ''
    }
  }
  
  // 添加最后一个语句（如果有的话）
  if (current.trim()) {
    statements.push(current.trim())
  }
  
  return statements
}

async function verifyTables() {
  console.log('🔍 验证表是否创建成功...')
  
  const tables = ['topic_repositories', 'topics', 'repository_topics']
  
  for (const tableName of tables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`⚠️ 表 ${tableName} 可能不存在或无权限访问: ${error.message}`)
      } else {
        console.log(`✅ 表 ${tableName} 验证成功`)
      }
    } catch (err) {
      console.log(`⚠️ 表 ${tableName} 验证失败: ${err.message}`)
    }
  }
}

// 主函数
async function main() {
  console.log('🗄️ Topic数据库设置工具')
  console.log('=======================')
  
  await setupDatabase()
}

main().catch(console.error)