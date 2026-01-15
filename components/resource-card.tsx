'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Sparkles, Heart, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RatingStars } from './rating-stars'
import { cn } from '@/lib/utils'
import type { Resource } from '@/types'

export interface ResourceCardProps {
  resource: Resource
  isFavorited: boolean
  onFavorite: () => void
  onVisit: () => void
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
 * - 收藏按钮 + 访问按钮
 * - 悬停上浮动效
 * - 点击跳转到详情页
 */
export function ResourceCard({
  resource,
  isFavorited,
  onFavorite,
  onVisit,
}: ResourceCardProps) {
  const [imageError, setImageError] = React.useState(false)

  return (
    <Card
      className={cn(
        'group relative overflow-hidden',
        'transition-all duration-200 ease-out',
        'hover:-translate-y-1 hover:shadow-lg'
      )}
    >
      {/* 可点击区域 - 跳转到详情页 */}
      <Link href={`/resource/${resource.id}`} className="block">
        {/* 网站截图 */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          {!imageError ? (
            <Image
              src={resource.screenshot}
              alt={resource.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-sm text-muted-foreground">图片加载失败</span>
            </div>
          )}

          {/* 精选标识 */}
          {resource.isFeatured && (
            <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-highlight/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              <span>精选</span>
            </div>
          )}
        </div>

        {/* 卡片内容 */}
        <div className="p-4 space-y-3">
          {/* 资源名称 + 评分 */}
          <div className="space-y-1.5">
            <h3 className="font-semibold text-base leading-tight line-clamp-1">
              {resource.name}
            </h3>
            <RatingStars rating={resource.rating.overall} showValue />
          </div>

          {/* 简介描述 */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {resource.description}
          </p>

          {/* 标签 */}
          <div className="flex flex-wrap gap-1.5">
            {resource.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {resource.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{resource.tags.length - 3}
              </Badge>
            )}
          </div>
        </div>
      </Link>

      {/* 操作按钮 - 阻止事件冒泡 */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onFavorite()
          }}
          className={cn(
            'transition-colors bg-surface/80 backdrop-blur-sm',
            isFavorited && 'text-red-500 hover:text-red-600'
          )}
          aria-label={isFavorited ? '取消收藏' : '收藏'}
        >
          <Heart
            className={cn('h-5 w-5', isFavorited && 'fill-current')}
          />
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onVisit()
          }}
          className="gap-1.5 bg-surface/80 backdrop-blur-sm"
        >
          <span>访问</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  )
}
