-- =====================================================
-- 设计百宝箱 (Design Treasure Box) - 完整数据库设置脚本
-- 可直接在 Supabase SQL Editor 中运行
-- =====================================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. 创建枚举类型和基础表结构
-- =====================================================

-- 用户角色枚举
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 用户表（扩展 Supabase Auth 的 auth.users）
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  image TEXT,
  role user_role DEFAULT 'USER' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 分类表
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT NOT NULL,
  color TEXT NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 资源表
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  tags TEXT[] NOT NULL,
  curator_note TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE NOT NULL,
  curator_rating JSONB NOT NULL,
  view_count INTEGER DEFAULT 0 NOT NULL,
  favorite_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 用户评分表
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  overall DECIMAL(2,1) NOT NULL CHECK (overall >= 0 AND overall <= 5),
  usability DECIMAL(2,1) NOT NULL CHECK (usability >= 0 AND usability <= 5),
  aesthetics DECIMAL(2,1) NOT NULL CHECK (aesthetics >= 0 AND aesthetics <= 5),
  update_frequency DECIMAL(2,1) NOT NULL CHECK (update_frequency >= 0 AND update_frequency <= 5),
  free_level DECIMAL(2,1) NOT NULL CHECK (free_level >= 0 AND free_level <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, resource_id)
);

-- =====================================================
-- 2. 创建索引
-- =====================================================

-- Profiles 索引
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Categories 索引
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);

-- Resources 索引
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category_id);
CREATE INDEX IF NOT EXISTS idx_resources_featured ON public.resources(is_featured);

-- Ratings 索引
CREATE INDEX IF NOT EXISTS idx_ratings_user ON public.ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_resource ON public.ratings(resource_id);

-- =====================================================
-- 3. 创建触发器函数
-- =====================================================

-- 自动更新 updated_at 触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 自动创建用户 Profile 触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, image, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar_url',
    'USER'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. 创建触发器
-- =====================================================

-- 自动更新 updated_at 触发器
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resources_updated_at ON public.resources;
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ratings_updated_at ON public.ratings;
CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 自动创建用户 Profile 触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 5. 启用 Row Level Security (RLS)
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. 创建 RLS 策略
-- =====================================================

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

DROP POLICY IF EXISTS "Resources are viewable by everyone" ON public.resources;
DROP POLICY IF EXISTS "Admins can insert resources" ON public.resources;
DROP POLICY IF EXISTS "Admins can update resources" ON public.resources;
DROP POLICY IF EXISTS "Admins can delete resources" ON public.resources;

DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON public.ratings;
DROP POLICY IF EXISTS "Authenticated users can insert ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can update own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can delete own ratings" ON public.ratings;

-- Profiles 策略
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Categories 策略
CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Resources 策略
CREATE POLICY "Resources are viewable by everyone"
  ON public.resources FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert resources"
  ON public.resources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update resources"
  ON public.resources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can delete resources"
  ON public.resources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Ratings 策略
CREATE POLICY "Ratings are viewable by everyone"
  ON public.ratings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert ratings"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
  ON public.ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
  ON public.ratings FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 7. 插入分类数据
-- =====================================================

INSERT INTO public.categories (id, name, icon, description, color) VALUES
  ('color', '配色工具', 'Palette', '调色板、配色方案生成器', '#E94560'),
  ('css', 'CSS模板', 'Code', 'CSS框架、样式库、动画效果', '#00D9FF'),
  ('font', '字体资源', 'Type', '免费字体、字体配对工具', '#F8B500'),
  ('icon', '图标库', 'Shapes', '图标集、SVG资源', '#7B68EE'),
  ('inspiration', '设计灵感', 'Sparkles', '优秀设计案例、灵感画廊', '#FF6B6B'),
  ('website', '网站案例', 'Globe', '优秀网站设计展示', '#4ECDC4'),
  ('ui-kit', 'UI组件', 'Layout', 'UI Kit、设计系统', '#95E1D3'),
  ('mockup', '样机素材', 'Smartphone', '设备样机、展示模板', '#DDA0DD')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  color = EXCLUDED.color;

-- =====================================================
-- 8. 插入资源数据（精选部分）
-- =====================================================

-- 临时禁用 RLS 进行数据插入
ALTER TABLE public.resources DISABLE ROW LEVEL SECURITY;

