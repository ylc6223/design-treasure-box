#!/usr/bin/env tsx
/**
 * 简化的Categories表迁移脚本
 * 
 * 使用Supabase JavaScript客户端直接创建表和插入数据
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// 加载环境变量
config({ path: '.env.local' })

// 分类数据
const categoriesData = [
  {
    id: 'color',
    name: '配色工具',
    icon: 'Palette',
    description: '调色板、配色方案生成器',
    color: '#E94560'
  },
  {
    id: 'css',
    name: 'CSS模板',
    icon: 'Code',
    description: 'CSS框架、样式库、动画效果',
    color: '#00D9FF'
  },
  {
    id: 'font',
    name: '字体资源',
    icon: 'Type',
    description: '免费字体、字体配对工具',
    color: '#F8B500'
  },
  {
    id: 'icon',
    name: '图标库',
    icon: 'Shapes',
    description: '图标集、SVG资源',
    color: '#7B68EE'
  },
  {
    id: 'inspiration',
    name: '设计灵感',
    icon: 'Sparkles',
    description: '优秀设计案例、灵感画廊',
    color: '#FF6B6B'
  },
  {
    id: 'website',
    name: '网站案例',
    icon: 'Globe',
    description: '优秀网站设计展示',
    color: '#4ECDC4'
  },
  {
    id: 'ui-kit',
    name: 'UI组件',
    icon: 'Layout',
    description: 'UI Kit、设计系统',
    color: '#95E1D3'
  },
  {
    id: 'mockup',
    name: '样机素材',
    icon: 'Smartphone',
    description: '设备样机、展示模板',
    color: '#DDA0DD'
  }
]

async function migrateCategoriesSimple() {
  try {
    console.log('🚀 开始简化Categories迁移...')
    
    // 从环境变量获取Supabase配置
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SECRET_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ 缺少Supabase配置')
      process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('📊 尝试插入Categories数据...')
    
    // 直接尝试插入数据，如果表不存在会报错
    const { data, error } = await supabase
      .from('categories')
      .upsert(categoriesData, {
        onConflict: 'id'
      })
      .select()
    
    if (error) {
      if (error.message.includes('relation "public.categories" does not exist')) {
        console.log('❌ Categories表不存在')
        console.log('📋 请手动在Supabase Dashboard中执行以下SQL:')
        console.log('   文件: scripts/create-categories-table-simple.sql')
        console.log('   或者访问: https://supabase.com/dashboard/project/qtymidkusovwjamlntsk/sql')
        process.exit(1)
      }
      throw error
    }
    
    console.log('✅ Categories数据插入成功!')
    console.log(`📊 共插入 ${data?.length || 0} 个分类`)
    
    // 验证数据
    const { data: categories, error: selectError } = await supabase
      .from('categories')
      .select('*')
      .order('id')
    
    if (selectError) {
      throw selectError
    }
    
    console.log('\n📂 Categories列表:')
    categories?.forEach(cat => {
      console.log(`   - ${cat.id}: ${cat.name} (${cat.color})`)
    })
    
    console.log('\n🎉 迁移完成!')
    
  } catch (error) {
    console.error('❌ 迁移失败:', error)
    process.exit(1)
  }
}

// 执行迁移
migrateCategoriesSimple()