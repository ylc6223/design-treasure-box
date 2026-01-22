'use client';

import * as React from 'react';
import { RatingDialog } from '@/components/rating/rating-dialog';
import { RatingDisplay } from '@/components/rating/rating-display';
import { createClient } from '@/lib/supabase/client';
import type { Resource } from '@/types';
import type { ResourceRatings, SubmitRatingRequest } from '@/types/rating';

export interface RatingSectionProps {
  resource: Resource;
}

/**
 * RatingSection 组件
 *
 * 资源详情页的评分区域，包含：
 * - 评分显示（策展人评分、用户聚合评分、个人评分）
 * - 评分对话框（提交/编辑评分）
 *
 * 使用示例：
 * ```tsx
 * <RatingSection resource={resource} />
 * ```
 */
export function RatingSection({ resource }: RatingSectionProps) {
  const [user, setUser] = React.useState<any>(null);
  const [ratings, setRatings] = React.useState<ResourceRatings | null>(null);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // 获取当前用户
  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  // 获取评分数据
  React.useEffect(() => {
    fetchRatings();
  }, [resource.id]);

  const fetchRatings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/ratings/${resource.id}`);
      const result = await response.json();

      if (result.success) {
        setRatings(result.data);
      } else {
        setError(result.error || '获取评分失败');
      }
    } catch (err) {
      console.error('Failed to fetch ratings:', err);
      setError('获取评分失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 提交评分
  const handleSubmitRating = async (data: SubmitRatingRequest) => {
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '评分提交失败');
      }

      if (result.success) {
        // 刷新评分数据
        await fetchRatings();

        // 可选：显示成功提示
        console.log('评分提交成功！');
      } else {
        throw new Error(result.error || '评分提交失败');
      }
    } catch (err) {
      console.error('Rating submission error:', err);
      throw err; // 让对话框处理错误显示
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={fetchRatings}
          className="mt-2 text-sm text-red-600 underline hover:no-underline"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 评分显示 */}
      <RatingDisplay
        curatorRating={resource.rating}
        aggregatedRating={ratings?.aggregatedRating || null}
        ratingCount={ratings?.ratingCount || 0}
        userRating={ratings?.userRating || null}
        isAuthenticated={!!user}
        onRate={() => setIsRatingDialogOpen(true)}
      />

      {/* 评分对话框 */}
      <RatingDialog
        resource={resource}
        existingRating={ratings?.userRating || null}
        open={isRatingDialogOpen}
        onOpenChange={setIsRatingDialogOpen}
        onSubmit={handleSubmitRating}
      />
    </div>
  );
}
