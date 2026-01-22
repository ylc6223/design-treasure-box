# 数据类型定义

这个目录包含了设计百宝箱应用的所有数据类型定义和验证 schema。

## 文件结构

```
types/
├── index.ts          # 主要类型定义和 Zod schemas
├── examples.ts       # 使用示例
├── README.md         # 本文档
└── __tests__/
    └── index.test.ts # 类型验证测试
```

## 核心类型

### Rating（评分）

资源的多维度评分，所有值必须在 0-5 范围内，支持 0.5 精度。

```typescript
interface Rating {
  overall: number; // 综合评分
  usability: number; // 实用性
  aesthetics: number; // 美观度
  updateFrequency: number; // 更新频率
  freeLevel: number; // 免费程度
}
```

### Resource（资源条目）

代表一个被收录的设计资源网站或工具。

```typescript
interface Resource {
  id: string;
  name: string;
  url: string;
  description: string;
  screenshot: string;
  categoryId: string;
  tags: string[]; // 至少包含一个标签
  rating: Rating;
  curatorNote: string;
  isFeatured: boolean;
  createdAt: string; // ISO 8601 格式
  viewCount: number;
  favoriteCount: number;
}
```

### Category（分类）

资源的分类信息。

```typescript
interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon 名称
  description: string;
  color: string; // 十六进制颜色 (#RRGGBB)
}
```

### FavoriteItem（收藏项）

用户收藏的资源记录。

```typescript
interface FavoriteItem {
  resourceId: string;
  addedAt: string; // ISO 8601 格式
}
```

### StoredFavorites（本地存储收藏数据）

localStorage 中存储的收藏数据结构。

```typescript
interface StoredFavorites {
  version: number;
  items: FavoriteItem[];
  lastUpdated: string; // ISO 8601 格式
}
```

## Zod Schemas

所有类型都有对应的 Zod schema 用于运行时验证：

- `RatingSchema`
- `ResourceSchema`
- `CategorySchema`
- `FavoriteItemSchema`
- `StoredFavoritesSchema`

## 使用示例

### 1. 导入类型

```typescript
import { type Resource, type Category, type Rating, ResourceSchema, CategorySchema } from '@/types';
```

### 2. 创建对象

```typescript
const resource: Resource = {
  id: 'coolors-1',
  name: 'Coolors',
  url: 'https://coolors.co',
  description: '快速生成配色方案的在线工具',
  screenshot: 'https://example.com/screenshot.jpg',
  categoryId: 'color',
  tags: ['配色', '工具', '免费'],
  rating: {
    overall: 4.5,
    usability: 5.0,
    aesthetics: 4.5,
    updateFrequency: 4.0,
    freeLevel: 5.0,
  },
  curatorNote: '非常好用的配色工具',
  isFeatured: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  viewCount: 1000,
  favoriteCount: 250,
};
```

### 3. 验证数据

```typescript
// 验证从 API 或文件读取的数据
const result = ResourceSchema.safeParse(data);

if (result.success) {
  const resource: Resource = result.data;
  // 使用验证后的数据
} else {
  console.error('数据验证失败:', result.error);
}
```

### 4. 类型守卫

```typescript
function isValidResource(data: unknown): data is Resource {
  return ResourceSchema.safeParse(data).success;
}
```

## 辅助类型

### SearchFilters（搜索筛选参数）

```typescript
interface SearchFilters {
  query?: string;
  categoryId?: string;
  tags?: string[];
  isFeatured?: boolean;
  sortBy?: SortField;
  sortDirection?: SortDirection;
}
```

### PaginatedResult（分页结果）

```typescript
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

## 常量

```typescript
// localStorage 键名
STORAGE_KEYS.FAVORITES; // 'design-treasure-box-favorites'
STORAGE_KEYS.THEME; // 'design-treasure-box-theme'

// 收藏数据版本号
FAVORITES_VERSION; // 1
```

## 验证规则

### Rating 验证规则

- 所有评分值必须在 0-5 范围内
- 必须是 0.5 的倍数（0, 0.5, 1.0, 1.5, ..., 5.0）

### Resource 验证规则

- `url` 和 `screenshot` 必须是有效的 URL
- `tags` 数组至少包含一个标签
- `createdAt` 必须是 ISO 8601 格式的日期时间字符串
- `viewCount` 和 `favoriteCount` 必须是非负整数

### Category 验证规则

- `color` 必须是十六进制颜色格式（#RRGGBB）
- 支持大小写字母

### FavoriteItem 验证规则

- `addedAt` 必须是 ISO 8601 格式的日期时间字符串

## 测试

运行类型验证测试：

```bash
pnpm test types/__tests__/index.test.ts
```

测试覆盖：

- ✅ 有效数据验证
- ✅ 无效数据拒绝
- ✅ 边界情况处理
- ✅ 类型推导正确性
