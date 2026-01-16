# Implementation Plan: Admin and Rating System (Supabase)

## Overview

本实现计划将"设计百宝箱"应用扩展为全栈应用，添加用户认证、评分系统和后台管理功能。实现将基于 **Next.js 16 + Supabase** 技术栈，采用增量开发方式，确保每个步骤都可以独立测试和验证。

**核心技术栈：**
- **Supabase Auth** - OAuth 认证（Google + GitHub）
- **Supabase PostgreSQL** - 托管数据库
- **Supabase RLS** - 行级安全策略
- **Next.js 16** - 全栈框架
- **TypeScript** - 类型安全
- **Vercel 管理后台模板** - 复用官方模板组件

## Tasks

- [x] 1. Supabase 项目配置和环境设置
  - 在 Supabase 控制台创建新项目
  - 获取项目 URL 和 anon key
  - 配置环境变量（NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY）
  - 安装 Supabase 客户端库（@supabase/supabase-js, @supabase/ssr）
  - 在 Supabase Auth 设置中配置 Google OAuth
  - 在 Supabase Auth 设置中配置 GitHub OAuth
  - _Requirements: 1.1, 1.2, 7.1_

- [ ]* 1.1 编写 Supabase 连接测试
  - 测试 Supabase 客户端连接
  - 测试基本查询操作
  - _Requirements: 7.1_

- [x] 2. 数据库 Schema 创建
  - [x] 2.1 创建数据库迁移文件
    - 创建 `supabase/migrations/001_initial_schema.sql`
    - 定义 profiles 表（扩展 auth.users）
    - 定义 resources 表
    - 定义 ratings 表
    - 创建索引和自动更新 updated_at 触发器
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 2.2 配置 Row Level Security (RLS) 策略
    - 为 profiles 表创建 RLS 策略（公开可读，用户可更新自己，管理员可更新任何）
    - 为 resources 表创建 RLS 策略（公开可读，仅管理员可写）
    - 为 ratings 表创建 RLS 策略（公开可读，用户可管理自己的评分）
    - _Requirements: 2.3, 2.4, 9.3_

  - [x] 2.3 运行数据库迁移
    - 使用 Supabase CLI 或控制台 SQL Editor 运行迁移
    - 验证表结构和 RLS 策略
    - _Requirements: 7.1_

  - [x] 2.4 生成 TypeScript 类型
    - 安装 Supabase CLI（如果未安装）
    - 运行 `supabase gen types typescript --project-id <project-id>` 生成类型定义
    - 创建 `types/database.ts` 文件保存生成的类型
    - _Requirements: 7.1_

  - [ ]* 2.5 编写数据库 Schema 测试
    - 测试表创建和约束
    - 测试 RLS 策略
    - _Requirements: 7.1, 2.3, 2.4_

- [x] 3. Supabase 客户端配置
  - [x] 3.1 创建 Supabase 客户端（浏览器端）
    - 创建 `lib/supabase/client.ts`
    - 配置浏览器端 Supabase 客户端
    - 导出 `createBrowserClient` 函数
    - _Requirements: 1.3_

  - [x] 3.2 创建 Supabase 客户端（服务器端）
    - 创建 `lib/supabase/server.ts`
    - 配置服务器端 Supabase 客户端（使用 cookies）
    - 导出 `createServerClient` 函数
    - _Requirements: 1.3_

  - [x] 3.3 创建 Supabase 中间件
    - 创建 `middleware.ts`（项目根目录）
    - 配置 Supabase Auth 中间件自动刷新会话
    - 处理 auth 回调路由
    - _Requirements: 1.5, 1.6_

  - [x] 3.4 创建权限验证辅助函数
    - 创建 `lib/supabase/auth.ts`
    - 实现 `requireAuth()` 函数（验证用户登录）
    - 实现 `requireAdmin()` 函数（验证管理员权限）
    - _Requirements: 2.3, 2.4_

  - [ ]* 3.5 编写认证系统属性测试
    - **Property 2: OAuth User Creation or Retrieval**
    - **Property 1: Session Token Validation**
    - **Property 3: Logout Invalidates Session**
    - **Validates: Requirements 1.3, 1.5, 1.6, 1.7, 1.8, 9.3**
    - _Requirements: 1.3, 1.5, 1.6, 1.7, 1.8_

