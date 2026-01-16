// app/api/ratings/route.ts
// 评分提交 API

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/supabase/auth'
import { SubmitRatingSchema } from '@/types/rating'
import { ZodError } from 'zod'

/**
 * POST /api/ratings
 * 提交或更新用户评分
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户已登录
    const { user } = await requireAuth()

    // 解析请求体
    const body = await request.json()

    // 验证评分数据
    const validatedData = SubmitRatingSchema.parse(body)

    // 创建 Supabase 客户端
    const supabase = await createClient()

    // 使用 upsert 处理新建和更新评分
    // unique constraint (user_id, resource_id) 确保每个用户对每个资源只有一条评分
    const { data, error } = await supabase
      .from('ratings')
      .upsert(
        {
          user_id: user.id,
          resource_id: validatedData.resourceId,
          overall: validatedData.overall,
          usability: validatedData.usability,
          aesthetics: validatedData.aesthetics,
          update_frequency: validatedData.updateFrequency,
          free_level: validatedData.freeLevel,
          comment: validatedData.comment || null,
        },
        {
          onConflict: 'user_id,resource_id',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Rating submission error:', error)
      return NextResponse.json(
        {
          error: 'Failed to submit rating',
          code: 'RATING_SUBMISSION_ERROR',
          details: error.message,
        },
        { status: 500 }
      )
    }

    // 返回成功响应
    return NextResponse.json(
      {
        success: true,
        data: {
          id: data.id,
          userId: data.user_id,
          resourceId: data.resource_id,
          overall: data.overall,
          usability: data.usability,
          aesthetics: data.aesthetics,
          updateFrequency: data.update_frequency,
          freeLevel: data.free_level,
          comment: data.comment,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    // Zod 验证错误
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    // 认证错误
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json(
        {
          error: error.message,
          code: 'AUTHENTICATION_ERROR',
        },
        { status: 401 }
      )
    }

    // 未知错误
    console.error('Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
