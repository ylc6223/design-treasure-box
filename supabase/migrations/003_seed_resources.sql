-- 资源数据迁移 SQL
-- 生成时间: 2026-01-16T14:59:12.927Z
-- 资源数量: 32

-- 临时禁用 RLS（迁移完成后记得重新启用）
ALTER TABLE public.resources DISABLE ROW LEVEL SECURITY;


-- 1. Coolors
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  'fd753041-246e-4bcb-ac19-609e8afeef75',
  'Coolors',
  'https://coolors.co',
  '快速生成配色方案的在线工具，支持导出多种格式，可以锁定颜色进行调整',
  'color',
  ARRAY['配色', '工具', '免费', '在线'],
  '非常好用的配色工具，界面简洁，功能强大。支持快速生成和调整配色方案，可以导出为多种格式。',
  true,
  '{"overall":4.5,"usability":5,"aesthetics":4.5,"updateFrequency":4,"freeLevel":5}'::jsonb,
  1250,
  320
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


-- 2. Adobe Color
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  'd4f75d9c-a55c-4e26-a9ca-5b07c88f7ce1',
  'Adobe Color',
  'https://color.adobe.com',
  'Adobe 官方配色工具，支持多种配色规则，可以从图片提取配色',
  'color',
  ARRAY['配色', 'Adobe', '免费', '专业'],
  'Adobe 出品的专业配色工具，支持色轮、互补色、三角色等多种配色规则，还能从图片中提取配色。',
  true,
  '{"overall":4.5,"usability":4.5,"aesthetics":5,"updateFrequency":4.5,"freeLevel":5}'::jsonb,
  980,
  245
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


-- 3. Color Hunt
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  '735cbcb6-0a99-4067-a05b-66ba81feefea',
  'Color Hunt',
  'https://colorhunt.co',
  '精选配色方案分享平台，每天更新，可以按流行度和时间排序',
  'color',
  ARRAY['配色', '灵感', '免费', '社区'],
  '社区驱动的配色方案分享平台，每天都有新的配色方案，适合寻找灵感。',
  false,
  '{"overall":4,"usability":4.5,"aesthetics":4.5,"updateFrequency":5,"freeLevel":5}'::jsonb,
  750,
  180
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


-- 4. Tailwind CSS
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  'e8ce681b-7701-490a-9c82-9137aa8ad7da',
  'Tailwind CSS',
  'https://tailwindcss.com',
  '实用优先的 CSS 框架，提供大量预设类名，快速构建现代网站',
  'css',
  ARRAY['CSS', '框架', '免费', '开源'],
  '目前最流行的 CSS 框架之一，实用优先的设计理念，配合 JIT 模式开发效率极高。',
  true,
  '{"overall":5,"usability":4.5,"aesthetics":4.5,"updateFrequency":5,"freeLevel":5}'::jsonb,
  2100,
  580
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


-- 5. Animate.css
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  '1def89eb-2314-41f0-91f0-973b3f3bef07',
  'Animate.css',
  'https://animate.style',
  '即用型 CSS 动画库，包含80+种动画效果，简单易用',
  'css',
  ARRAY['CSS', '动画', '免费', '开源'],
  '经典的 CSS 动画库，使用简单，只需添加类名即可实现各种动画效果。',
  false,
  '{"overall":4.5,"usability":5,"aesthetics":4,"updateFrequency":3.5,"freeLevel":5}'::jsonb,
  890,
  210
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


-- 6. Uiverse
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  '052c4b58-586f-46da-bb2a-bd4ca727d87d',
  'Uiverse',
  'https://uiverse.io',
  '开源 UI 元素库，提供大量可复制的 CSS 和 Tailwind 组件',
  'css',
  ARRAY['CSS', '组件', '免费', '开源'],
  '社区驱动的 UI 组件库，提供大量精美的按钮、卡片、输入框等组件，可以直接复制代码使用。',
  true,
  '{"overall":4.5,"usability":4.5,"aesthetics":4.5,"updateFrequency":4.5,"freeLevel":5}'::jsonb,
  1100,
  290
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