- [x] 4. 用户 Profile 自动创建
  - [x] 4.1 创建数据库触发器
    - 在 Supabase 中创建触发器函数
    - 当 auth.users 新增记录时自动在 profiles 表创建对应记录
    - 设置默认角色为 'USER'
    - 从 auth.users 复制 email, name, image 等信息
    - _Requirements: 1.8, 2.1_

  - [ ]* 4.2 编写角色管理属性测试
    - **Property 4: Default User Role Assignment**
    - **Validates: Requirements 2.1**
    - _Requirements: 2.1_

- [x] 5. 认证 UI 组件开发
  - [x] 5.1 创建登录对话框组件
    - 创建 `components/auth/login-dialog.tsx`
    - 实现 Google 和 GitHub 登录按钮
    - 集成 Supabase `signInWithOAuth()` 方法
    - 添加加载状态和错误处理
    - 配置 redirectTo 到 auth callback
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 5.2 创建 OAuth 回调路由
    - 创建 `app/auth/callback/route.ts`
    - 处理 OAuth 回调并交换 code 为 session
    - 重定向到原始页面或首页
    - _Requirements: 1.3_

  - [x] 5.3 创建用户菜单组件
    - 创建 `components/auth/user-menu.tsx`
    - 显示用户头像、名称和邮箱
    - 实现下拉菜单（个人资料、我的评分、退出登录）
    - 为管理员显示"管理后台"链接
    - 集成 Supabase `signOut()` 方法
    - _Requirements: 1.7, 10.2_

  - [x] 5.4 更新 Header 组件集成认证
    - 修改 `components/header.tsx`
    - 根据登录状态显示登录按钮或用户菜单
    - 使用 Supabase `useUser()` hook 获取用户状态
    - 从 profiles 表获取用户角色
    - _Requirements: 10.1, 10.2_

  - [ ]* 5.5 编写认证 UI 组件单元测试
    - 测试登录对话框渲染和交互
    - 测试用户菜单显示和功能
    - 测试 Header 根据认证状态的条件渲染
    - _Requirements: 10.1, 10.2_

- [ ] 6. 评分数据类型和验证
  - [ ] 6.1 创建评分相关类型定义
    - 创建 `types/rating.ts`
    - 定义 Rating, UserRating, SubmitRatingRequest 接口
    - 定义 ResourceRatings 接口
    - _Requirements: 4.1, 5.1_

  - [ ] 6.2 创建评分 Zod 验证 Schema
    - 在 `types/rating.ts` 中定义 RatingValueSchema
    - 定义 RatingSchema
    - 定义 SubmitRatingSchema
    - _Requirements: 4.2, 4.5_

  - [ ]* 6.3 编写评分验证属性测试
    - **Property 10: Rating Submission and Validation**
    - **Validates: Requirements 4.1, 4.2, 4.5**
    - _Requirements: 4.2, 4.5_

- [ ] 7. 评分 API 端点实现
  - [ ] 7.1 实现评分提交 API
    - 创建 `app/api/ratings/route.ts`
    - 实现 POST 端点处理评分提交
    - 使用 `requireAuth()` 验证用户登录
    - 验证评分数据（Zod Schema）
    - 使用 Supabase upsert 处理新建和更新评分
    - _Requirements: 4.1, 4.3, 4.4, 4.5_

  - [ ] 7.2 实现评分查询 API
    - 创建 `app/api/ratings/[resourceId]/route.ts`
    - 实现 GET 端点返回资源评分
    - 计算聚合评分（平均值，四舍五入到 0.5）
    - 返回当前用户评分（如果已登录）
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [ ]* 7.3 编写评分 API 属性测试
    - **Property 11: Rating Update Idempotency**
    - **Property 12: Authentication Required for Rating**
    - **Property 13: Aggregated Rating Calculation**
    - **Validates: Requirements 4.3, 4.4, 5.1, 5.5**
    - _Requirements: 4.3, 4.4, 5.1, 5.5_

