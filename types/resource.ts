import { z } from 'zod'

/**
 * 资源管理相关类型定义和验证 Schema
 * 用于管理员创建和更新资源
 */

// 评分值验证（0-5，步长 0.5）
const RatingValueSchema = z
  .number()
  .min(0)
  .max(5)
  .multipleOf(0.5)
  .describe('评分值，范围 0-5，步长 0.5')

// 策展人评分 Schema
const CuratorRatingSchema = z.object({
  overall: RatingValueSchema,
  usability: RatingValueSchema,
  aesthetics: RatingValueSchema,
  updateFrequency: RatingValueSchema,
  freeLevel: RatingValueSchema,
})

// 创建资源请求 Schema
export const CreateResourceSchema = z.object({
  name: z.string().min(1, '资源名称不能为空').max(100, '资源名称不能超过 100 字符'),
  url: z.string().url('请输入有效的 URL'),
  description: z.string().min(1, '描述不能为空').max(500, '描述不能超过 500 字符'),
  categoryId: z.string().min(1, '请选择分类'),
  tags: z.array(z.string()).min(1, '至少添加一个标签').max(10, '标签不能超过 10 个'),
  curatorNote: z.string().min(1, '策展人笔记不能为空').max(1000, '策展人笔记不能超过 1000 字符'),
  curatorRating: CuratorRatingSchema,
  isFeatured: z.boolean(),
})

// 更新资源请求 Schema（所有字段可选）
export const UpdateResourceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  description: z.string().min(1).max(500).optional(),
  categoryId: z.string().min(1).optional(),
  tags: z.array(z.string()).min(1).max(10).optional(),
  curatorNote: z.string().min(1).max(1000).optional(),
  isFeatured: z.boolean().optional(),
  curatorRating: CuratorRatingSchema.optional(),
})

// TypeScript 类型推断
export type CreateResourceRequest = z.infer<typeof CreateResourceSchema>
export type UpdateResourceRequest = z.infer<typeof UpdateResourceSchema>
export type CuratorRating = z.infer<typeof CuratorRatingSchema>

// 资源响应类型（从数据库返回）
export interface ResourceResponse {
  id: string
  name: string
  url: string
  description: string
  category_id: string
  tags: string[]
  curator_note: string
  is_featured: boolean
  curator_rating: CuratorRating
  view_count: number
  favorite_count: number
  created_at: string
  updated_at: string
  // 截图相关字段
  screenshot_url: string | null
  screenshot_updated_at: string | null
  screenshot_error: string | null
}

// 资源列表查询参数
export interface ResourceListParams {
  page?: number
  pageSize?: number
  categoryId?: string
  search?: string
  isFeatured?: boolean
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