-- 7. Google Fonts
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  'a31b8bec-4226-4ee1-936f-1abdd90b58b4',
  'Google Fonts',
  'https://fonts.google.com',
  'Google 提供的免费字体库，包含1000+种开源字体',
  'font',
  ARRAY['字体', '免费', 'Google', '开源'],
  '最全面的免费字体库，质量高，加载速度快，支持多种语言，是网页字体的首选。',
  true,
  '{"overall":5,"usability":5,"aesthetics":4.5,"updateFrequency":4.5,"freeLevel":5}'::jsonb,
  1800,
  450
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


-- 8. Font Pair
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  '072d2301-f671-4801-b590-dcd49b89240e',
  'Font Pair',
  'https://fontpair.co',
  '字体配对灵感网站，展示 Google Fonts 的最佳组合',
  'font',
  ARRAY['字体', '配对', '免费', '灵感'],
  '专注于字体配对的网站，展示了大量 Google Fonts 的优秀组合，帮助快速找到合适的字体搭配。',
  false,
  '{"overall":4,"usability":4.5,"aesthetics":4.5,"updateFrequency":3.5,"freeLevel":5}'::jsonb,
  620,
  155
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


-- 9. Font Squirrel
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  'e7bd9da5-a33d-4203-9492-17afa1288af0',
  'Font Squirrel',
  'https://www.fontsquirrel.com',
  '精选免费商用字体，提供字体生成器工具',
  'font',
  ARRAY['字体', '免费', '商用', '工具'],
  '精选的免费商用字体库，所有字体都经过筛选，确保可以免费用于商业项目。',
  false,
  '{"overall":4.5,"usability":4.5,"aesthetics":4,"updateFrequency":4,"freeLevel":5}'::jsonb,
  540,
  130
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


-- 10. Lucide Icons
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  '19a8ff93-f658-4658-a798-fd0871879ef4',
  'Lucide Icons',
  'https://lucide.dev',
  '简洁美观的开源图标库，支持 React、Vue 等多个框架',
  'icon',
  ARRAY['图标', '免费', '开源', 'SVG'],
  'Feather Icons 的社区分支，图标设计简洁统一，持续更新，支持多个框架，是现代项目的理想选择。',
  true,
  '{"overall":5,"usability":5,"aesthetics":5,"updateFrequency":5,"freeLevel":5}'::jsonb,
  1650,
  420
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


-- 11. Heroicons
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  '70226f8e-d477-41b3-90de-97846bbafd1f',
  'Heroicons',
  'https://heroicons.com',
  'Tailwind CSS 团队打造的精美 SVG 图标库',
  'icon',
  ARRAY['图标', '免费', 'Tailwind', 'SVG'],
  'Tailwind CSS 官方图标库，设计精美，提供 outline 和 solid 两种风格，与 Tailwind 完美搭配。',
  true,
  '{"overall":4.5,"usability":5,"aesthetics":4.5,"updateFrequency":4,"freeLevel":5}'::jsonb,
  1320,
  340
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


-- 12. Iconify
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  'ed4ef348-2c35-4c0c-900b-967fe55e9ec3',
  'Iconify',
  'https://iconify.design',
  '统一的图标框架，集成了150,000+个图标，支持所有流行图标库',
  'icon',
  ARRAY['图标', '免费', '集合', 'SVG'],
  '超大规模的图标集合，整合了 Material Design、Font Awesome 等众多图标库，一站式解决方案。',
  false,
  '{"overall":4.5,"usability":4.5,"aesthetics":4.5,"updateFrequency":5,"freeLevel":5}'::jsonb,
  890,
  220
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


-- 13. Dribbble
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  'b5a7efc4-fb4a-4125-a197-a8c612cf337b',
  'Dribbble',
  'https://dribbble.com',
  '全球顶尖设计师作品展示平台，UI/UX 设计灵感宝库',
  'inspiration',
  ARRAY['灵感', '设计', '社区', '作品集'],
  '设计师必备的灵感来源，汇集了全球顶尖设计师的作品，质量极高，是寻找设计灵感的首选平台。',
  true,
  '{"overall":5,"usability":4.5,"aesthetics":5,"updateFrequency":5,"freeLevel":4}'::jsonb,
  2500,
  680
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