-- 插入精选资源数据
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES 
-- 配色工具
('fd753041-246e-4bcb-ac19-609e8afeef75', 'Coolors', 'https://coolors.co', '快速生成配色方案的在线工具，支持导出多种格式，可以锁定颜色进行调整', 'color', ARRAY['配色', '工具', '免费', '在线'], '非常好用的配色工具，界面简洁，功能强大。支持快速生成和调整配色方案，可以导出为多种格式。', true, '{"overall":4.5,"usability":5,"aesthetics":4.5,"updateFrequency":4,"freeLevel":5}'::jsonb, 1250, 320),

('d4f75d9c-a55c-4e26-a9ca-5b07c88f7ce1', 'Adobe Color', 'https://color.adobe.com', 'Adobe 官方配色工具，支持多种配色规则，可以从图片提取配色', 'color', ARRAY['配色', 'Adobe', '免费', '专业'], 'Adobe 出品的专业配色工具，支持色轮、互补色、三角色等多种配色规则，还能从图片中提取配色。', true, '{"overall":4.5,"usability":4.5,"aesthetics":5,"updateFrequency":4.5,"freeLevel":5}'::jsonb, 980, 245),

-- CSS 框架
('e8ce681b-7701-490a-9c82-9137aa8ad7da', 'Tailwind CSS', 'https://tailwindcss.com', '实用优先的 CSS 框架，提供大量预设类名，快速构建现代网站', 'css', ARRAY['CSS', '框架', '免费', '开源'], '目前最流行的 CSS 框架之一，实用优先的设计理念，配合 JIT 模式开发效率极高。', true, '{"overall":5,"usability":4.5,"aesthetics":4.5,"updateFrequency":5,"freeLevel":5}'::jsonb, 2100, 580),

('052c4b58-586f-46da-bb2a-bd4ca727d87d', 'Uiverse', 'https://uiverse.io', '开源 UI 元素库，提供大量可复制的 CSS 和 Tailwind 组件', 'css', ARRAY['CSS', '组件', '免费', '开源'], '社区驱动的 UI 组件库，提供大量精美的按钮、卡片、输入框等组件，可以直接复制代码使用。', true, '{"overall":4.5,"usability":4.5,"aesthetics":4.5,"updateFrequency":4.5,"freeLevel":5}'::jsonb, 1100, 290),

-- 字体资源
('a31b8bec-4226-4ee1-936f-1abdd90b58b4', 'Google Fonts', 'https://fonts.google.com', 'Google 提供的免费字体库，包含1000+种开源字体', 'font', ARRAY['字体', '免费', 'Google', '开源'], '最全面的免费字体库，质量高，加载速度快，支持多种语言，是网页字体的首选。', true, '{"overall":5,"usability":5,"aesthetics":4.5,"updateFrequency":4.5,"freeLevel":5}'::jsonb, 1800, 450),

-- 图标库
('19a8ff93-f658-4658-a798-fd0871879ef4', 'Lucide Icons', 'https://lucide.dev', '简洁美观的开源图标库，支持 React、Vue 等多个框架', 'icon', ARRAY['图标', '免费', '开源', 'SVG'], 'Feather Icons 的社区分支，图标设计简洁统一，持续更新，支持多个框架，是现代项目的理想选择。', true, '{"overall":5,"usability":5,"aesthetics":5,"updateFrequency":5,"freeLevel":5}'::jsonb, 1650, 420),

('70226f8e-d477-41b3-90de-97846bbafd1f', 'Heroicons', 'https://heroicons.com', 'Tailwind CSS 团队打造的精美 SVG 图标库', 'icon', ARRAY['图标', '免费', 'Tailwind', 'SVG'], 'Tailwind CSS 官方图标库，设计精美，提供 outline 和 solid 两种风格，与 Tailwind 完美搭配。', true, '{"overall":4.5,"usability":5,"aesthetics":4.5,"updateFrequency":4,"freeLevel":5}'::jsonb, 1320, 340),

-- 设计灵感
('b5a7efc4-fb4a-4125-a197-a8c612cf337b', 'Dribbble', 'https://dribbble.com', '全球顶尖设计师作品展示平台，UI/UX 设计灵感宝库', 'inspiration', ARRAY['灵感', '设计', '社区', '作品集'], '设计师必备的灵感来源，汇集了全球顶尖设计师的作品，质量极高，是寻找设计灵感的首选平台。', true, '{"overall":5,"usability":4.5,"aesthetics":5,"updateFrequency":5,"freeLevel":4}'::jsonb, 2500, 680),

