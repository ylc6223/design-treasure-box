import { z } from 'zod'

// ============================================================================
// Database Category Types (数据库分类类型)
// ============================================================================

/**
 * 数据库分类 Schema
 * 对应 public.categories 表结构
 */
export const DatabaseCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().min(1), // Lucide icon name
  description: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/), // 十六进制颜色
  created_at: z.string(), // ISO 8601 字符串
  updated_at: z.string(), // ISO 8601 字符串
})

/**
 * 创建分类请求 Schema
 */
export const CreateCategorySchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  icon: z.string().min(1).max(50),
  description: z.string().min(1).max(500),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
})

/**
 * 更新分类请求 Schema
 */
export const UpdateCategorySchema = CreateCategorySchema.partial()

// ============================================================================
// TypeScript Types (从 Zod Schema 推导)
// ============================================================================

/**
 * 数据库分类接口
 */
export type DatabaseCategory = z.infer<typeof DatabaseCategorySchema>

/**
 * 创建分类请求接口
 */
export type CreateCategoryRequest = z.infer<typeof CreateCategorySchema>

/**
 * 更新分类请求接口
 */
export type UpdateCategoryRequest = z.infer<typeof UpdateCategorySchema>

/**
 * 分页响应接口
 */
export interface PaginatedCategoryResponse {
  data: DatabaseCategory[]
  pagination: {
    page: number
    pageSize: number
    totalPages: number
    totalCount: number
  }
}