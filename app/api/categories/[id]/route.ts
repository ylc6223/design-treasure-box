import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DatabaseCategorySchema, UpdateCategorySchema } from '@/types/category'
import { requireAdmin } from '@/lib/supabase/auth'

/**
 * GET /api/categories/[id]
 * 获取单个分类详情
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
      
      console.error('Failed to fetch category:', error)
      return NextResponse.json(
        { error: 'Failed to fetch category' },
        { status: 500 }
      )
    }

    const validatedCategory = DatabaseCategorySchema.parse(category)

    return NextResponse.json(validatedCategory)
  } catch (error) {
    console.error('Category API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/categories/[id]
 * 更新分类 (仅管理员)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    await requireAdmin()

    const { id } = await params
    const body = await request.json()
    const data = UpdateCategorySchema.parse(body)

    const supabase = await createClient()

    // 更新分类
    const { data: category, error } = await (supabase as any)
      .from('categories')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
      
      console.error('Failed to update category:', error)
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      )
    }

    const validatedCategory = DatabaseCategorySchema.parse(category)

    return NextResponse.json(validatedCategory)
  } catch (error: any) {
    console.error('Update category error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/categories/[id]
 * 删除分类 (仅管理员)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    await requireAdmin()

    const { id } = await params
    const supabase = await createClient()

    // 检查是否有资源使用此分类
    const { count: resourceCount } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)

    if (resourceCount && resourceCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing resources' },
        { status: 409 }
      )
    }

    // 删除分类
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete category:', error)
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete category error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}