('89b75f66-380f-4776-a64c-2273c1f90661', 'Behance', 'https://www.behance.net', 'Adobe 旗下创意作品展示平台，涵盖各类设计领域', 'inspiration', ARRAY['灵感', 'Adobe', '作品集', '社区'], 'Adobe 旗下的设计作品展示平台，内容丰富，涵盖平面、UI、插画等多个领域，适合深度浏览。', true, '{"overall":4.5,"usability":4.5,"aesthetics":5,"updateFrequency":5,"freeLevel":5}'::jsonb, 1900, 490),

-- 网站案例
('266f0cc8-6610-43be-a462-60f01e51a4c9', 'Awwwards', 'https://www.awwwards.com', '全球最佳网站设计奖项平台，展示获奖网站作品', 'website', ARRAY['网站', '获奖', '灵感', '高端'], '网页设计界的奥斯卡，展示全球最优秀的网站设计作品，是学习前沿设计趋势的最佳平台。', true, '{"overall":5,"usability":4.5,"aesthetics":5,"updateFrequency":5,"freeLevel":4.5}'::jsonb, 1750, 460),

-- UI 组件
('926dc96f-4b94-4ae3-adfd-e2592d5b3a01', 'shadcn/ui', 'https://ui.shadcn.com', '基于 Radix UI 的精美组件库，可复制粘贴，完全可定制', 'ui-kit', ARRAY['UI组件', 'React', '免费', '开源'], '革命性的组件库，不是 npm 包而是可复制的代码，完全可定制，与 Tailwind CSS 完美结合。', true, '{"overall":5,"usability":5,"aesthetics":5,"updateFrequency":5,"freeLevel":5}'::jsonb, 2800, 750),

('02c14df7-39bc-408b-96e8-97b913ebd309', 'Chakra UI', 'https://chakra-ui.com', '简单、模块化、可访问的 React 组件库', 'ui-kit', ARRAY['UI组件', 'React', '免费', '可访问性'], '注重可访问性的 React 组件库，API 设计优雅，主题系统强大，开发体验极佳。', true, '{"overall":4.5,"usability":5,"aesthetics":4.5,"updateFrequency":4.5,"freeLevel":5}'::jsonb, 1600, 410),

-- 样机素材
('388fb949-2551-4ae3-8b6a-5621f9511774', 'Smartmockups', 'https://smartmockups.com', '专业样机生成工具，提供海量高质量样机模板', 'mockup', ARRAY['样机', '专业', '模板', '高质量'], '专业级样机生成工具，模板质量极高，涵盖设备、印刷品、服装等多个类别，免费版功能有限。', true, '{"overall":4.5,"usability":4.5,"aesthetics":5,"updateFrequency":4.5,"freeLevel":3.5}'::jsonb, 980, 240)

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

-- 重新启用 RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. 设置管理员权限（请修改邮箱地址）
-- =====================================================

-- 注意：请将下面的邮箱地址替换为你的实际邮箱地址
-- UPDATE public.profiles
-- SET role = 'ADMIN'
-- WHERE email = 'your-email@example.com';

-- =====================================================
-- 10. 验证设置
-- =====================================================

-- 验证表创建
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'categories', 'resources', 'ratings')
ORDER BY tablename;

-- 验证数据插入
SELECT 
  'categories' as table_name, 
  COUNT(*) as record_count 
FROM public.categories
UNION ALL
SELECT 
  'resources' as table_name, 
  COUNT(*) as record_count 
FROM public.resources
UNION ALL
SELECT 
  'profiles' as table_name, 
  COUNT(*) as record_count 
FROM public.profiles
UNION ALL
SELECT 
  'ratings' as table_name, 
  COUNT(*) as record_count 
FROM public.ratings;

-- 验证分类数据
SELECT id, name, icon, color FROM public.categories ORDER BY id;

-- 验证精选资源
SELECT name, category_id, is_featured FROM public.resources WHERE is_featured = true ORDER BY name;

-- =====================================================
-- 脚本执行完成
-- =====================================================

-- 执行完成后，请记住：
-- 1. 将管理员邮箱地址替换为你的实际邮箱（第9部分）
-- 2. 在应用中测试用户注册和登录功能
-- 3. 验证 RLS 策略是否正常工作
-- 4. 测试评分功能和管理员权限

SELECT 'Database setup completed successfully!' as status;