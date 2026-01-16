import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/auth'
import { z } from 'zod'

/**
 * 角色更新请求 Schema
 */
const UpdateRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN'], {
    errorMap: () => ({ message: 'Role must be either USER or ADMIN' }),
  }),
})

/**
 * PATCH /api/admin/users/[id]/role
 * 更新用户角色
 * 需要管理员权限
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    const { user: currentUser } = await requireAdmin()
    const supabase = await createClient()

    const { id } = await params

    // 防止管理员修改自己的角色
    if (currentUser.id === id) {
      return NextResponse.json(
        { error: 'Cannot modify your own role', code: 'SELF_MODIFICATION_FORBIDDEN' },
        { status: 403 }
      )
    }

    // 解析请求体
    const body = await request.json()

    // 验证数据
    const validationResult = UpdateRoleSchema.safeParse(body)
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

    const { role } = validationResult.data

    // 更新用户角色
    const { data: profile, error } = await (supabase as any)
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      console.error('Failed to update user role:', error)
      return NextResponse.json(
        { error: 'Failed to update user role', code: 'UPDATE_ERROR', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User role updated successfully',
      profile,
    })
  } catch (error: any) {
    console.error('Admin user role PATCH error:', error)

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
