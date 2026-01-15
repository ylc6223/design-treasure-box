import { Star, StarHalf } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface RatingStarsProps {
  /**
   * 评分值 (0-5)
   */
  rating: number
  /**
   * 是否显示数值评分
   */
  showValue?: boolean
  /**
   * 星星大小
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * 自定义类名
   */
  className?: string
}

/**
 * RatingStars 组件
 * 
 * 显示评分星星，支持半星精度
 * 
 * 特性：
 * - 5星评分显示
 * - 支持半星精度（0.5 步进）
 * - 可选显示数值评分
 * - 三种尺寸：sm, md, lg
 * - 使用 Lucide React 图标
 * 
 * @example
 * ```tsx
 * <RatingStars rating={4.5} showValue />
 * <RatingStars rating={3.0} size="lg" />
 * ```
 */
export function RatingStars({
  rating,
  showValue = false,
  size = 'md',
  className,
}: RatingStarsProps) {
  // 确保评分在 0-5 范围内
  const clampedRating = Math.max(0, Math.min(5, rating))
  
  const fullStars = Math.floor(clampedRating)
  const hasHalfStar = clampedRating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  // 星星尺寸映射
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const starSize = sizeClasses[size]

  // 文字尺寸映射
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const textSize = textSizeClasses[size]

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5">
        {/* 满星 */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(starSize, 'fill-highlight text-highlight')}
          />
        ))}

        {/* 半星 */}
        {hasHalfStar && (
          <StarHalf className={cn(starSize, 'fill-highlight text-highlight')} />
        )}

        {/* 空星 */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(starSize, 'text-muted-foreground/30')}
          />
        ))}
      </div>

      {/* 数值评分 */}
      {showValue && (
        <span className={cn(textSize, 'font-medium text-muted-foreground')}>
          {clampedRating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
