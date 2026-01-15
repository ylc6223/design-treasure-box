'use client'

import { Progress } from '@/components/ui/progress'
import { RatingStars } from './rating-stars'
import { cn } from '@/lib/utils'
import type { Rating } from '@/types'

export interface RatingBreakdownProps {
  rating: Rating
  className?: string
}

/**
 * RatingBreakdown 组件
 * 
 * 显示评分的详细维度分解：
 * - 综合评分（大号显示）
 * - 各维度评分条形图
 * - 星星评分显示
 * 
 * 特性：
 * - 可视化评分分解
 * - 进度条显示各维度
 * - 响应式设计
 */
export function RatingBreakdown({ rating, className }: RatingBreakdownProps) {
  const dimensions = [
    { key: 'usability', label: '实用性', value: rating.usability },
    { key: 'aesthetics', label: '美观度', value: rating.aesthetics },
    { key: 'updateFrequency', label: '更新频率', value: rating.updateFrequency },
    { key: 'freeLevel', label: '免费程度', value: rating.freeLevel },
  ] as const

  return (
    <div className={cn('space-y-6', className)}>
      {/* 综合评分 */}
      <div className="text-center">
        <div className="text-4xl font-bold text-primary mb-2">
          {rating.overall.toFixed(1)}
        </div>
        <RatingStars rating={rating.overall} size="lg" showValue={false} />
        <p className="text-sm text-muted-foreground mt-2">综合评分</p>
      </div>

      {/* 评分维度 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">评分详情</h3>
        <div className="space-y-3">
          {dimensions.map((dimension) => (
            <div key={dimension.key} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{dimension.label}</span>
                <span className="text-muted-foreground">
                  {dimension.value.toFixed(1)}/5.0
                </span>
              </div>
              <Progress 
                value={(dimension.value / 5) * 100} 
                className="h-2"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}