-- 14. Behance
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  '89b75f66-380f-4776-a64c-2273c1f90661',
  'Behance',
  'https://www.behance.net',
  'Adobe 旗下创意作品展示平台，涵盖各类设计领域',
  'inspiration',
  ARRAY['灵感', 'Adobe', '作品集', '社区'],
  'Adobe 旗下的设计作品展示平台，内容丰富，涵盖平面、UI、插画等多个领域，适合深度浏览。',
  true,
  '{"overall":4.5,"usability":4.5,"aesthetics":5,"updateFrequency":5,"freeLevel":5}'::jsonb,
  1900,
  490
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


-- 15. Pinterest
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  'e5d82b9a-9960-4630-ba22-e2516177a7da',
  'Pinterest',
  'https://www.pinterest.com',
  '视觉灵感搜索引擎，海量设计图片和创意收藏',
  'inspiration',
  ARRAY['灵感', '图片', '收藏', '搜索'],
  '海量的视觉灵感来源，通过图片搜索和推荐算法，能快速找到相关的设计灵感。',
  false,
  '{"overall":4,"usability":4.5,"aesthetics":4.5,"updateFrequency":5,"freeLevel":5}'::jsonb,
  1200,
  280
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


-- 16. Awwwards
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  '266f0cc8-6610-43be-a462-60f01e51a4c9',
  'Awwwards',
  'https://www.awwwards.com',
  '全球最佳网站设计奖项平台，展示获奖网站作品',
  'website',
  ARRAY['网站', '获奖', '灵感', '高端'],
  '网页设计界的奥斯卡，展示全球最优秀的网站设计作品，是学习前沿设计趋势的最佳平台。',
  true,
  '{"overall":5,"usability":4.5,"aesthetics":5,"updateFrequency":5,"freeLevel":4.5}'::jsonb,
  1750,
  460
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


-- 17. SiteInspire
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  '830d915c-9819-4010-924c-cf3cf05e17e8',
  'SiteInspire',
  'https://www.siteinspire.com',
  '精选网站设计案例库，按风格、类型、主题分类',
  'website',
  ARRAY['网站', '案例', '分类', '灵感'],
  '精心策划的网站设计案例库，分类清晰，便于按需查找特定风格的网站设计。',
  false,
  '{"overall":4.5,"usability":4.5,"aesthetics":4.5,"updateFrequency":4.5,"freeLevel":5}'::jsonb,
  820,
  195
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


-- 18. Land-book
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  'ab84619b-88ba-431e-b045-f7e55b8af4fb',
  'Land-book',
  'https://land-book.com',
  '落地页设计灵感库，收录优秀的产品落地页设计',
  'website',
  ARRAY['网站', '落地页', '灵感', '产品'],
  '专注于落地页设计的灵感库，收录了大量优秀的产品落地页，适合学习转化率优化。',
  false,
  '{"overall":4,"usability":4,"aesthetics":4.5,"updateFrequency":4,"freeLevel":5}'::jsonb,
  650,
  160
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


-- 19. shadcn/ui
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  '926dc96f-4b94-4ae3-adfd-e2592d5b3a01',
  'shadcn/ui',
  'https://ui.shadcn.com',
  '基于 Radix UI 的精美组件库，可复制粘贴，完全可定制',
  'ui-kit',
  ARRAY['UI组件', 'React', '免费', '开源'],
  '革命性的组件库，不是 npm 包而是可复制的代码，完全可定制，与 Tailwind CSS 完美结合。',
  true,
  '{"overall":5,"usability":5,"aesthetics":5,"updateFrequency":5,"freeLevel":5}'::jsonb,
  2800,
  750
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


