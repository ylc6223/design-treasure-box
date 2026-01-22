# Custom Hooks

设计百宝箱应用的自定义 React Hooks。

## 文件结构

```
hooks/
├── use-favorites.ts          # 收藏管理 Hook
├── use-resources.ts          # 资源数据获取 Hook (TanStack Query)
├── use-search.ts             # 搜索筛选 Hook
├── use-scroll-visibility.ts  # 滚动可见性 Hook
├── index.ts                  # 统一导出
├── README.md                 # 本文档
└── __tests__/
    ├── use-favorites.test.ts
    └── use-search.test.ts
```

## Hooks 列表

### 1. useFavorites

管理用户收藏的资源，支持添加、移除、查询和持久化到 localStorage。

**功能：**

- ✅ 添加/移除收藏
- ✅ 检查收藏状态
- ✅ 清空所有收藏
- ✅ localStorage 持久化
- ✅ 数据验证（Zod Schema）

**使用示例：**

```typescript
import { useFavorites } from '@/hooks'

function MyComponent() {
  const {
    favorites,        // string[] - 收藏的资源 ID 列表
    addFavorite,      // (resourceId: string) => void
    removeFavorite,   // (resourceId: string) => void
    isFavorited,      // (resourceId: string) => boolean
    clearFavorites,   // () => void
    isLoading,        // boolean
  } = useFavorites()

  return (
    <button onClick={() => addFavorite('resource-1')}>
      {isFavorited('resource-1') ? '已收藏' : '收藏'}
    </button>
  )
}
```

**特性：**

- 自动从 localStorage 加载收藏数据
- 自动保存到 localStorage
- 防止重复收藏
- 数据验证和错误处理

---

### 2. useResources

使用 TanStack Query 获取和缓存资源数据。

**功能：**

- ✅ 获取所有资源
- ✅ 按 ID 获取单个资源
- ✅ 按分类获取资源
- ✅ 获取精选资源
- ✅ 自动缓存（5分钟）
- ✅ Schema 验证

**使用示例：**

```typescript
import {
  useResources,
  useResourceById,
  useResourcesByCategory,
  useFeaturedResources,
} from '@/hooks'

// 获取所有资源
function AllResources() {
  const { data: resources, isLoading, isError } = useResources()

  if (isLoading) return <div>加载中...</div>
  if (isError) return <div>加载失败</div>

  return <div>{resources?.length} 个资源</div>
}

// 获取单个资源
function ResourceDetail({ id }: { id: string }) {
  const { data: resource } = useResourceById(id)
  return <div>{resource?.name}</div>
}

// 按分类获取
function CategoryResources({ categoryId }: { categoryId: string }) {
  const { data: resources } = useResourcesByCategory(categoryId)
  return <div>{resources?.length} 个资源</div>
}

// 获取精选资源
function FeaturedResources() {
  const { data: featured } = useFeaturedResources()
  return <div>{featured?.length} 个精选资源</div>
}
```

**配置：**

- `staleTime`: 5 分钟（数据保持新鲜）
- `gcTime`: 30 分钟（缓存清除时间）

---

### 3. useSearch

搜索和筛选资源的 Hook。

**功能：**

- ✅ 关键词搜索（名称、描述、标签、推荐语）
- ✅ 分类筛选
- ✅ 标签筛选（多标签 AND 逻辑）
- ✅ 精选筛选
- ✅ 排序（评分、浏览量、收藏量、创建时间）
- ✅ 获取所有标签
- ✅ 获取热门标签

**使用示例：**

```typescript
import { useSearch, useAllTags, usePopularTags } from '@/hooks'
import { useResources } from '@/hooks'

function SearchPage() {
  const { data: resources } = useResources()

  // 搜索和筛选
  const { results, total, hasResults } = useSearch(resources, {
    query: '配色',
    categoryId: 'color',
    tags: ['免费', '工具'],
    isFeatured: true,
    sortBy: 'rating',
    sortDirection: 'desc',
  })

  // 获取所有标签
  const allTags = useAllTags(resources)

  // 获取热门标签（前10个）
  const popularTags = usePopularTags(resources, 10)

  return (
    <div>
      <p>找到 {total} 个结果</p>
      {results.map(resource => (
        <div key={resource.id}>{resource.name}</div>
      ))}
    </div>
  )
}
```

**筛选选项：**

