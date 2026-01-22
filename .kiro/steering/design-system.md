# 设计系统规则 - Design Treasure Box

## 设计令牌 (Design Tokens)

### 颜色系统

项目使用 CSS 变量定义的语义化颜色系统，支持深色/浅色主题：

```css
/* 浅色模式 */
:root {
  --background: #fafafa; /* 页面背景 */
  --surface: #ffffff; /* 卡片/组件背景 */
  --border: #e5e5e5; /* 边框颜色 */
  --text-primary: #171717; /* 主要文本 */
  --text-secondary: #737373; /* 次要文本 */
  --text-muted: #a3a3a3; /* 弱化文本 */
  --accent: #000000; /* 强调色 */
  --accent-foreground: #ffffff;
  --highlight: #f59e0b; /* 高亮色（精选标识） */
  --glass: rgba(255, 255, 255, 0.8); /* 毛玻璃效果 */
  --shadow: rgba(0, 0, 0, 0.1); /* 阴影 */
}
```

**Tailwind 配置映射：**

```typescript
colors: {
  background: 'var(--background)',
  surface: 'var(--surface)',
  border: 'var(--border)',
  'text-primary': 'var(--text-primary)',
  'text-secondary': 'var(--text-secondary)',
  'text-muted': 'var(--text-muted)',
  accent: {
    DEFAULT: 'var(--accent)',
    foreground: 'var(--accent-foreground)',
  },
  highlight: 'var(--highlight)',
}
```

### 字体系统

```typescript
fontFamily: {
  display: ['SF Pro Display', '-apple-system', 'sans-serif'],  // 标题字体
  body: ['SF Pro Text', '-apple-system', 'sans-serif'],        // 正文字体
  mono: ['SF Mono', 'monospace'],                              // 等宽字体
}
```

### 响应式断点

```typescript
// Tailwind 默认断点 + 项目自定义
mobile: '<768px',      // 移动端
tablet: '768-1199px',  // 平板
desktop: '≥1200px',    // 桌面端
xl: '≥1440px'          // 超大屏
```

## 组件架构

### 基础组件 (components/ui/)

使用 **shadcn/ui** 组件库，基于 Radix UI + Tailwind CSS：

```typescript
// 配置文件：components.json
{
  "style": "new-york",           // shadcn/ui 风格
  "rsc": true,                   // React Server Components
  "tsx": true,                   // TypeScript
  "tailwind": {
    "cssVariables": true,        // 使用 CSS 变量
    "baseColor": "neutral"       // 基础色调
  },
  "iconLibrary": "radix"         // 图标库
}
```

**组件变体管理：**

```typescript
// 使用 class-variance-authority (cva)
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        // ...
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        icon: 'h-9 w-9',
      },
    },
  }
);
```

### 业务组件 (components/)

**命名约定：** kebab-case (例如：`resource-card.tsx`)

**组件结构模式：**

```typescript
'use client'  // 仅在需要客户端交互时使用

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { ComponentProps } from '@/types'

export interface ComponentNameProps {
  // 明确的 Props 接口定义
}

export function ComponentName({ ...props }: ComponentNameProps) {
  // 功能实现
  return (
    <div className={cn("base-classes", conditionalClasses)}>
      {/* JSX 内容 */}
    </div>
  )
}
```

### 样式合并工具

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs)); // 智能合并 Tailwind 类名
}
```

## 图标系统

**主要图标库：** Lucide React (禁止使用 emoji)

```typescript
import { Heart, ExternalLink, Sparkles } from 'lucide-react'

// 使用模式
<Heart className="h-5 w-5" />
<ExternalLink className="h-3.5 w-3.5" />
```

**图标尺寸约定：**

- `h-3 w-3` (12px) - 小图标
- `h-4 w-4` (16px) - 默认图标
- `h-5 w-5` (20px) - 中等图标
- `h-6 w-6` (24px) - 大图标

## 布局系统

### 网格布局

**Masonry 网格：** 使用 `masonic` 库实现瀑布流布局

```typescript
import { Masonry } from 'masonic';

// 响应式列数配置
const columnCount = {
  mobile: 1,
  tablet: 2,
  desktop: 3,
  xl: 4,
};
```

### 间距系统

遵循 Tailwind 默认间距比例 (4px 基数)：

- `gap-1.5` (6px) - 小间距
- `gap-3` (12px) - 默认间距
- `gap-4` (16px) - 中等间距
- `gap-6` (24px) - 大间距

## 动画与交互

### 过渡动画

```css
/* 全局动画类 */
.animate-fade-in {
  animation: fade-in 0.4s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 悬停效果

```typescript
// 卡片悬停上浮
className={cn(
  'transition-all duration-200 ease-out',
  'hover:-translate-y-1 hover:shadow-lg'
)}

// 图片缩放效果
className="transition-transform duration-300 group-hover:scale-105"
```

## 数据验证

### Zod Schema 模式

```typescript
// types/index.ts
export const ResourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  rating: z.object({
    overall: z.number().min(0).max(5).multipleOf(0.5),
  }),
  // ...
});

export type Resource = z.infer<typeof ResourceSchema>;
```

### 运行时验证

```typescript
// 数据加载时验证
const validatedData = ResourceSchema.parse(rawData);
```

## 状态管理

### 客户端状态

- **React hooks:** useState, useReducer
- **持久化:** localStorage + Zod 验证

### 服务端状态

- **TanStack Query:** 数据获取、缓存、同步

### 全局状态

- **React Context:** 主题、收藏等跨组件状态

## 文件组织

```
components/
├── ui/                 # shadcn/ui 基础组件
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
├── resource-card.tsx   # 业务组件
├── masonry-grid.tsx
└── __tests__/         # 组件测试
```

## 类型安全

### 严格 TypeScript 配置

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

### 路径别名

```typescript
// tsconfig.json
"paths": {
  "@/*": ["./*"]
}

// 使用示例
import { Resource } from '@/types'
import { cn } from '@/lib/utils'
```

## 性能优化

### 图片优化

```typescript
// Next.js Image 组件
<Image
  src={resource.screenshot}
  alt={resource.name}
  fill
  className="object-cover"
  onError={() => setImageError(true)}
/>
```

### 代码分割

```typescript
// 客户端组件按需加载
'use client'; // 仅在需要时使用
```

## 可访问性 (A11y)

### ARIA 标签

```typescript
<Button
  aria-label={isFavorited ? '取消收藏' : '收藏'}
  className="..."
>
  <Heart className="h-5 w-5" />
</Button>
```

### 键盘导航

- 所有交互元素支持键盘访问
- 合理的 Tab 顺序
- 焦点可见性

## 主题系统

### 深色/浅色模式

```typescript
// next-themes 配置
import { ThemeProvider } from 'next-themes'

<ThemeProvider attribute="class" defaultTheme="system">
  {children}
</ThemeProvider>
```

### CSS 变量切换

```css
:root {
  /* 浅色模式变量 */
}
.dark {
  /* 深色模式变量 */
}
```

## 构建配置

### Tailwind CSS 4

```typescript
// tailwind.config.ts
export default {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      /* 自定义配置 */
    },
  },
};
```

### Next.js 16 + React 19

- App Router 架构
- React Server Components 默认
- Turbopack 开发构建