- [ ] 8. 评分 UI 组件开发
  - [ ] 8.1 创建评分输入组件
    - 创建 `components/rating/rating-input.tsx`
    - 实现可交互的星级评分输入
    - 支持 0.5 精度（半星）
    - 支持 5 个评分维度
    - _Requirements: 4.1_

  - [ ] 8.2 创建评分对话框组件
    - 创建 `components/rating/rating-dialog.tsx`
    - 使用 React Hook Form + Zod 验证
    - 显示 5 个评分维度输入（overall, usability, aesthetics, updateFrequency, freeLevel）
    - 添加可选评论文本框
    - 实现提交和取消功能
    - _Requirements: 4.1, 10.6_

  - [ ] 8.3 创建评分显示组件
    - 创建 `components/rating/rating-display.tsx`
    - 显示策展人评分（默认）
    - 显示聚合评分和评分人数（如果有用户评分）
    - 显示用户个人评分（如果已评分）
    - 显示"评分"或"修改评分"按钮（已登录用户）
    - _Requirements: 5.2, 5.3, 5.4, 10.4_

  - [ ] 8.4 更新 ResourceCard 组件集成评分
    - 修改 `components/resource-card.tsx`
    - 集成 RatingDisplay 组件
    - 添加评分按钮点击处理（打开评分对话框）
    - _Requirements: 10.3_

  - [ ]* 8.5 编写评分 UI 组件单元测试
    - 测试评分输入交互
    - 测试评分对话框表单验证
    - 测试评分显示逻辑
    - _Requirements: 4.1, 5.2, 5.3_

- [ ] 9. Checkpoint - 前台功能验证
  - 确保所有前台功能正常工作：用户登录、评分提交、评分显示
  - 运行所有测试确保通过
  - 如有问题，向用户询问

- [ ] 10. 资源管理 API（管理员功能）
  - [ ] 10.1 创建资源类型和验证 Schema
    - 创建 `types/resource.ts`
    - 定义 CreateResourceRequest, UpdateResourceRequest 接口
    - 定义 CreateResourceSchema, UpdateResourceSchema
    - _Requirements: 3.1, 3.2_

  - [ ] 10.2 实现资源管理 API 端点
    - 创建 `app/api/admin/resources/route.ts`
    - 实现 POST 端点（创建资源）
    - 实现 GET 端点（列表查询，带分页）
    - 使用 `requireAdmin()` 验证管理员权限
    - _Requirements: 3.1_

  - [ ] 10.3 实现单个资源管理 API
    - 创建 `app/api/admin/resources/[id]/route.ts`
    - 实现 GET 端点（获取单个资源）
    - 实现 PUT 端点（更新资源）
    - 实现 DELETE 端点（删除资源，RLS 会自动级联删除评分）
    - 使用 `requireAdmin()` 验证管理员权限
    - _Requirements: 3.2, 3.3_

  - [ ]* 10.4 编写资源管理 API 属性测试
    - **Property 7: Resource Data Validation and Persistence**
    - **Property 8: Cascade Deletion of Ratings**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.5, 3.6**
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

- [ ] 11. 用户管理 API（管理员功能）
  - [ ] 11.1 实现用户列表 API
    - 创建 `app/api/admin/users/route.ts`
    - 实现 GET 端点（用户列表，带分页）
    - 使用 `requireAdmin()` 验证管理员权限
    - _Requirements: 2.2, 2.5_

  - [ ] 11.2 实现用户角色更新 API
    - 创建 `app/api/admin/users/[id]/role/route.ts`
    - 实现 PATCH 端点（更新用户角色）
    - 验证角色值（USER 或 ADMIN）
    - 使用 `requireAdmin()` 验证管理员权限
    - _Requirements: 2.2, 2.5_

  - [ ]* 11.3 编写用户管理 API 属性测试
    - **Property 5: Role Update Operations**
    - **Property 6: Admin Authorization Check**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**
    - _Requirements: 2.2, 2.5_

