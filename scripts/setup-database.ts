#!/usr/bin/env tsx

import fs from 'fs'
import path from 'path'
import { supabaseAdmin } from '../lib/supabase'

async function setupDatabase() {
  console.log('Setting up database schema...')
  
  try {
    // 读取SQL文件
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8')
    
    // 将SQL分割成单独的语句
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
    
    // 执行每个SQL语句
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 100)}...`)
        
        const { error } = await supabaseAdmin.rpc('execute_sql', {
          sql: statement
        })
        
        if (error) {
          console.error('Error executing SQL:', error)
          // 继续执行其他语句，某些语句可能会因为表已存在而失败
        } else {
          console.log('✓ Statement executed successfully')
        }
      }
    }
    
    console.log('Database setup completed!')
    
  } catch (error) {
    console.error('Error setting up database:', error)
    
    // 如果RPC方法不可用，尝试手动创建基本表结构
    console.log('Falling back to manual table creation...')
    
    await createTablesManually()
  }
}

async function createTablesManually() {
  console.log('Creating tables manually...')
  
  // 创建repositories表
  const { error: repoError } = await supabaseAdmin
    .from('repositories')
    .select('id')
    .limit(1)
  
  if (repoError && repoError.message.includes('does not exist')) {
    console.log('Please run the SQL schema manually in Supabase dashboard.')
    console.log('Schema file location: database/schema.sql')
  }
}

// 运行脚本
if (require.main === module) {
  setupDatabase().catch(console.error)
}