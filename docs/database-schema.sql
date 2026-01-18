-- 资源表 Schema 设计
-- 为现有 resources 表添加截图相关字段

ALTER TABLE resources ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS screenshot_updated_at TIMESTAMP DEFAULT NOW();

-- 示例数据结构
/*
resources 表结构：
- id: UUID (主键)
- name: TEXT (资源名称)
- url: TEXT (资源网站URL)
- description: TEXT (描述)
- category_id: TEXT (分类ID)
- tags: TEXT[] (标签数组)
- rating: JSONB (评分对象)
- curator_note: TEXT (策展人备注)
- is_featured: BOOLEAN (是否精选)
- created_at: TIMESTAMP (创建时间)
- view_count: INTEGER (浏览次数)
- favorite_count: INTEGER (收藏次数)
- screenshot_url: TEXT (截图CDN链接) -- 新增
- screenshot_updated_at: TIMESTAMP (截图更新时间) -- 新增

screenshot_url 示例：
https://screenshots.your-domain.com/coolors-co-1704067200-abc123.jpg
*/

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_resources_screenshot_updated 
ON resources(screenshot_updated_at);

-- 查询需要更新截图的资源（用于定时任务）
-- 这个查询在 Workers 中不会用到，因为我们要对所有资源截图
SELECT id, name, url, screenshot_url, screenshot_updated_at 
FROM resources 
ORDER BY screenshot_updated_at ASC NULLS FIRST;