- [ ] 12. 集成 Vercel 管理后台模板
  - [ ] 12.1 下载并适配 Vercel 官方模板
    - 从 `vercel/nextjs-postgres-nextauth-tailwindcss-template` 获取管理后台代码
    - 参考 GitHub 仓库：https://github.com/vercel/nextjs-postgres-nextauth-tailwindcss-template
    - 将 `app/admin` 相关页面和组件复制到项目
    - 保留布局、导航、表格等通用组件
    - 移除 NextAuth 相关代码
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ] 12.2 替换认证系统为 Supabase
    - 移除模板中的 NextAuth 配置
    - 在 `app/admin/layout.tsx` 中集成 Supabase Auth 权限验证
    - 使用 `requireAdmin()` 函数验证管理员权限
    - 非管理员重定向到首页
    - 更新中间件使用 Supabase 会话
    - _Requirements: 2.3, 2.4, 11.1, 11.2_

  - [ ] 12.3 适配管理员导航组件
    - 更新 `components/admin/admin-nav.tsx`（或从模板复制）
    - 实现侧边栏导航菜单
    - 导航项：仪表板、资源管理、用户管理
    - 集成当前用户信息显示
    - _Requirements: 11.3_

  - [ ]* 12.4 编写管理员权限验证测试
    - 测试管理员访问
    - 测试非管理员重定向
    - _Requirements: 11.1, 11.2_

- [ ] 13. 管理员仪表板页面
  - [ ] 13.1 适配仪表板页面
    - 从 Vercel 模板或 shadcn 官方示例获取仪表板组件
    - 参考：https://ui.shadcn.com/examples/dashboard
    - 创建或更新 `app/admin/page.tsx`
    - 显示关键统计数据（资源数、用户数、评分数）
    - 显示最近活动（新用户、新评分）
    - 使用 Supabase 查询统计数据
    - 集成图表组件（如果需要）
    - _Requirements: 6.1, 11.4_

  - [ ]* 13.2 编写仪表板数据查询单元测试
    - 测试统计数据计算
    - 测试最近活动查询
    - _Requirements: 6.1_

- [ ] 14. 资源管理页面（管理员）
  - [ ] 14.1 适配资源列表页面
    - 从 Vercel 模板获取数据表格组件
    - 创建或更新 `app/admin/resources/page.tsx`
    - 显示资源表格（带分页）
    - 实现搜索和筛选功能
    - 添加"新建资源"按钮
    - _Requirements: 6.2_

  - [ ] 14.2 适配资源表格组件
    - 从 Vercel 模板复制或创建 `components/admin/resource-table.tsx`
    - 显示资源列表（名称、分类、评分、操作）
    - 实现编辑和删除操作
    - 集成 Supabase 数据查询
    - _Requirements: 6.2_

  - [ ] 14.3 创建资源表单组件
    - 创建 `components/admin/resource-form.tsx`
    - 使用 React Hook Form + Zod 验证
    - 表单字段：name, url, description, categoryId, tags, curatorNote, isFeatured
    - 策展人评分输入（5 个维度）
    - 注意：不需要 screenshot 字段，前端会自动从 url 获取图片
    - _Requirements: 6.4_

  - [ ] 14.4 创建新建资源页面
    - 创建 `app/admin/resources/new/page.tsx`
    - 使用 ResourceForm 组件
    - 实现资源创建逻辑
    - _Requirements: 3.1, 6.4_

  - [ ] 14.5 创建编辑资源页面
    - 创建 `app/admin/resources/[id]/edit/page.tsx`
    - 使用 ResourceForm 组件
    - 加载现有资源数据
    - 实现资源更新逻辑
    - _Requirements: 3.2, 6.3, 6.4_

  - [ ]* 14.6 编写资源管理页面单元测试
    - 测试资源列表渲染
    - 测试表单验证
    - 测试创建和更新操作
    - _Requirements: 3.1, 3.2, 6.2, 6.4_

