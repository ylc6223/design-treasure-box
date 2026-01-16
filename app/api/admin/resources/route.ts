import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/auth'
import { CreateResourceSchema, type PaginatedResponse, type ResourceResponse } from '@/types/resource'
import { withErrorHandler, validateRequestBody, successResponse, createdResponse } from '@/lib/api/error-handler'

/**
 * GET /api/admin/resources
 * 获取资源列表（带分页和筛选）
 * 需要管理员权限
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // 验证管理员权限
  await requireAdmin()
  const supabase = await createClient()

  // 获取查询参数
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const categoryId = searchParams.get('categoryId')
  const search = searchParams.get('search')
  const isFeatured = searchParams.get('isFeatured')

  // 构建查询
  let query = supabase
    .from('resources')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  // 应用筛选
  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (isFeatured !== null) {
    query = query.eq('is_featured', isFeatured === 'true')
  }

  // 应用分页
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  // 执行查询
  const { data, error, count } = await query

  if (error) {
    throw error
  }

  // 构建分页响应
  const response: PaginatedResponse<ResourceResponse> = {
    data: data || [],
    pagination: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
  }

  return successResponse(response)
})

/**
 * POST /api/admin/resources
 * 创建新资源
 * 需要管理员权限
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // 验证管理员权限
  await requireAdmin()
  const supabase = await createClient()

  // 验证请求体
  const data = await validateRequestBody(request, CreateResourceSchema)

  // 插入资源
  const { data: resource, error } = await (supabase as any)
    .from('resources')
    .insert({
      name: data.name,
      url: data.url,
      description: data.description,
      category_id: data.categoryId,
      tags: data.tags,
      curator_note: data.curatorNote,
      is_featured: data.isFeatured,
      curator_rating: data.curatorRating,
      view_count: 0,
      favorite_count: 0,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return createdResponse(resource)
})
