'use client'

import { Users, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RatingStars } from '@/components/rating-stars'
import { cn } from '@/lib/utils'
import type { Rating, UserRating } from '@/types/rating'

export interface RatingDisplayProps {
  /**
   * 策展人评分（默认评分）
   */
  curatorRating: Rating
  /**
   * 聚合评分（用户评分平均值）
   */
  aggregatedRating: Rating | null
  /**
   * 评分人数
   */
  ratingCount: number
  /**
   * 当前用户的评分
   */
  userRating?: UserRating | null
  /**
   * 是否已登录
   */
  isAuthenticated?: boolean
  /**
   * 评分按钮点击回调
   */
  onRate?: () => void
  /**
   * 自定义类名
   */
  className?: string
}

/**
 * RatingDisplay 组件
 * 
 * 显示资源评分信息，包括策展人评分、用户聚合评分和个人评分
 * 
 * 特性：
 * - 显示策展人评分（默认）
 * - 显示用户聚合评分和评分人数（如果有）
 * - 显示当前用户评分（如果已评分）
 * - 评分/编辑评分按钮（已登录用户）
 * 
 * @example
 * ```tsx
 * <RatingDisplay
 *   curatorRating={resource.rating}
 *   aggregatedRating={aggregatedRating}
 *   ratingCount={ratingCount}
 *   userRating={userRating}
 *   isAuthenticated={!!user}
 *   onRate={() => setRatingDialogOpen(true)}
 * />
 * ```
 */
export function RatingDisplay({
  curatorRating,
  aggregatedRating,
  ratingCount,
  userRating,
  isAuthenticated = false,
  onRate,
  className,
}: RatingDisplayProps) {
  // 显示的主要评分（优先显示用户聚合评分，否则显示策展人评分）
  const displayRating = aggregatedRating || curatorRating
  const isUserRating = aggregatedRating !== null

  return (
    <div className={cn('space-y-3', className)}>
      {/* 主要评分显示 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <RatingStars rating={displayRating.overall} size="md" showValue />
            {isUserRating && (
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <Users className="h-3 w-3" />
                {ratingCount} 人评分
              </span>
            )}
            {!isUserRating && (
              <span className="text-xs text-text-muted">策展人评分</span>
            )}
          </div>
        </div>

        {/* 评分按钮 */}
        {isAuthenticated && onRate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRate}
            className="gap-2"
          >
            <Edit className="h-3.5 w-3.5" />
            {userRating ? '编辑评分' : '评分'}
          </Button>
        )}
      </div>

      {/* 当前用户评分（如果已评分） */}
      {userRating && (
        <div className="rounded-lg border border-border bg-surface/50 p-3 space-y-2">
          <p className="text-xs font-medium text-text-secondary">你的评分</p>
          <div className="flex items-center gap-2">
            <RatingStars rating={userRating.overall} size="sm" showValue />
          </div>
          {userRating.comment && (
            <p className="text-sm text-text-secondary line-clamp-2">
              {userRating.comment}
            </p>
          )}
        </div>
      )}

      {/* 未登录提示 */}
      {!isAuthenticated && (
        <p className="text-xs text-text-muted">
          登录后可以评分
        </p>
      )}
    </div>
  )
}
