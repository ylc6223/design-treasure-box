#!/usr/bin/env tsx
/**
 * 数据迁移脚本：将 JSON 资源数据迁移到 Supabase
 * 
 * 使用方法：
 * 1. 确保 .env.local 中配置了 Supabase 凭据
 * 2. 运行：npx tsx scripts/migrate-resources-to-supabase.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import type { Database } from '../types/database'

// 手动加载 .env.local
const envPath = path.join(__dirname, '../.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envLines = envContent.split('\n')

for (const line of envLines) {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=')
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim()
    }
  }
}

// 读取环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 错误：缺少 Supabase 环境变量')
  console.error('请确保 .env.local 中配置了：')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY (推荐) 或 NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('\n⚠️  注意：使用 ANON_KEY 需要临时禁用 RLS 策略')
  process.exit(1)
}

console.log('🔑 使用密钥类型:', supabaseServiceKey === process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role (绕过 RLS)' : 'Anon Key (需要 RLS 权限)')

// 创建 Supabase 客户端
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

// 读取 JSON 数据
const resourcesPath = path.join(__dirname, '../data/resources.json')
const resourcesData = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'))

console.log(`📦 读取到 ${resourcesData.length} 个资源`)

// 转换数据格式
const resources = resourcesData.map((resource: any) => ({
  id: resource.id,
  name: resource.name,
  url: resource.url,
  description: resource.description,
  category_id: resource.categoryId,
  tags: resource.tags,
  curator_note: resource.curatorNote,
  is_featured: resource.isFeatured || false,
  curator_rating: resource.rating,
  view_count: resource.viewCount || 0,
  favorite_count: resource.favoriteCount || 0,
}))

async function migrateResources() {
  console.log('\n🚀 开始迁移资源数据到 Supabase...\n')

  let successCount = 0
  let errorCount = 0

  for (const resource of resources) {
    try {
      // 使用 upsert 避免重复插入
      const { error } = await supabase
        .from('resources')
        .upsert(resource, {
          onConflict: 'id',
        })

      if (error) {
        console.error(`❌ 迁移失败: ${resource.name}`)
        console.error(`   错误: ${error.message}`)
        errorCount++
      } else {
        console.log(`✅ 迁移成功: ${resource.name}`)
        successCount++
      }
    } catch (err) {
      console.error(`❌ 迁移失败: ${resource.name}`)
      console.error(`   错误: ${err}`)
      errorCount++
    }
  }

  console.log('\n📊 迁移统计:')
  console.log(`   成功: ${successCount}`)
  console.log(`   失败: ${errorCount}`)
  console.log(`   总计: ${resources.length}`)

  if (errorCount === 0) {
    console.log('\n✨ 所有资源迁移成功！')
  } else {
    console.log('\n⚠️  部分资源迁移失败，请检查错误信息')
  }
}

// 执行迁移
migrateResources()
  .then(() => {
    console.log('\n✅ 迁移完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 迁移失败:', error)
    process.exit(1)
  })