```typescript
interface SearchFilters {
  query?: string; // 关键词搜索
  categoryId?: string; // 分类筛选
  tags?: string[]; // 标签筛选（AND 逻辑）
  isFeatured?: boolean; // 精选筛选
  sortBy?: SortField; // 排序字段
  sortDirection?: SortDirection; // 排序方向
}

type SortField = 'viewCount' | 'favoriteCount' | 'createdAt' | 'rating';
type SortDirection = 'asc' | 'desc';
```

---

### 4. useScrollVisibility

监听页面滚动，在滚动时隐藏元素，停止滚动后延迟显示。

**功能：**

- ✅ 滚动时隐藏
- ✅ 停止滚动后延迟显示
- ✅ 可配置延迟时间
- ✅ 性能优化（passive 事件监听）

**使用示例：**

```typescript
import { useScrollVisibility } from '@/hooks'

function AIPromptInput() {
  const isVisible = useScrollVisibility(300) // 300ms 延迟

  return (
    <div
      className={cn(
        "fixed bottom-6 transition-all duration-200",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-5 pointer-events-none"
      )}
    >
      <input placeholder="输入你想要的设计资源..." />
    </div>
  )
}
```

**参数：**

- `hideDelay`: 滚动停止后延迟显示的时间（毫秒），默认 300ms

**返回值：**

- `isVisible`: boolean - 元素是否可见

---

## 组合使用示例

### 搜索 + 收藏

```typescript
import { useResources, useSearch, useFavorites } from '@/hooks'

function ResourceList() {
  const { data: resources } = useResources()
  const { favorites, addFavorite, removeFavorite, isFavorited } = useFavorites()

  const { results } = useSearch(resources, {
    query: '配色',
    sortBy: 'rating',
    sortDirection: 'desc',
  })

  return (
    <div>
      {results.map(resource => (
        <div key={resource.id}>
          <h3>{resource.name}</h3>
          <button
            onClick={() =>
              isFavorited(resource.id)
                ? removeFavorite(resource.id)
                : addFavorite(resource.id)
            }
          >
            {isFavorited(resource.id) ? '取消收藏' : '收藏'}
          </button>
        </div>
      ))}
    </div>
  )
}
```

### 收藏页面

```typescript
import { useResources, useFavorites } from '@/hooks'

function FavoritesPage() {
  const { data: resources } = useResources()
  const { favorites } = useFavorites()

  const favoriteResources = resources?.filter(r => favorites.includes(r.id))

  return (
    <div>
      <h1>我的收藏 ({favorites.length})</h1>
      {favoriteResources?.map(resource => (
        <div key={resource.id}>{resource.name}</div>
      ))}
    </div>
  )
}
```

---

## 测试

运行 hooks 测试：

```bash
# 测试所有 hooks
pnpm test hooks/

# 测试特定 hook
pnpm test hooks/__tests__/use-favorites.test.ts
pnpm test hooks/__tests__/use-search.test.ts
```

**测试覆盖：**

- ✅ useFavorites: 8 个测试
- ✅ useSearch: 16 个测试
- ✅ 总计: 24 个测试全部通过

---

## 性能优化

### useMemo 优化

`useSearch` 使用 `useMemo` 缓存搜索结果，只在依赖变化时重新计算：

```typescript
const results = useMemo(() => {
  if (!resources) return [];
  return filterResources(resources, filters);
}, [resources, filters]);
```

### TanStack Query 缓存

`useResources` 使用 TanStack Query 自动缓存数据：

- 5 分钟内数据保持新鲜，不会重新请求
- 30 分钟后自动清除缓存
- 支持手动 refetch

### localStorage 优化

`useFavorites` 只在数据变化时写入 localStorage，避免不必要的 I/O 操作。

---

## 依赖

- `react` - React Hooks
- `@tanstack/react-query` - 数据获取和缓存
- `zod` - 数据验证
- `@/types` - 类型定义

---

## 最佳实践

1. **始终处理加载和错误状态**

   ```typescript
   const { data, isLoading, isError } = useResources()
   if (isLoading) return <Loading />
   if (isError) return <Error />
   ```

2. **使用 TypeScript 类型**

   ```typescript
   const { data: resources } = useResources();
   // resources 的类型是 Resource[] | undefined
   ```

3. **组合多个 hooks**

   ```typescript
   // 可以在同一个组件中使用多个 hooks
   const { data: resources } = useResources();
   const { favorites } = useFavorites();
   const { results } = useSearch(resources, filters);
   ```

4. **避免过度筛选**

   ```typescript
   // 不好：多次筛选
   const filtered1 = resources?.filter(...)
   const filtered2 = filtered1?.filter(...)

   // 好：使用 useSearch 一次性筛选
   const { results } = useSearch(resources, { ...allFilters })
   ```
