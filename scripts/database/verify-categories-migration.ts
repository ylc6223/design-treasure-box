#!/usr/bin/env tsx
/**
 * 验证Categories迁移结果
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// 加载环境变量
config({ path: '.env.local' });

async function verifyCategoriesMigration() {
  try {
    console.log('🔍 验证Categories迁移结果...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ 缺少Supabase配置');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 检查Categories表
    console.log('\n📂 检查Categories表:');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('id');

    if (categoriesError) {
      console.log('❌ Categories表查询失败:', categoriesError.message);
      console.log('💡 请确保已在Supabase Dashboard中执行了SQL脚本');
      process.exit(1);
    }

    console.log(`✅ Categories表存在，包含 ${categories?.length || 0} 个分类:`);
    categories?.forEach((cat) => {
      console.log(`   - ${cat.id}: ${cat.name} (${cat.color})`);
    });

    // 测试API
    console.log('\n🌐 测试Categories API...');
    try {
      const response = await fetch('http://localhost:3000/api/categories');
      if (response.ok) {
        const apiData = await response.json();
        console.log(`✅ API响应正常，返回 ${apiData.data?.length || 0} 个分类`);
      } else {
        console.log(`⚠️  API响应异常: ${response.status} ${response.statusText}`);
        console.log('💡 请确保开发服务器正在运行 (pnpm dev)');
      }
    } catch (apiError) {
      console.log('⚠️  无法连接到API，请确保开发服务器正在运行');
    }

    console.log('\n🎉 Categories迁移验证完成!');
    console.log('\n📋 下一步:');
    console.log('1. 启动开发服务器: pnpm dev');
    console.log('2. 访问网站验证前端功能正常');
    console.log('3. 检查分类筛选和导航功能');
  } catch (error) {
    console.error('❌ 验证失败:', error);
    process.exit(1);
  }
}

// 执行验证
verifyCategoriesMigration();
