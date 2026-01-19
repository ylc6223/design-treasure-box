/**
 * 数据迁移脚本
 * 将现有的 JSON 数据迁移到 Supabase 数据库
 * 
 * 使用方法：
 * 1. 确保 .env.local 中配置了 Supabase 环境变量
 * 2. 运行: npx tsx scripts/migrate-data.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// 从环境变量读取 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 错误：缺少 Supabase 环境变量')
  console.error('请确保 .env.local 中配置了以下变量：')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// 创建 Supabase 客户端（使用 service role key 绕过 RLS）
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 读取 JSON 数据
function loadJsonData<T>(filename: string): T {
  const filePath = path.join(process.cwd(), 'data', filename)
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(fileContent)
}

// 资源数据接口
interface JsonResource {
  id: string
  name: string
  url: string
  description: string
  screenshot: string
  categoryId: string
  tags: string[]
  rating: {
    overall: number
    usability: number
    aesthetics: number
    updateFrequency: number
    freeLevel: number
  }
  curatorNote: string
  isFeatured: boolean
  createdAt: string
  viewCount: number
  favoriteCount: number
}

// 分类数据接口
export interface JsonCategory {
  id: string
  name: string
  icon: string
  description: string
  color: string
}

// 迁移资源数据
async function migrateResources() {
  console.log('\n📦 开始迁移资源数据...')

  try {
    // 读取 JSON 数据
    const resources = loadJsonData<JsonResource[]>('resources.json')
    console.log(`   找到 ${resources.length} 个资源`)

    // 转换数据格式（JSON 字段名 → 数据库字段名）
    const dbResources = resources.map((resource) => ({
      id: resource.id,
      name: resource.name,
      url: resource.url,
      description: resource.description,
      category_id: resource.categoryId,
      tags: resource.tags,
      curator_note: resource.curatorNote,
      is_featured: resource.isFeatured,
      curator_rating: resource.rating,
      view_count: resource.viewCount,
      favorite_count: resource.favoriteCount,
      created_at: resource.createdAt,
      updated_at: resource.createdAt,
    }))

    // 使用 upsert 插入数据（如果已存在则更新）
    const { data: _data, error } = await supabase
      .from('resources')
      .upsert(dbResources, {
        onConflict: 'id',
        ignoreDuplicates: false,
      })

    if (error) {
      throw error
    }

    console.log(`   ✅ 成功迁移 ${resources.length} 个资源`)
  } catch (error) {
    console.error('   ❌ 迁移资源失败:', error)
    throw error
  }
}

// 验证数据
async function verifyData() {
  console.log('\n🔍 验证迁移结果...')

  try {
    // 检查资源数量
    const { count: resourceCount, error: resourceError } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })

    if (resourceError) {
      throw resourceError
    }

    console.log(`   ✅ 数据库中有 ${resourceCount} 个资源`)

    // 检查精选资源
    const { count: featuredCount, error: featuredError } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .eq('is_featured', true)

    if (featuredError) {
      throw featuredError
    }

    console.log(`   ✅ 其中 ${featuredCount} 个为精选资源`)

    // 检查分类分布
    const { data: categories, error: categoryError } = await supabase
      .from('resources')
      .select('category_id')

    if (categoryError) {
      throw categoryError
    }

    const categoryCount = categories?.reduce((acc, item) => {
      acc[item.category_id] = (acc[item.category_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log('   📊 分类分布:')
    Object.entries(categoryCount || {}).forEach(([category, count]) => {
      console.log(`      - ${category}: ${count} 个资源`)
    })
  } catch (error) {
    console.error('   ❌ 验证失败:', error)
    throw error
  }
}

// 主函数
async function main() {
  console.log('🚀 开始数据迁移')
  console.log('=' .repeat(50))

  try {
    // 迁移资源
    await migrateResources()

    // 验证数据
    await verifyData()

    console.log('\n' + '='.repeat(50))
    console.log('✅ 数据迁移完成！')
    console.log('\n💡 提示：')
    console.log('   - 可以在 Supabase 控制台查看迁移的数据')
    console.log('   - 如需重新迁移，直接再次运行此脚本即可（使用 upsert）')
  } catch (error) {
    console.error('\n❌ 迁移失败:', error)
    process.exit(1)
  }
}

// 运行主函数
main()
