# Components

设计百宝箱应用的自定义组件库。

## 核心组件

### ResourceCard

资源卡片组件，用于展示单个设计资源。

**特性：**

- 网站截图展示（自适应高度，16:10 比例）
- 精选标识（Sparkles 图标）
- 评分星星显示（支持半星精度）
- 简介描述（2行截断）
- 标签展示（最多显示3个，超出显示 +N）
- 收藏按钮（Heart 图标，支持填充状态）
- 访问按钮（ExternalLink 图标）
- 悬停上浮动效（translateY + shadow）
- 图片加载失败处理

**使用示例：**

```tsx
import { ResourceCard } from '@/components/resource-card';
import { useFavorites } from '@/hooks';

function MyComponent() {
  const { isFavorited, toggleFavorite } = useFavorites();

  return (
    <ResourceCard
      resource={resource}
      isFavorited={isFavorited(resource.id)}
      onFavorite={() => toggleFavorite(resource.id)}
      onVisit={() => window.open(resource.url, '_blank')}
    />
  );
}
```

### MasonryGrid

瀑布流网格布局组件，用于展示多个资源卡片。

**特性：**

- CSS Grid 瀑布流布局
- 响应式列数：
  - XL (≥1440px): 5列
  - Desktop (≥1200px): 4列
  - Tablet (768-1199px): 3列
  - Mobile (<768px): 2列
- Stagger fade-in 加载动画（每个卡片延迟 50ms）
- 空状态提示
- 自定义 className 支持

**使用示例：**

```tsx
import { MasonryGrid } from '@/components/masonry-grid';
import { useFavorites, useResources } from '@/hooks';

function MyComponent() {
  const { data: resources = [] } = useResources();
  const { isFavorited, toggleFavorite } = useFavorites();

  return (
    <MasonryGrid
      resources={resources}
      isFavorited={isFavorited}
      onFavorite={toggleFavorite}
      onVisit={(url) => window.open(url, '_blank')}
    />
  );
}
```

### DockSidebar

macOS 风格的侧边栏导航组件。

**特性：**

- 固定左侧 64px 宽度
- 垂直居中紧凑型布局
- Lucide 图标
- 毛玻璃背景效果
- 悬停放大效果
- 激活状态指示器
- Tooltip 提示
- 响应式：移动端转为底部 Tab Bar

### AIPromptInput

底部悬浮的 AI 提示输入框组件。

**特性：**

- 固定底部悬浮
- 毛玻璃背景
- 胶囊形圆角
- MessageSquare 图标提示
- ArrowUp 发送按钮
- 滚动时自动隐藏
- 停止滚动 300ms 后显示
- 平滑过渡动画

### ThemeToggle

主题切换组件。

**特性：**

- Sun/Moon 图标切换
- 支持浅色/深色模式
- 平滑过渡动画

### Header

顶部导航栏组件。

**特性：**

- Logo + 品牌名称
- 分类标签横向滚动
- 激活状态高亮
- 收藏入口（Heart 图标）
- 主题切换按钮
- 响应式设计
- Sticky 定位

**使用示例：**

```tsx
import { Header } from '@/components/header';
import { useState } from 'react';
import categories from '@/data/categories.json';

function MyComponent() {
  const [activeCategory, setActiveCategory] = useState('');

  return (
    <Header
      categories={categories}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
    />
  );
}
```

## UI 组件

基于 shadcn/ui 的组件：

- **Card**: 卡片容器
- **Button**: 按钮
- **Input**: 输入框
- **Badge**: 标签
- **Dialog**: 对话框
- **Tooltip**: 提示框
- **ScrollArea**: 滚动区域
- **Skeleton**: 加载占位

## 测试

所有组件都有对应的测试文件：

```bash
# 运行所有测试
npm test

# 运行特定组件测试
npm test -- resource-card.test.tsx

# 查看测试覆盖率
npm run test:coverage
```

## 开发指南

### 组件开发规范

1. **TypeScript 严格模式**：所有组件必须使用 TypeScript 严格模式
2. **Props 接口**：为每个组件定义清晰的 Props 接口
3. **可访问性**：确保组件符合 WCAG 2.1 AA 标准
4. **响应式设计**：支持桌面、平板、移动端
5. **主题支持**：支持浅色/深色主题
6. **测试覆盖**：每个组件必须有对应的测试文件

### 样式规范

- 使用 Tailwind CSS 4 进行样式编写
- 使用 `cn()` 工具函数合并类名
- 遵循设计系统的颜色、间距、圆角规范
- 使用 CSS 变量支持主题切换

### 图标使用

- 使用 Lucide React 图标库
- 禁止使用 emoji
- 图标大小遵循设计规范（通常为 h-4 w-4 或 h-5 w-5）

## 文件结构

```
components/
├── __tests__/              # 组件测试
│   ├── ai-prompt-input.test.tsx
│   ├── dock-sidebar.test.tsx
│   ├── header.test.tsx
│   ├── masonry-grid.test.tsx
│   ├── rating-stars.test.tsx
│   ├── resource-card.test.tsx
│   └── theme-toggle.test.tsx
├── ui/                     # shadcn/ui 组件
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
├── ai-prompt-input.tsx     # AI 输入框
├── dock-sidebar.tsx        # Dock 侧边栏
├── header.tsx              # 顶部导航
├── header-example.tsx      # Header 使用示例
├── masonry-grid.tsx        # 瀑布流网格
├── masonry-grid-example.tsx # 瀑布流使用示例
├── rating-stars.tsx        # 评分星星
├── resource-card.tsx       # 资源卡片
├── resource-card-example.tsx # 资源卡片使用示例
├── theme-toggle.tsx        # 主题切换
└── README.md              # 本文件
```
