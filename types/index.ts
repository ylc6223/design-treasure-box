import { z } from 'zod'

// ============================================================================
// Zod Schemas (用于运行时验证)
// ============================================================================

/**
 * 评分 Schema
 * 所有评分值必须在 0-5 范围内，支持 0.5 精度
 */
export const RatingSchema = z.object({
  overall: z.number().min(0).max(5).multipleOf(0.5),
  usability: z.number().min(0).max(5).multipleOf(0.5),
  aesthetics: z.number().min(0).max(5).multipleOf(0.5),
  updateFrequency: z.number().min(0).max(5).multipleOf(0.5),
  freeLevel: z.number().min(0).max(5).multipleOf(0.5),
})

/**
 * 资源条目 Schema
 */
export const ResourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url(),
  description: z.string().min(1),
  screenshotUrl: z.string().url().optional().nullable(), // 截图URL，存储在Cloudflare R2
  screenshotUpdatedAt: z.string().optional().nullable(), // 截图更新时间
  categoryId: z.string().min(1),
  tags: z.array(z.string()).min(1), // 至少有一个标签
  rating: RatingSchema,
  curatorNote: z.string().min(1),
  isFeatured: z.boolean(),
  createdAt: z.string(), // ISO 8601 字符串，与数据库返回类型一致
  viewCount: z.number().int().min(0),
  favoriteCount: z.number().int().min(0),
})

/**
 * 分类 Schema
 */
export const CategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().min(1), // Lucide icon name
  description: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/), // 十六进制颜色
})

/**
 * 收藏项 Schema
 */
export const FavoriteItemSchema = z.object({
  resourceId: z.string().min(1),
  addedAt: z.string(), // ISO 8601 字符串
})

/**
 * 本地存储收藏数据 Schema
 */
export const StoredFavoritesSchema = z.object({
  version: z.number().int().positive(),
  items: z.array(FavoriteItemSchema),
  lastUpdated: z.string(), // ISO 8601 字符串
})

// ============================================================================
// TypeScript Types (从 Zod Schema 推导)
// ============================================================================

/**
 * 评分接口
 * 包含资源的各个维度评分
 */
export type Rating = z.infer<typeof RatingSchema>

/**
 * 资源条目接口
 * 代表一个被收录的设计资源网站或工具
 */
export type Resource = z.infer<typeof ResourceSchema>

/**
 * 分类接口
 * 资源的分类信息
 */
export type Category = z.infer<typeof CategorySchema>

/**
 * 收藏项接口
 * 用户收藏的资源记录
 */
export type FavoriteItem = z.infer<typeof FavoriteItemSchema>

/**
 * 本地存储收藏数据接口
 * localStorage 中存储的收藏数据结构
 */
export type StoredFavorites = z.infer<typeof StoredFavoritesSchema>

// ============================================================================
// 常量
// ============================================================================

/**
 * localStorage 键名
 */
export const STORAGE_KEYS = {
  FAVORITES: 'design-treasure-box-favorites',
  THEME: 'design-treasure-box-theme',
} as const

/**
 * 收藏数据版本号
 */
export const FAVORITES_VERSION = 1

// ============================================================================
// 辅助类型
// ============================================================================

/**
 * 排序字段类型
 */
export type SortField = 'viewCount' | 'favoriteCount' | 'createdAt' | 'rating'

/**
 * 排序方向类型
 */
export type SortDirection = 'asc' | 'desc'

/**
 * 搜索筛选参数
 */
export interface SearchFilters {
  query?: string
  categoryId?: string
  tags?: string[]
  isFeatured?: boolean
  sortBy?: SortField
  sortDirection?: SortDirection
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number
  pageSize: number
}

/**
 * 分页结果
 */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