-- 20. Chakra UI
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  '02c14df7-39bc-408b-96e8-97b913ebd309',
  'Chakra UI',
  'https://chakra-ui.com',
  '简单、模块化、可访问的 React 组件库',
  'ui-kit',
  ARRAY['UI组件', 'React', '免费', '可访问性'],
  '注重可访问性的 React 组件库，API 设计优雅，主题系统强大，开发体验极佳。',
  true,
  '{"overall":4.5,"usability":5,"aesthetics":4.5,"updateFrequency":4.5,"freeLevel":5}'::jsonb,
  1600,
  410
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


-- 21. daisyUI
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  '5fb4b0ba-6988-4f83-a61f-c05d5c99cc7a',
  'daisyUI',
  'https://daisyui.com',
  'Tailwind CSS 组件库，提供大量预设计组件和主题',
  'ui-kit',
  ARRAY['UI组件', 'Tailwind', '免费', '主题'],
  '最流行的 Tailwind CSS 组件库，提供丰富的组件和多个主题，大幅提升开发效率。',
  false,
  '{"overall":4.5,"usability":4.5,"aesthetics":4.5,"updateFrequency":4.5,"freeLevel":5}'::jsonb,
  1350,
  330
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


-- 22. Mockuphone
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  '5234f88e-bc13-44be-ace6-f225048db813',
  'Mockuphone',
  'https://mockuphone.com',
  '免费在线设备样机生成器，支持多种设备型号',
  'mockup',
  ARRAY['样机', '免费', '在线', '设备'],
  '简单易用的在线样机生成工具，支持 iPhone、iPad、Android 等多种设备，完全免费。',
  false,
  '{"overall":4,"usability":4.5,"aesthetics":4,"updateFrequency":3.5,"freeLevel":5}'::jsonb,
  720,
  175
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


-- 23. Smartmockups
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  '388fb949-2551-4ae3-8b6a-5621f9511774',
  'Smartmockups',
  'https://smartmockups.com',
  '专业样机生成工具，提供海量高质量样机模板',
  'mockup',
  ARRAY['样机', '专业', '模板', '高质量'],
  '专业级样机生成工具，模板质量极高，涵盖设备、印刷品、服装等多个类别，免费版功能有限。',
  true,
  '{"overall":4.5,"usability":4.5,"aesthetics":5,"updateFrequency":4.5,"freeLevel":3.5}'::jsonb,
  980,
  240
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


-- 24. Mockup World
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  '04818fc2-7979-4d06-aa84-c5c96dee3d52',
  'Mockup World',
  'https://www.mockupworld.co',
  '免费样机资源下载站，每周更新，质量精选',
  'mockup',
  ARRAY['样机', '免费', '下载', 'PSD'],
  '精选的免费样机资源站，提供 PSD 格式下载，质量有保证，每周都有新内容。',
  false,
  '{"overall":4,"usability":4,"aesthetics":4.5,"updateFrequency":4,"freeLevel":5}'::jsonb,
  650,
  155
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


-- 25. Gradient Hunt
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  'a130b68e-2d32-4641-b5e2-a0c8463c7f40',
  'Gradient Hunt',
  'https://gradienthunt.com',
  '精选渐变色方案分享平台，可一键复制 CSS 代码',
  'color',
  ARRAY['配色', '渐变', '免费', 'CSS'],
  '专注于渐变色的灵感平台，提供大量精美的渐变色方案，可以直接复制 CSS 代码使用。',
  false,
  '{"overall":4,"usability":4.5,"aesthetics":4.5,"updateFrequency":4,"freeLevel":5}'::jsonb,
  580,
  140
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


-- 26. CSS-Tricks
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  'fa0479ec-e802-4686-9699-86532c5dd220',
  'CSS-Tricks',
  'https://css-tricks.com',
  'CSS 技巧和教程网站，涵盖前端开发各个方面',
  'css',
  ARRAY['CSS', '教程', '技巧', '社区'],
  '前端开发者必读的网站，提供大量 CSS 技巧、教程和最佳实践，内容质量极高。',
  false,
  '{"overall":4.5,"usability":4.5,"aesthetics":4,"updateFrequency":4.5,"freeLevel":5}'::jsonb,
  1100,
  270
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


