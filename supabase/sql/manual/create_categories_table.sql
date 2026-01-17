-- 简化的Categories表创建脚本
-- 可以直接在Supabase Dashboard的SQL编辑器中执行

-- 创建分类表
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT NOT NULL,
  color TEXT NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 插入分类数据
INSERT INTO public.categories (id, name, icon, description, color) VALUES
  ('color', '配色工具', 'Palette', '调色板、配色方案生成器', '#E94560'),
  ('css', 'CSS模板', 'Code', 'CSS框架、样式库、动画效果', '#00D9FF'),
  ('font', '字体资源', 'Type', '免费字体、字体配对工具', '#F8B500'),
  ('icon', '图标库', 'Shapes', '图标集、SVG资源', '#7B68EE'),
  ('inspiration', '设计灵感', 'Sparkles', '优秀设计案例、灵感画廊', '#FF6B6B'),
  ('website', '网站案例', 'Globe', '优秀网站设计展示', '#4ECDC4'),
  ('ui-kit', 'UI组件', 'Layout', 'UI Kit、设计系统', '#95E1D3'),
  ('mockup', '样机素材', 'Smartphone', '设备样机、展示模板', '#DDA0DD')
ON CONFLICT (id) DO NOTHING;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);

-- 启用 RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Categories 策略 - 所有人可查看，只有管理员可修改
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- 验证数据
SELECT COUNT(*) as total_categories FROM public.categories;
SELECT id, name, icon, color FROM public.categories ORDER BY id;