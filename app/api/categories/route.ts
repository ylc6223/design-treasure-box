import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DatabaseCategorySchema, CreateCategorySchema } from '@/types/category'
import { requireAdmin } from '@/lib/supabase/auth'

/**
 * GET /api/categories
 * 获取所有分类列表
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.error('Failed to fetch categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }

    // 验证数据格式
    const validatedCategories = categories.map(category => 
      DatabaseCategorySchema.parse(category)
    )

    return NextResponse.json({
      data: validatedCategories,
      count: validatedCategories.length
    })
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/categories
 * 创建新分类 (仅管理员)
 */
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    await requireAdmin()

    const body = await request.json()
    const data = CreateCategorySchema.parse(body)

    const supabase = await createClient()

    // 检查ID是否已存在
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('id', data.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Category ID already exists' },
        { status: 409 }
      )
    }

    // 创建分类
    const { data: category, error } = await supabase
      .from('categories')
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error('Failed to create category:', error)
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      )
    }

    const validatedCategory = DatabaseCategorySchema.parse(category)

    return NextResponse.json(validatedCategory, { status: 201 })
  } catch (error: any) {
    console.error('Create category error:', error)
    
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