-- 27. Fontjoy
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  '6531585b-77df-4423-ae57-91fead5e5a9d',
  'Fontjoy',
  'https://fontjoy.com',
  'AI 驱动的字体配对工具，自动生成和谐的字体组合',
  'font',
  ARRAY['字体', 'AI', '配对', '免费'],
  '使用机器学习生成字体配对的创新工具，可以快速找到和谐的字体组合，节省大量时间。',
  false,
  '{"overall":4,"usability":4.5,"aesthetics":4,"updateFrequency":3.5,"freeLevel":5}'::jsonb,
  490,
  115
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


-- 28. Flaticon
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  'af36250b-6f73-46d1-bf6d-c81180308d0d',
  'Flaticon',
  'https://www.flaticon.com',
  '全球最大的免费图标库，包含数百万个图标',
  'icon',
  ARRAY['图标', '免费', '海量', '多风格'],
  '海量的图标资源库，涵盖各种风格和主题，免费版需要署名，付费版可商用。',
  false,
  '{"overall":4.5,"usability":4.5,"aesthetics":4,"updateFrequency":5,"freeLevel":4.5}'::jsonb,
  1450,
  360
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


-- 29. Mobbin
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  '2c5a3e81-d92a-47f3-8879-db0426fc5d52',
  'Mobbin',
  'https://mobbin.com',
  '移动应用设计参考库，收录顶级 App 的界面设计',
  'inspiration',
  ARRAY['灵感', '移动端', 'App', 'UI'],
  '移动应用设计师的必备工具，收录了大量顶级 App 的界面截图，按功能和流程分类，免费版功能有限。',
  true,
  '{"overall":4.5,"usability":4.5,"aesthetics":5,"updateFrequency":5,"freeLevel":3}'::jsonb,
  1280,
  320
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


-- 30. Ant Design
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  'ae19165a-f7a5-4067-8954-c33ae9834250',
  'Ant Design',
  'https://ant.design',
  '蚂蚁集团企业级 UI 设计语言和 React 组件库',
  'ui-kit',
  ARRAY['UI组件', 'React', '企业级', '免费'],
  '成熟的企业级 UI 组件库，组件丰富，文档完善，适合中后台系统开发。',
  false,
  '{"overall":4.5,"usability":4.5,"aesthetics":4,"updateFrequency":5,"freeLevel":5}'::jsonb,
  1850,
  470
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


-- 31. Material-UI
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  'b6777fbc-00c5-47eb-a0f1-c49439035084',
  'Material-UI',
  'https://mui.com',
  'Google Material Design 的 React 实现，组件丰富完善',
  'ui-kit',
  ARRAY['UI组件', 'React', 'Material', '免费'],
  '最流行的 React UI 库之一，完整实现了 Material Design 规范，组件质量高，生态完善。',
  false,
  '{"overall":4.5,"usability":4.5,"aesthetics":4.5,"updateFrequency":5,"freeLevel":5}'::jsonb,
  2100,
  540
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


-- 32. Screenlane
INSERT INTO public.resources (
  id, name, url, description, category_id, tags, curator_note, 
  is_featured, curator_rating, view_count, favorite_count
) VALUES (
  'a1bd4a7a-6dc4-4ad6-8bdb-ac0eb89e9dca',
  'Screenlane',
  'https://screenlane.com',
  'Web 和移动端 UI 设计灵感库，按组件类型分类',
  'inspiration',
  ARRAY['灵感', 'UI', '组件', '分类'],
  '按 UI 组件类型分类的设计灵感库，可以快速找到特定组件的设计参考，免费版有限制。',
  false,
  '{"overall":4,"usability":4.5,"aesthetics":4.5,"updateFrequency":4.5,"freeLevel":4.5}'::jsonb,
  680,
  165
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


-- 重新启用 RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- 验证迁移
SELECT COUNT(*) as total_resources FROM public.resources;
SELECT id, name, category_id FROM public.resources LIMIT 5;
