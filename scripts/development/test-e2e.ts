/**
 * 端到端测试脚本
 * 
 * 验证关键功能是否正常工作
 * 运行方式：npx tsx scripts/test-e2e.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database'

// 加载环境变量
config({ path: resolve(process.cwd(), '.env.local') })

// 从环境变量获取 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 缺少 Supabase 环境变量')
  console.error('请确保 .env.local 文件包含：')
  console.error('  NEXT_PUBLIC_SUPABASE_URL')
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

const results: TestResult[] = []

function logTest(name: string, passed: boolean, error?: string) {
  results.push({ name, passed, error })
  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${name}`)
  if (error) {
    console.log(`   错误: ${error}`)
  }
}

async function testDatabaseConnection() {
  console.log('\n📊 测试 1: 数据库连接')
  try {
    const { error } = await supabase.from('profiles').select('count').limit(1)
    logTest('数据库连接', !error, error?.message)
  } catch (error) {
    logTest('数据库连接', false, String(error))
  }
}

async function testTablesExist() {
  console.log('\n📊 测试 2: 数据表存在性')
  
  const tables = ['profiles', 'resources', 'ratings']
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table as any).select('count').limit(1)
      logTest(`表 ${table} 存在`, !error, error?.message)
    } catch (error) {
      logTest(`表 ${table} 存在`, false, String(error))
    }
  }
}

async function testRLSPolicies() {
  console.log('\n📊 测试 3: RLS 策略')
  
  // 测试公开读取
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .limit(1)
    
    logTest('Resources 表公开可读', !error && data !== null, error?.message)
  } catch (error) {
    logTest('Resources 表公开可读', false, String(error))
  }
  
  try {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .limit(1)
    
    logTest('Ratings 表公开可读', !error && data !== null, error?.message)
  } catch (error) {
    logTest('Ratings 表公开可读', false, String(error))
  }
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    logTest('Profiles 表公开可读', !error && data !== null, error?.message)
  } catch (error) {
    logTest('Profiles 表公开可读', false, String(error))
  }
}

async function testDataIntegrity() {
  console.log('\n📊 测试 4: 数据完整性')
  
  // 检查是否有资源数据
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('count')
    
    const hasData = !error && data && data.length > 0
    logTest('Resources 表有数据', hasData, error?.message)
  } catch (error) {
    logTest('Resources 表有数据', false, String(error))
  }
  
  // 检查资源数据结构
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('id, name, url, category_id, curator_rating')
      .limit(1)
      .single()
    
    if (error) {
      logTest('Resources 数据结构正确', false, error.message)
    } else if (!data) {
      logTest('Resources 数据结构正确', false, '没有数据')
    } else {
      const resource = data as any;
      const hasRequiredFields =
        resource.id &&
        resource.name &&
        resource.url &&
        resource.category_id &&
        resource.curator_rating

      logTest('Resources 数据结构正确', hasRequiredFields,
        hasRequiredFields ? undefined : '缺少必填字段')
    }
  } catch (error) {
    logTest('Resources 数据结构正确', false, String(error))
  }
}

async function testAPIEndpoints() {
  console.log('\n📊 测试 5: API 端点')
  
  const baseUrl = 'http://localhost:3000'
  
  // 测试评分查询 API
  try {
    const { data: resources } = await supabase
      .from('resources')
      .select('id')
      .limit(1)
      .single()

    if (resources) {
      const resource = resources as any;
      const response = await fetch(`${baseUrl}/api/ratings/${resource.id}`)
      const passed = response.ok
      logTest('评分查询 API', passed, passed ? undefined : `状态码: ${response.status}`)
    } else {
      logTest('评分查询 API', false, '没有资源数据用于测试')
    }
  } catch (error) {
    logTest('评分查询 API', false, String(error))
  }
}

async function runTests() {
  console.log('🚀 开始端到端测试...\n')
  console.log('=' .repeat(50))
  
  await testDatabaseConnection()
  await testTablesExist()
  await testRLSPolicies()
  await testDataIntegrity()
  await testAPIEndpoints()
  
  console.log('\n' + '='.repeat(50))
  console.log('\n📈 测试总结:')
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length
  
  console.log(`✅ 通过: ${passed}/${total}`)
  console.log(`❌ 失败: ${failed}/${total}`)
  console.log(`📊 成功率: ${((passed / total) * 100).toFixed(1)}%`)
  
  if (failed > 0) {
    console.log('\n❌ 失败的测试:')
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`  - ${r.name}`)
        if (r.error) {
          console.log(`    错误: ${r.error}`)
        }
      })
  }
  
  console.log('\n' + '='.repeat(50))
  
  // 退出码
  process.exit(failed > 0 ? 1 : 0)
}

// 运行测试
runTests().catch(error => {
  console.error('❌ 测试运行失败:', error)
  process.exit(1)
})
