#!/usr/bin/env node
/**
 * 生成资源数据的 SQL 插入语句
 * 可以直接在 Supabase SQL Editor 中执行
 *
 * 输出文件：supabase/migrations/003_seed_resources.sql
 */

const fs = require('fs');
const path = require('path');

// 读取资源数据
const resourcesPath = path.join(__dirname, '../data/resources.json');
const resources = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));

// 输出到 supabase/migrations 目录
const outputPath = path.join(__dirname, '../supabase/migrations/003_seed_resources.sql');

let sqlContent = `-- 资源数据迁移 SQL
-- 生成时间: ${new Date().toISOString()}
-- 资源数量: ${resources.length}

-- 临时禁用 RLS（迁移完成后记得重新启用）
ALTER TABLE public.resources DISABLE ROW LEVEL SECURITY;

`;

// 生成插入语句
resources.forEach((resource, index) => {
  sqlContent += `
-- ${index + 1}. ${resource.name}
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  '${resource.id}',
  '${resource.name.replace(/'/g, "''")}',
  '${resource.url}',
  '${resource.description.replace(/'/g, "''")}',
  '${resource.categoryId}',
  ARRAY[${resource.tags.map((tag) => `'${tag.replace(/'/g, "''")}'`).join(', ')}],
  '${resource.curatorNote.replace(/'/g, "''")}',
  ${resource.isFeatured || false},
  '${JSON.stringify(resource.rating)}'::jsonb,
  ${resource.viewCount || 0},
  ${resource.favoriteCount || 0}
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  url = EXCLUDED.url,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id,
  tags = EXCLUDED.tags,
  curator_note = EXCLUDED.curator_note,
  is_featured = EXCLUDED.is_featured,
  curator_rating = EXCLUDED.curator_rating,
  view_count = EXCLUDED.view_count,
  favorite_count = EXCLUDED.favorite_count;
`;
});

sqlContent += `
-- 重新启用 RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- 验证迁移
SELECT COUNT(*) as total_resources FROM public.resources;
SELECT id, name, category_id FROM public.resources LIMIT 5;
`;

// 写入文件
fs.writeFileSync(outputPath, sqlContent, 'utf8');

console.log('[SUCCESS] SQL 文件已生成:', outputPath);
console.log('[INFO] 资源数量:', resources.length);
console.log('');
console.log('[INFO] 使用方法:');
console.log('1. 打开 Supabase SQL Editor');
console.log('2. 复制 supabase/migrations/003_seed_resources.sql 的内容');
console.log('3. 粘贴并执行');
console.log('');
console.log('或者直接在 Supabase Dashboard 中上传该文件');
