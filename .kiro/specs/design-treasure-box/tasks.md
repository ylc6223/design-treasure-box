# Implementation Plan: 设计百宝箱 (Design Treasure Box)

## Phase 1: 项目初始化与基础配置

- [x] 1. 项目脚手架搭建 ✅ **已完成**
  - ✅ 手动创建 Next.js 16 项目结构
  - ✅ 配置 TypeScript 严格模式 (strict: true + 所有严格选项)
  - ✅ 安装核心依赖: shadcn/ui 基础, Tailwind CSS 4, TanStack Query, Zod, Lucide React, next-themes
  - ✅ 配置 Vitest + fast-check 测试环境
  - ✅ 创建双主题颜色系统 (浅色/深色 CSS 变量)
  - ✅ 配置 ThemeProvider 和根布局
  - _Requirement: 8.1_

- [x] 2. 主题系统配置
  - 配置 next-themes ThemeProvider
  - 创建 `globals.css` 双主题颜色系统 (浅色/深色 CSS 变量)
  - 配置 Tailwind CSS 4 主题映射
  - 创建 ThemeToggle 组件 (Sun/Moon 图标切换)
  - _Requirement: 7.1_

- [x] 3. shadcn/ui 组件初始化
  - 安装并配置 shadcn/ui CLI
  - 添加所需组件: Card, Button, Input, Badge, Dialog, Tooltip, ScrollArea, Skeleton
  - _Requirement: 1.3, 2.1_

## Phase 2: 数据层实现

- [x] 4. 数据类型定义
  - 创建 `types/index.ts`: Resource, Rating, Category, FavoriteItem 接口
  - 创建 Zod schema 用于数据验证
  - _Requirement: 1.3, 2.1, 8.3_

- [x] 5. 预置数据创建
  - 创建 `data/categories.json`: 8个分类 (配色、CSS、字体、图标、灵感、网站、UI组件、样机)
  - 创建 `data/resources.json`: 30+ 精选资源，覆盖所有分类
  - 确保每个资源包含完整评分和标签
  - _Requirement: 8.1, 8.2, 8.3, 8.4_

- [x] 6. 自定义 Hooks 实现
  - `useFavorites`: localStorage 收藏管理 (添加/移除/查询/持久化)
  - `useResources`: 资源数据获取与缓存 (TanStack Query)
  - `useSearch`: 搜索与筛选逻辑 (关键词 + 标签组合)
  - `useScrollVisibility`: AI Prompt 滚动隐藏/显示逻辑
  - _Requirement: 3.1, 3.2, 3.3, 4.1, 4.5_

## Phase 3: 核心组件开发

- [x] 7. DockSidebar 组件
  - 固定左侧 64px 宽度，垂直居中紧凑型布局
  - 使用 Lucide 图标 (Palette, Code, Type, Shapes, Sparkles, Globe, Layout, Smartphone, Heart)
  - 毛玻璃背景 + 悬停放大效果 + 激活状态指示器
  - Tooltip 显示分类名称
  - 响应式: 移动端转为底部 Tab Bar
  - _Requirement: 1.1, 1.2, 7.4_

- [x] 8. AIPromptInput 组件
  - 固定底部悬浮，毛玻璃背景，胶囊形圆角
  - MessageSquare 图标提示 + ArrowUp 发送按钮
  - 集成 `useScrollVisibility` hook: 滚动时隐藏，停止 300ms 后显示
  - 过渡动画: opacity + translateY
  - _Requirement: 3.1_

- [x] 9. ResourceCard 组件
  - 网站截图 (自适应高度) + 精选标识 (Sparkles 图标)
  - 资源名称 + 评分星星 (Star/StarHalf 图标)
  - 简介描述 (2行截断) + 标签 Badge
  - 收藏按钮 (Heart) + 访问按钮 (ExternalLink)
  - 悬停上浮动效
  - _Requirement: 1.3, 2.1, 2.2, 5.4_

- [x] 10. MasonryGrid 组件
  - CSS Grid 瀑布流布局
  - 响应式列数: 5列(XL) / 4列(Desktop) / 3列(Tablet) / 2列(Mobile)
  - 加载动画: stagger fade-in
  - _Requirement: 7.1, 7.2, 7.3_

