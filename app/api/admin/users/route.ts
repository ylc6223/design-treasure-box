import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/auth'
import type { PaginatedResponse } from '@/types/resource'

/**
 * 用户响应类型
 */
interface UserResponse {
  id: string
  name: string | null
  email: string
  image: string | null
  role: 'USER' | 'ADMIN'
  created_at: string
  updated_at: string
}

/**
 * GET /api/admin/users
 * 获取用户列表（带分页和搜索）
 * 需要管理员权限
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    await requireAdmin()
    const supabase = await createClient()

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search')
    const role = searchParams.get('role') as 'USER' | 'ADMIN' | null

    // 构建查询
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // 应用筛选
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (role) {
      query = query.eq('role', role)
    }

    // 应用分页
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    // 执行查询
    const { data, error, count } = await query

    if (error) {
      console.error('Failed to fetch users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users', code: 'FETCH_ERROR', details: error.message },
        { status: 500 }
      )
    }

    // 构建分页响应
    const response: PaginatedResponse<UserResponse> = {
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
    console.error('Admin users GET error:', error)

    if (error.message === 'Unauthorized' || error.name === 'AuthenticationError') {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    if (error.message === 'Forbidden' || error.name === 'AuthorizationError') {
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
