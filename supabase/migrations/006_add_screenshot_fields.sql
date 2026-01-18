-- supabase/migrations/006_add_screenshot_fields.sql
-- 为 resources 表添加截图相关字段

-- 添加截图相关字段
ALTER TABLE public.resources 
ADD COLUMN IF NOT EXISTS screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS screenshot_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS screenshot_error TEXT;

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_resources_screenshot_null 
ON public.resources(id) WHERE screenshot_url IS NULL;

CREATE INDEX IF NOT EXISTS idx_resources_screenshot_updated 
ON public.resources(screenshot_updated_at);

-- 添加注释说明字段用途
COMMENT ON COLUMN public.resources.screenshot_url IS '资源截图的 URL 地址';
COMMENT ON COLUMN public.resources.screenshot_updated_at IS '截图最后更新时间';
COMMENT ON COLUMN public.resources.screenshot_error IS '截图生成失败时的错误信息';