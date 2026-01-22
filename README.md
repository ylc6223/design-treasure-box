# 设计百宝箱 (Design Treasure Box)

精选设计资源聚合入口，为设计师和开发者提供高质量的设计美学参考与工具集。

## 项目概述

**Design Treasure Box** 是一个基于 Next.js 16 构建的现代化设计资源聚合平台。它不仅是一个美学参考库，更是一个高效的工具集，支持资源分类、深度搜索、评分系统以及个人收藏功能。

## 技术栈

项目采用了前沿的现代化开发栈，确保高性能与卓越的开发体验：

- **框架**: Next.js 16 (App Router)
- **UI 库**: React 19, shadcn/ui (Radix UI)
- **样式**: Tailwind CSS 4, CSS Modules, class-variance-authority
- **语言**: TypeScript 5 (Strict Mode)
- **数据/状态**: TanStack Query, React Hook Form, Zod (Schema Validation), Zustand, LocalStorage (Persistence)
- **后端/认证**: Supabase (Auth, DB)
- **图标**: Lucide React
- **动画**: Motion (Framer Motion), tw-animate-css
- **测试**: Vitest, React Testing Library, fast-check

## 核心功能

- **资源分类浏览**: 经过筛选的高质量设计资源分类展示。
- **智能搜索与筛选**: 支持多纬度的资源快速检索。
- **专业评分系统**: 深度展示资源的质量参考。
- **个人收藏系统**: 本地持久化的用户收藏管理。
- **响应式设计**: 完美适配桌面与移动端设备。
- **深色/浅色主题**: 原生支持系统级的主题切换。
- **AI 集成**: 内置 AI 能力辅助资源处理与交互。

## 快速开始

项目使用 `pnpm` 作为包管理器。

### 安装依赖

```bash
pnpm install
```

### 开发环境

```bash
pnpm dev
```

### 生产构建

```bash
pnpm build
pnpm start
```

### 运行测试

```bash
pnpm test          # 运行单元测试
pnpm test:ui       # 以 UI 模式运行 Vitest
pnpm test:coverage # 生成覆盖率报告
```

## 项目结构

```text
app/                    # Next.js App Router (页面、布局、全局样式)
components/             # React 组件库
├── ui/                 # 基础 shadcn/ui 组件
└── ...                 # 业务功能组件
hooks/                  # 自定义 React Hooks
lib/                    # 核心工具函数与配置
data/                   # 预置 JSON 静态数据
types/                  # TypeScript 类型定义与 Zod Schema
supabase/               # 数据库迁移与配置文件
tests/                  # 测试配置文件
```

## 开发规范

为了保证代码质量与一致性，请遵循以下规范：

1.  **严格类型**: 所有数据流必须通过 Zod Schema 进行运行时验证与类型推导。
2.  **组件驱动**: 优先使用 shadcn/ui 组件库，保持设计语言统一。
3.  **样式优先**: 严格使用 Tailwind CSS 4 进行样式定义，避免使用内联样式。
4.  **资源引用**: 核心资源通过 JSON 或数据库进行管理，保持数据驱动。
5.  **禁止 Emoji**: 在图标使用上请统一使用 Lucide React，禁止在 UI 中直接使用系统 Emoji。

## License

MIT
