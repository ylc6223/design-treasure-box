// app/api/ratings/route.ts
// 评分提交 API

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/supabase/auth'
import { SubmitRatingSchema } from '@/types/rating'
import { withErrorHandler, validateRequestBody, successResponse } from '@/lib/api/error-handler'

/**
 * POST /api/ratings
 * 提交或更新用户评分
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // 验证用户已登录
  const { user } = await requireAuth()

  // 验证请求体
  const validatedData = await validateRequestBody(request, SubmitRatingSchema)

  // 创建 Supabase 客户端
  const supabase = await createClient()

  // 准备评分数据
  const ratingData = {
    user_id: user.id,
    resource_id: validatedData.resourceId,
    overall: validatedData.overall,
    usability: validatedData.usability,
    aesthetics: validatedData.aesthetics,
    update_frequency: validatedData.updateFrequency,
    free_level: validatedData.freeLevel,
    comment: validatedData.comment || null,
  }

  // 使用 upsert 处理新建和更新评分
  // unique constraint (user_id, resource_id) 确保每个用户对每个资源只有一条评分
  const { data, error } = await (supabase
    .from('ratings')
    .upsert as any)(ratingData, {
      onConflict: 'user_id,resource_id',
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  // 返回成功响应
  return successResponse({
    success: true,
    data: data, // 直接返回数据库数据，不做字段转换
  })
})
