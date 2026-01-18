-- 验证截图服务数据库 Schema
-- 在 Supabase SQL Editor 中运行此脚本来验证数据库准备情况

-- 1. 检查 resources 表是否存在截图字段
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'resources' 
    AND table_schema = 'public'
    AND column_name IN ('screenshot_url', 'screenshot_updated_at', 'screenshot_error')
ORDER BY column_name;

-- 预期结果：应该看到3行记录
-- screenshot_error | text | YES | NULL
-- screenshot_updated_at | timestamp with time zone | YES | NULL  
-- screenshot_url | text | YES | NULL

-- 2. 检查相关索引是否存在
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'resources' 
    AND schemaname = 'public'
    AND (indexname LIKE '%screenshot%')
ORDER BY indexname;

-- 预期结果：应该看到2个索引
-- idx_resources_screenshot_null
-- idx_resources_screenshot_updated

-- 3. 统计当前资源状态
SELECT 
    COUNT(*) as total_resources,
    COUNT(screenshot_url) as resources_with_screenshots,
    COUNT(screenshot_error) as resources_with_errors,
    COUNT(*) - COUNT(screenshot_url) as resources_needing_screenshots
FROM public.resources;

-- 4. 查看需要截图的资源（前5个）
SELECT 
    id,
    name,
    url,
    screenshot_url,
    screenshot_updated_at,
    screenshot_error
FROM public.resources 
WHERE screenshot_url IS NULL 
ORDER BY created_at 
LIMIT 5;

-- 5. 如果有截图，查看最近更新的（前5个）
SELECT 
    id,
    name,
    screenshot_url,
    screenshot_updated_at
FROM public.resources 
WHERE screenshot_url IS NOT NULL 
ORDER BY screenshot_updated_at DESC NULLS LAST
LIMIT 5;