import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/auth'
import { CreateResourceSchema, type PaginatedResponse, type ResourceResponse } from '@/types/resource'

/**
 * GET /api/admin/resources
 * 获取资源列表（带分页和筛选）
 * 需要管理员权限
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const supabase = await createClient()
    await requireAdmin(supabase)

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
      console.error('Failed to fetch resources:', error)
      return NextResponse.json(
        { error: 'Failed to fetch resources', code: 'FETCH_ERROR', details: error.message },
        { status: 500 }
      )
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

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Admin resources GET error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    if (error.message === 'Forbidden') {
      return NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/resources
 * 创建新资源
 * 需要管理员权限
 */
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const supabase = await createClient()
    await requireAdmin(supabase)

    // 解析请求体
    const body = await request.json()

    // 验证数据
    const validationResult = CreateResourceSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

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
      console.error('Failed to create resource:', error)
      return NextResponse.json(
        { error: 'Failed to create resource', code: 'CREATE_ERROR', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(resource, { status: 201 })
  } catch (error: any) {
    console.error('Admin resources POST error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    if (error.message === 'Forbidden') {
      return NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