- [x] 11. RatingStars 组件
  - 5星评分显示，支持半星精度
  - 使用 Star/StarHalf Lucide 图标
  - 可选: 显示数值评分
  - _Requirement: 2.1, 2.2_

- [x] 12. Header 组件
  - Logo + 分类标签切换 (CategoryTabs)
  - ThemeToggle (深色/浅色切换)
  - 收藏入口 (Heart 图标)
  - _Requirement: 1.1_

## Phase 4: 页面开发

- [x] 13. 根布局 (RootLayout)
  - ThemeProvider 包裹
  - DockSidebar + MainWrapper 结构
  - AIPromptInput 底部悬浮
  - _Requirement: 7.1_

- [x] 14. 首页 (HomePage)
  - FeaturedSection: 编辑精选横向滚动
  - MasonryGrid: 全部资源瀑布流
  - 热门资源 / 最新收录 区域
  - _Requirement: 5.1, 5.2, 5.3_

- [x] 15. 分类页 (CategoryPage)
  - CategoryHeader: 分类名称 + 描述 + 图标
  - MasonryGrid: 该分类下所有资源
  - 动态路由: `/category/[id]`
  - _Requirement: 1.2_

- [x] 16. 资源详情页 (ResourceDetailPage)
  - ResourceHero: 大尺寸截图 + 基本信息
  - RatingBreakdown: 评分维度详情 (实用性、美观度、更新频率、免费程度)
  - 策展人推荐理由
  - RelatedResources: 相关资源推荐
  - 访问按钮 + 收藏按钮
  - 动态路由: `/resource/[id]`
  - _Requirement: 6.1, 6.2, 6.3, 6.4, 2.3, 2.4_

- [x] 17. 收藏页 (FavoritesPage)
  - MasonryGrid: 已收藏资源展示
  - 支持按添加时间/分类排序
  - 空状态提示
  - _Requirement: 4.2, 4.3_

- [x] 18. 搜索结果页 (SearchResultsPage)
  - 搜索关键词高亮
  - MasonryGrid: 搜索结果展示
  - 无结果时显示热门推荐
  - 路由: `/search?q=xxx&tags=xxx`
  - _Requirement: 3.1, 3.4_

## Phase 5: 交互与动效

- [ ] 19. 动效实现
  - 卡片悬停: translateY(-4px) + shadow 增强
  - Dock 图标悬停: scale(1.2) spring 动画
  - 收藏按钮: heart pulse + scale 动画
  - 页面切换: fade + slide 过渡
  - 瀑布流加载: stagger fade-in
  - _Requirement: 7.1_

- [ ] 20. 响应式适配
  - Desktop XL (≥1440px): 5列瀑布流
  - Desktop (≥1200px): 4列瀑布流
  - Tablet (768-1199px): 3列瀑布流，Dock 折叠
  - Mobile (<768px): 2列瀑布流，底部 Tab Bar
  - _Requirement: 7.1, 7.2, 7.3, 7.4_

## Phase 6: 测试

- [ ] 21. 单元测试
  - 组件渲染测试: ResourceCard, RatingStars, DockSidebar
  - Hook 测试: useFavorites, useSearch, useScrollVisibility
  - 边界情况测试: 空数据、无效输入
  - _Requirement: All_

- [ ] 22. 属性测试 (Property-Based Testing)
  - Property 1: 资源数据完整性验证
  - Property 2: 分类筛选正确性
  - Property 3: 搜索筛选正确性
  - Property 4: 收藏操作 Round-Trip
  - Property 5: 收藏持久化
  - Property 6: 评分范围约束 [0, 5]
  - Property 7: 排序正确性
  - Property 8: 精选标识一致性
  - Property 9: 预置数据完整性
  - Property 10: 详情页数据完整性
  - 每个属性测试至少 100 次迭代
  - _Requirement: All (参见 design.md Correctness Properties)_

## Phase 7: 优化与部署

- [ ] 23. 性能优化
  - 图片懒加载 + 占位图
  - 资源数据预加载
  - 组件代码分割
  - _Requirement: 7.1_

- [ ] 24. 错误处理
  - 图片加载失败占位图
  - LocalStorage 不可用降级
  - 搜索无结果提示
  - 组件级错误边界
  - _Requirement: 3.4_

- [ ] 25. 部署准备
  - 构建优化配置
  - 静态资源 CDN 配置
  - 环境变量配置
  - README 文档更新
  - _Requirement: 8.4_
