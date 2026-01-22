#!/usr/bin/env tsx
/**
 * 手动执行Categories表迁移脚本
 *
 * 用于在远程Supabase实例中创建categories表
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

// 加载环境变量
config({ path: '.env.local' });

async function runMigration() {
  try {
    console.log('🚀 开始执行Categories表迁移...');

    // 从环境变量获取Supabase配置
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ 缺少Supabase配置');
      console.error('请确保设置了以下环境变量:');
      console.error('- NEXT_PUBLIC_SUPABASE_URL');
      console.error('- SUPABASE_SECRET_KEY');
      process.exit(1);
    }

    // 创建Supabase客户端 (使用secret key)
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 读取迁移SQL文件
    const migrationPath = path.join(
      __dirname,
      '../supabase/migrations/005_create_categories_table.sql'
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 读取迁移文件:', migrationPath);

    // 分割SQL语句并清理
    const statements = migrationSQL
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

    console.log(`📝 发现 ${statements.length} 条SQL语句`);

    // 逐条执行SQL语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'; // 重新添加分号
      console.log(`⚡ 执行语句 ${i + 1}/${statements.length}...`);

      try {
        // 直接使用SQL查询而不是rpc
        const { error } = await supabase.rpc('query', statement);

        if (error) {
          // 如果是"已存在"错误，继续执行
          if (
            error.message?.includes('already exists') ||
            error.message?.includes('duplicate key')
          ) {
            console.log(`⚠️  跳过已存在的对象: ${error.message}`);
            continue;
          }
          throw error;
        }

        console.log(`✅ 语句 ${i + 1} 执行成功`);
      } catch (sqlError: any) {
        console.log(`❌ 语句 ${i + 1} 执行失败:`, sqlError.message);
        console.log(`📝 SQL: ${statement.substring(0, 100)}...`);

        // 对于某些错误，我们继续执行
        if (
          sqlError.message?.includes('already exists') ||
          sqlError.message?.includes('duplicate key')
        ) {
          console.log(`⚠️  继续执行下一条语句...`);
          continue;
        }

        throw sqlError;
      }
    }

    // 验证迁移结果
    console.log('\n🔍 验证Categories表...');
    const { data: categories, error: selectError } = await supabase
      .from('categories')
      .select('*')
      .order('id');

    if (selectError) {
      throw selectError;
    }

    console.log('✅ Categories表创建成功!');
    console.log(`📊 共有 ${categories?.length || 0} 个分类:`);

    categories?.forEach((cat) => {
      console.log(`   - ${cat.id}: ${cat.name} (${cat.color})`);
    });

    console.log('\n🎉 迁移完成!');
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
}

// 执行迁移
runMigration();
