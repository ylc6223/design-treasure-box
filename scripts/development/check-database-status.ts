#!/usr/bin/env tsx
/**
 * 检查数据库状态脚本
 *
 * 验证当前Supabase数据库中的表结构和数据
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// 加载环境变量
config({ path: '.env.local' });

async function checkDatabaseStatus() {
  try {
    console.log('🔍 检查数据库状态...');

    // 从环境变量获取配置
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    console.log('🔧 配置检查:');
    console.log('- URL:', supabaseUrl ? '✅ 已设置' : '❌ 未设置');
    console.log('- Secret Key:', supabaseKey ? '✅ 已设置' : '❌ 未设置');

    if (!supabaseUrl || !supabaseKey) {
      console.error('\n❌ 缺少Supabase配置');
      console.error('请确保设置了以下环境变量:');
      console.error('- NEXT_PUBLIC_SUPABASE_URL');
      console.error('- SUPABASE_SECRET_KEY');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 检查resources表
    console.log('\n📊 检查Resources表:');
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select('id, name, category_id')
      .limit(5);

    if (resourcesError) {
      console.log('❌ Resources表不存在或查询失败:', resourcesError.message);
    } else {
      console.log(`✅ Resources表存在，包含数据 (显示前5条):`);
      resources?.forEach((r) => {
        console.log(`   - ${r.id}: ${r.name} (分类: ${r.category_id})`);
      });
    }

    // 检查categories表
    console.log('\n📂 检查Categories表:');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('id');

    if (categoriesError) {
      console.log('❌ Categories表不存在或查询失败:', categoriesError.message);
      console.log('💡 需要执行005_create_categories_table.sql迁移');
    } else {
      console.log(`✅ Categories表存在，包含 ${categories?.length || 0} 个分类:`);
      categories?.forEach((cat) => {
        console.log(`   - ${cat.id}: ${cat.name} (${cat.color})`);
      });
    }

    // 检查profiles表
    console.log('\n👤 检查Profiles表:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .limit(3);

    if (profilesError) {
      console.log('❌ Profiles表不存在或查询失败:', profilesError.message);
    } else {
      console.log(`✅ Profiles表存在，包含 ${profiles?.length || 0} 个用户 (显示前3个):`);
      profiles?.forEach((p) => {
        console.log(`   - ${p.email}: ${p.name || '未设置'} (${p.role})`);
      });
    }

    console.log('\n🏁 数据库状态检查完成');
  } catch (error) {
    console.error('❌ 检查失败:', error);
    process.exit(1);
  }
}

// 执行检查
checkDatabaseStatus();
