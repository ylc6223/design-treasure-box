// app/api/ratings/[resourceId]/route.ts
// 资源评分查询 API

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { calculateAggregatedRating } from '@/types/rating';
import { withErrorHandler, successResponse } from '@/lib/api/error-handler';
import { ValidationError } from '@/lib/errors';
import type { Rating } from '@/types/rating';
import type { Database } from '@/types/database';

type RatingRow = Database['public']['Tables']['ratings']['Row'];

/**
 * GET /api/ratings/[resourceId]
 * 获取资源的评分信息
 * - 聚合评分（所有用户评分的平均值）
 * - 评分人数
 * - 当前用户的评分（如果已登录且已评分）
 */
export const GET = withErrorHandler(
  async (_request: NextRequest, { params }: { params: Promise<{ resourceId: string }> }) => {
    const { resourceId } = await params;

    // 验证 resourceId 格式
    if (!resourceId || typeof resourceId !== 'string') {
      throw new ValidationError('Invalid resource ID');
    }

    // 创建 Supabase 客户端
    const supabase = await createClient();

    // 获取当前用户（如果已登录）
    const currentUser = await getCurrentUser();

    // 查询该资源的所有评分
    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select('*')
      .eq('resource_id', resourceId)
      .returns<RatingRow[]>();

    if (ratingsError) {
      throw ratingsError;
    }

    // 计算聚合评分
    let aggregatedRating: Rating | null = null;
    const ratingCount = ratings?.length || 0;

    if (ratings && ratings.length > 0) {
      const ratingObjects: Rating[] = ratings.map((r) => ({
        overall: Number(r.overall),
        usability: Number(r.usability),
        aesthetics: Number(r.aesthetics),
        updateFrequency: Number(r.update_frequency),
        freeLevel: Number(r.free_level),
      }));

      aggregatedRating = calculateAggregatedRating(ratingObjects);
    }

    // 查找当前用户的评分
    let userRating = null;
    if (currentUser && ratings) {
      const userRatingData = ratings.find((r) => r.user_id === currentUser.user.id);

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
        };
      }
    }

    // 返回评分信息
    return successResponse({
      success: true,
      data: {
        aggregatedRating,
        ratingCount,
        userRating,
      },
    });
  }
);