- [ ] 15. 用户管理页面（管理员）
  - [ ] 15.1 适配用户管理页面
    - 从 Vercel 模板获取用户表格组件
    - 创建或更新 `app/admin/users/page.tsx`
    - 显示用户列表（带分页）
    - 实现搜索功能
    - _Requirements: 6.5_

  - [ ] 15.2 适配用户表格组件
    - 从 Vercel 模板复制或创建 `components/admin/user-table.tsx`
    - 显示用户信息（名称、邮箱、角色、注册时间）
    - 实现角色切换功能（USER ↔ ADMIN）
    - 集成 Supabase 数据查询
    - _Requirements: 2.2, 2.5, 6.5_

  - [ ]* 15.3 编写用户管理页面单元测试
    - 测试用户列表渲染
    - 测试角色切换操作
    - _Requirements: 2.2, 2.5_

- [ ] 16. 前端资源缩略图组件
  - [ ] 16.1 创建资源缩略图组件
    - 创建 `components/resource-thumbnail.tsx`
    - 使用 Microlink API 自动获取网站图片
    - 优先使用 Open Graph 图片，回退到截图
    - 实现错误处理和占位图
    - _Requirements: 3.4_

  - [ ] 16.2 集成缩略图到资源卡片
    - 更新 `components/resource-card.tsx`
    - 使用 ResourceThumbnail 组件
    - 添加 lazy loading
    - _Requirements: 3.4_

  - [ ]* 16.3 编写缩略图组件单元测试
    - 测试图片加载
    - 测试错误回退
    - 测试占位图显示
    - _Requirements: 3.4_

- [ ] 17. 错误处理和 API 响应规范化
  - [ ] 17.1 创建错误类型定义
    - 创建 `lib/errors.ts`
    - 定义 AppError, AuthenticationError, AuthorizationError 等
    - _Requirements: 8.6_

  - [ ] 17.2 创建 API 错误处理中间件
    - 创建 `lib/api/error-handler.ts`
    - 实现统一错误处理函数
    - 处理 Zod 验证错误
    - 处理 Supabase 错误
    - 处理应用错误
    - _Requirements: 7.5, 8.6_

  - [ ] 17.3 应用错误处理到所有 API 端点
    - 更新所有 API 路由使用错误处理中间件
    - 确保返回一致的错误响应格式
    - _Requirements: 8.6_

  - [ ]* 17.4 编写错误处理属性测试
    - **Property 15: Database Error Handling**
    - **Property 16: API Request Validation**
    - **Property 17: API Error Response Format**
    - **Validates: Requirements 7.5, 8.5, 8.6, 9.1**
    - _Requirements: 7.5, 8.5, 8.6, 9.1_

- [ ] 18. 数据迁移脚本
  - [ ] 18.1 创建数据迁移脚本
    - 创建 Node.js 脚本读取现有 JSON 数据
    - 读取 `data/resources.json` 和 `data/categories.json`
    - 使用 Supabase Client 插入到数据库
    - 处理重复数据（使用 upsert）
    - _Requirements: 7.1, 7.3_

  - [ ] 18.2 创建数据库种子脚本
    - 创建 `supabase/seed.sql`
    - 添加测试用户（包括管理员）
    - 添加示例评分数据
    - _Requirements: 7.1_

  - [ ]* 18.3 编写数据迁移测试
    - 测试 JSON 数据读取
    - 测试数据插入
    - 验证数据完整性
    - _Requirements: 7.1, 7.3_

