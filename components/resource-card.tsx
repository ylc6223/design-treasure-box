'use client'

import Link from 'next/link'
import { Sparkles, Heart } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RatingStars } from './rating-stars'
import { ResourceThumbnail } from './resource-thumbnail'
import { cn } from '@/lib/utils'
import type { Resource } from '@/types'

export interface ResourceCardProps {
  resource: Resource
  isFavorited: boolean
  onFavorite: () => void
}

/**
 * ResourceCard 组件
 * 
 * 展示单个资源的卡片，包含：
 * - 网站截图（自适应高度）
 * - 精选标识（Sparkles 图标）
 * - 资源名称 + 评分星星
 * - 简介描述（2行截断）
 * - 标签 Badge
 * - 收藏按钮
 * - 悬停上浮动效
 * - 点击跳转到详情页
 */
export function ResourceCard({
  resource,
  isFavorited,
  onFavorite,
}: ResourceCardProps) {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden',
        'transition-all duration-200 ease-out',
        'hover:-translate-y-1 hover:shadow-lg'
      )}
    >
      {/* 收藏按钮 - 放在右上角，阻止事件冒泡 */}
      <div className="absolute top-3 right-3 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onFavorite()
          }}
          className={cn(
            'h-8 w-8 rounded-full bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-black/40 hover:text-white',
            isFavorited && 'bg-white/90 text-red-500 hover:bg-white hover:text-red-600 shadow-sm'
          )}
          aria-label={isFavorited ? '取消收藏' : '收藏'}
        >
          <Heart
            className={cn('h-4 w-4', isFavorited && 'fill-current')}
          />
        </Button>
      </div>

      {/* 可点击区域 - 跳转到详情页 */}
      <Link href={`/resource/${resource.id}`} className="block h-full">
        {/* 网站截图 */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          <ResourceThumbnail
            screenshotUrl={resource.screenshotUrl ?? undefined}
            name={resource.name}
          />

          {/* 精选标识 */}
          {resource.isFeatured && (
            <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-highlight/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              <span>精选</span>
            </div>
          )}
        </div>

        {/* 卡片内容 */}
        <div className="flex flex-col gap-3 p-4">
          {/* 资源名称 + 评分 */}
          <div className="space-y-1.5">
            <h3 className="font-semibold text-base leading-tight line-clamp-1">
              {resource.name}
            </h3>
            <RatingStars rating={resource.rating.overall} showValue />
          </div>

          {/* 简介描述 */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.5em]">
            {resource.description}
          </p>

          {/* 标签 */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {resource.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
            {resource.tags.length > 3 && (
              <Badge variant="outline" className="text-xs font-normal">
                +{resource.tags.length - 3}
              </Badge>
            )}
          </div>
        </div>
      </Link>
    </Card>
  )
}
