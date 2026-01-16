// app/api/ratings/[resourceId]/route.ts
// 资源评分查询 API

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { calculateAggregatedRating } from '@/types/rating'
import type { Rating } from '@/types/rating'
import type { Database } from '@/types/database'

type RatingRow = Database['public']['Tables']['ratings']['Row']

/**
 * GET /api/ratings/[resourceId]
 * 获取资源的评分信息
 * - 聚合评分（所有用户评分的平均值）
 * - 评分人数
 * - 当前用户的评分（如果已登录且已评分）
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const { resourceId } = await params

    // 验证 resourceId 格式
    if (!resourceId || typeof resourceId !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid resource ID',
          code: 'INVALID_RESOURCE_ID',
        },
        { status: 400 }
      )
    }

    // 创建 Supabase 客户端
    const supabase = await createClient()

    // 获取当前用户（如果已登录）
    const currentUser = await getCurrentUser()

    // 查询该资源的所有评分
    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select('*')
      .eq('resource_id', resourceId)
      .returns<RatingRow[]>()

    if (ratingsError) {
      console.error('Ratings query error:', ratingsError)
      return NextResponse.json(
        {
          error: 'Failed to fetch ratings',
          code: 'RATINGS_QUERY_ERROR',
          details: ratingsError.message,
        },
        { status: 500 }
      )
    }

    // 计算聚合评分
    let aggregatedRating: Rating | null = null
    const ratingCount = ratings?.length || 0

    if (ratings && ratings.length > 0) {
      const ratingObjects: Rating[] = ratings.map((r) => ({
        overall: Number(r.overall),
        usability: Number(r.usability),
        aesthetics: Number(r.aesthetics),
        updateFrequency: Number(r.update_frequency),
        freeLevel: Number(r.free_level),
      }))

      aggregatedRating = calculateAggregatedRating(ratingObjects)
    }

    // 查找当前用户的评分
    let userRating = null
    if (currentUser && ratings) {
      const userRatingData = ratings.find(
        (r) => r.user_id === currentUser.user.id
      )

      if (userRatingData) {
        userRating = {
          id: userRatingData.id,
          userId: userRatingData.user_id,
          resourceId: userRatingData.resource_id,
          overall: Number(userRatingData.overall),
          usability: Number(userRatingData.usability),
          aesthetics: Number(userRatingData.aesthetics),
          updateFrequency: Number(userRatingData.update_frequency),
          freeLevel: Number(userRatingData.free_level),
          comment: userRatingData.comment,
          createdAt: userRatingData.created_at,
          updatedAt: userRatingData.updated_at,
        }
      }
    }

    // 返回评分信息
    return NextResponse.json(
      {
        success: true,
        data: {
          aggregatedRating,
          ratingCount,
          userRating,
        },
      },
      { status: 200 }
    )
  } catch (error) {
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