- [ ] 19. 前端数据获取更新
  - [ ] 19.1 更新资源查询 Hook
    - 修改 `hooks/use-resources.ts`
    - 从 Supabase 数据库获取资源（而非 JSON 文件）
    - 包含聚合评分和评分人数
    - 使用 TanStack Query 进行缓存
    - _Requirements: 5.2_

  - [ ] 19.2 创建评分相关 Hook
    - 创建 `hooks/use-ratings.ts`
    - 实现 `useSubmitRating` hook
    - 实现 `useResourceRatings` hook
    - 使用 TanStack Query 进行缓存
    - _Requirements: 4.1, 5.1_

  - [ ]* 19.3 编写数据获取 Hook 单元测试
    - 测试资源查询
    - 测试评分提交
    - 测试缓存行为
    - _Requirements: 4.1, 5.1, 5.2_

- [ ] 20. 最终集成和测试
  - [ ] 20.1 端到端功能测试
    - 测试完整的用户流程：登录 → 浏览 → 评分
    - 测试完整的管理员流程：登录 → 管理资源 → 管理用户
    - 验证所有 API 端点正常工作
    - 验证 RLS 策略正确执行
    - _Requirements: 所有_

  - [ ]* 20.2 运行完整测试套件
    - 运行所有单元测试
    - 运行所有属性测试
    - 生成测试覆盖率报告
    - 确保覆盖率达到目标（>80%）
    - _Requirements: 所有_

  - [ ] 20.3 性能优化和代码审查
    - 优化数据库查询（验证索引）
    - 优化 API 响应时间
    - 代码审查和重构
    - _Requirements: 所有_

- [ ] 21. Checkpoint - 最终验证
  - 确保所有功能正常工作
  - 确保所有测试通过
  - 向用户展示完整功能
  - 收集反馈并进行必要调整

## Notes

- 任务标记 `*` 的为可选任务，可以跳过以加快 MVP 开发
- 每个任务都引用了具体的需求编号，便于追溯
- Checkpoint 任务确保增量验证
- 使用 Supabase 简化了认证和数据库管理
- RLS 策略提供数据库级别的安全保护
- 属性测试验证通用正确性属性
- 单元测试验证具体示例和边界情况

## Supabase 优势

1. **托管数据库** - 无需自己管理 PostgreSQL
2. **内置认证** - OAuth 开箱即用
3. **Row Level Security** - 数据库级别的权限控制
4. **实时订阅** - 可选的实时功能
5. **自动 API** - 基于数据库 schema 自动生成 API
6. **类型生成** - 自动生成 TypeScript 类型
7. **简化部署** - 与 Vercel 完美集成

## 管理后台模板集成

**使用 Vercel 官方模板**：
- **仓库**: https://github.com/vercel/nextjs-postgres-nextauth-tailwindcss-template
- **技术栈**: Next.js 15 + Postgres + NextAuth + Tailwind CSS + shadcn/ui
- **集成策略**:
  1. 复用布局、导航、表格等通用组件
  2. 替换 NextAuth 为 Supabase Auth
  3. 替换 Vercel Postgres 为 Supabase PostgreSQL
  4. 保持 shadcn/ui 组件体系一致

**参考 shadcn 官方示例**：
- **地址**: https://ui.shadcn.com/examples/dashboard
- **用途**: 仪表板、图表、数据展示组件

**优势**：
- ✅ 节省大量开发时间
- ✅ UI/UX 已经过验证
- ✅ 响应式设计已完成
- ✅ 代码质量有保证
- ✅ 只需适配数据层和认证层

## 图片获取方案

**零存储成本方案**：使用 Microlink API 前端直接获取网站图片

1. **不存储图片文件** - 数据库只保存资源 URL
2. **前端自动获取** - 使用 Microlink API 获取 Open Graph 图片或截图
3. **完全免费** - Microlink 免费额度足够使用
4. **自动缓存** - Microlink 自动缓存结果
5. **优雅降级** - OG 图片 → 截图 → 占位图

**实现示例：**
```typescript
// 前端直接构造图片 URL
const imageUrl = `https://api.microlink.io/?url=${encodeURIComponent(resource.url)}&meta=false&embed=image.url`
```
