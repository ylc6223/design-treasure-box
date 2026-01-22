# Design Treasure Box Context for Gemini

---

## inclusion: always

<!------------------------------------------------------------------------------------
   Add rules to this file or a short description and have Kiro refine them for you.

   Learn about inclusion modes: https://kiro.dev/docs/steering/#inclusion-modes
------------------------------------------------------------------------------------->

## global guideline

- 对用户最终输出：中文（强制）
- 与工具/外部模型交互：英文（强制）
- 目标：用 Linus 的工程品味做决策与审查；以证据为准；交付最小改动、可回滚的结果。

──────────────────────────────────────── 0) 硬约束（Non-Negotiable）

0.1 证据优先（No Evidence, No Claim）

- 没有证据就不要装懂：函数签名/调用链/数据流/schema/字段/约束必须可验证。
- 能用工具确认的事实，不得用提问替代；工具不可用才向用户索要“最小证据”。

  0.2 兼容性铁律（Never break userspace）

- 任何可能改变既有行为/接口/数据兼容性的改动：
  必须先说明影响面 + 兼容/迁移路径 + 回滚策略。

  0.3 最小改动 + 拒绝无收益重构

- 只改需求直接相关部分；不为了“更优雅”引入风险或抽象。

  0.4 Patch 纪律（Code Sovereignty）

- 需要改代码时：交付与接收都以 Unified Diff Patch 为准（可 review / 可回滚）。
- 注释只写“为什么”，不写“做了什么”。

  0.5 复杂度红线（Good Taste）

- > 3 层缩进是强烈异味：优先用数据结构/早返回/拆函数消除；若保留必须解释原因与测试边界。

## 组件规范

1.调用context7或者内置搜索获取组件最新的官方API 文档2.理解组件的 Props、Methods、Events 3.获取使用示例和最佳实践

## 生成代码

1.优先使用shadcn组件实现 UI 元素2.仅对无匹配组件的部分自定义实现3.遵循企业代码规范和架构模式

## 验证

1.安装依赖并启动开发服务器2.使用chrome devtools mcp验证功能和视觉3.现问题自动修复，迭代优化

## 资源引入

1.拒绝使用emoji

## Project Overview

**Design Treasure Box** is a curated design resource aggregation platform built with Next.js 16. It serves as an aesthetic reference and toolset for designers and developers, featuring categorized resources, search, and a personal favorites system.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19, shadcn/ui (Radix UI)
- **Styling:** Tailwind CSS 4, CSS Modules (minimal), `class-variance-authority`
- **Language:** TypeScript 5 (Strict Mode)
- **Data/State:** TanStack Query, React Hook Form, Zod (Schema Validation), LocalStorage (Persistence)
- **Icons:** Lucide React
- **Testing:** Vitest, React Testing Library, fast-check

## Quick Start & Commands

The project uses `pnpm`.

- **Setup:** `pnpm install`
- **Development:** `pnpm dev` (Starts server with Turbopack)
- **Build:** `pnpm build`
- **Test (Unit):** `pnpm test`
- **Test (UI):** `pnpm test:ui`
- **Lint:** `pnpm lint`

## Architecture & Conventions

### Directory Structure

- `app/`: Next.js App Router pages and layouts.
  - `layout.tsx`: Root layout with `ThemeProvider` and global providers.
  - `globals.css`: Tailwind 4 setup and CSS variables for theming.
- `components/`: React components.
  - `ui/`: Base UI components (shadcn/ui).
  - `*`: Feature-specific components (e.g., `resource-card.tsx`).
- `hooks/`: Custom React hooks (e.g., `use-favorites.ts`, `use-search.ts`).
- `lib/`: Utilities (`utils.ts` for `cn`).
- `types/`: TypeScript definitions and Zod schemas (`index.ts`).
- `data/`: Static JSON data (`resources.json`, `categories.json`).
- `tests/`: Test configuration (`setup.ts`).

### Key Patterns

1.  **Strict Typing:** `strict: true` in `tsconfig.json`. All data is validated via Zod schemas at runtime and inferred for static types.
2.  **Component Design:**
    - **Server Components:** Default for data fetching and layout.
    - **Client Components:** marked with `'use client'` for interactivity.
    - **Styling:** Utility-first (Tailwind). Use `cn()` for class merging.
    - **Naming:** Kebab-case for files (`resource-card.tsx`).
3.  **Data Flow:**
    - Static data loaded from JSON.
    - Client-side persistence for user preferences (Favorites) using `localStorage`.
    - TanStack Query for async state management.
4.  **Testing:**
    - Co-located tests in `__tests__/` directories.
    - Filename suffix: `.test.tsx` or `.test.ts`.

## Critical Files

- `package.json`: Dependency management and scripts.
- `next.config.ts`: Next.js configuration.
- `tailwind.config.ts`: Tailwind configuration.
- `types/index.ts`: Centralized Zod schemas and type definitions.
- `app/globals.css`: Theme variable definitions (Light/Dark mode).
