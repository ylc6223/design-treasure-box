'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { SubmitRatingRequest, ResourceRatings } from '@/types/rating';

/**
 * 获取资源的评分信息
 *
 * @param resourceId - 资源 ID
 * @returns 评分信息（聚合评分、评分人数、用户评分）
 */
async function fetchResourceRatings(resourceId: string): Promise<ResourceRatings> {
  const response = await fetch(`/api/ratings/${resourceId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch ratings');
  }

  const result = await response.json();
  return result.data;
}

/**
 * 提交或更新评分
 *
 * @param ratingData - 评分数据
 * @returns 提交结果
 */
async function submitRating(ratingData: SubmitRatingRequest) {
  const supabase = createClient();

  // 检查用户是否已登录
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  const response = await fetch('/api/ratings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ratingData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit rating');
  }

  return response.json();
}

/**
 * useResourceRatings Hook
 *
 * 获取资源的评分信息
 *
 * @param resourceId - 资源 ID
 * @returns Query 结果对象
 */
export function useResourceRatings(resourceId: string) {
  return useQuery({
    queryKey: ['ratings', resourceId],
    queryFn: () => fetchResourceRatings(resourceId),
    staleTime: 1000 * 60 * 2, // 2 分钟内数据保持新鲜
    gcTime: 1000 * 60 * 10, // 10 分钟后清除缓存
    enabled: !!resourceId, // 只有当 resourceId 存在时才执行查询
  });
}

/**
 * useSubmitRating Hook
 *
 * 提交或更新用户评分
 *
 * @returns Mutation 对象
 */
export function useSubmitRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitRating,
    onSuccess: (_data, variables) => {
      // 使评分查询缓存失效，触发重新获取
      queryClient.invalidateQueries({
        queryKey: ['ratings', variables.resourceId],
      });

      // 使资源列表缓存失效（因为聚合评分可能改变）
      queryClient.invalidateQueries({
        queryKey: ['resources'],
      });
    },
  });
}

/**
 * useUserRating Hook
 *
 * 获取当前用户对特定资源的评分
 *
 * @param resourceId - 资源 ID
 * @returns 用户评分数据
 */
export function useUserRating(resourceId: string) {
  const { data: ratingsData, ...rest } = useResourceRatings(resourceId);

  return {
    data: ratingsData?.userRating,
    ...rest,
  };
}

/**
 * useAggregatedRating Hook
 *
 * 获取资源的聚合评分
 *
 * @param resourceId - 资源 ID
 * @returns 聚合评分数据
 */
export function useAggregatedRating(resourceId: string) {
  const { data: ratingsData, ...rest } = useResourceRatings(resourceId);

  return {
    data: ratingsData?.aggregatedRating,
    ratingCount: ratingsData?.ratingCount || 0,
    ...rest,
  };
}
