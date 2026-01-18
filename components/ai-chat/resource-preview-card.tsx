'use client';

import * as React from 'react';
import { Heart, ExternalLink, Sparkles, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RatingStars } from '@/components/rating-stars';
import { ResourceThumbnail } from '@/components/resource-thumbnail';
import { cn } from '@/lib/utils';
import type { Resource } from '@/types';

export interface ResourcePreviewCardProps {
  resource: Resource;
  matchReason?: string;
  matchedAspects?: string[];
  relevanceScore?: number;
  isFavorited?: boolean;
  onFavorite?: (resourceId: string) => void;
  onVisit?: (resourceId: string) => void;
  onViewDetails?: (resource: Resource) => void;
  variant?: 'compact' | 'default';
  className?: string;
}

/**
 * ResourcePreviewCard 组件
 * 
 * 通用的资源预览卡片组件，用于在聊天界面和其他场景中显示资源
 * 
 * Features:
 * - 缩略图显示（支持加载失败处理）
 * - 精选标识
 * - 资源名称和评分
 * - 匹配理由（可选）
 * - 匹配方面标签（可选）
 * - 操作按钮（收藏、访问、查看详情）
 * - 相关度指示器（可选）
 * - 两种变体：compact（紧凑）和 default（默认）
 */
export function ResourcePreviewCard({
  resource,
  matchReason,
  matchedAspects,
  relevanceScore,
  isFavorited = false,
  onFavorite,
  onVisit,
  onViewDetails,
  variant = 'compact',
  className,
}: ResourcePreviewCardProps) {
  const isCompact = variant === 'compact';

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-200',
        'hover:shadow-md',
        className
      )}
    >
      <div className={cn('flex gap-3', isCompact ? 'p-3' : 'p-4')}>
        {/* 缩略图 */}
        <div
          className={cn(
            'relative shrink-0 overflow-hidden rounded-md bg-muted',
            isCompact ? 'h-20 w-28' : 'h-24 w-32'
          )}
        >
          <ResourceThumbnail
            screenshotUrl={resource.screenshotUrl}
            screenshotStatus={resource.screenshotStatus}
            name={resource.name}
          />

          {/* 精选标识 */}
          {resource.isFeatured && (
            <div
              className={cn(
                'absolute flex items-center gap-0.5 rounded-full bg-highlight/90 font-medium text-white backdrop-blur-sm',
                isCompact
                  ? 'left-1.5 top-1.5 px-1.5 py-0.5 text-[10px]'
                  : 'left-2 top-2 px-2 py-1 text-xs'
              )}
            >
              <Sparkles className={cn(isCompact ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
              <span>精选</span>
            </div>
          )}
        </div>

        {/* 内容区域 */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* 标题和评分 */}
          <div className="space-y-1">
            <h4
              className={cn(
                'line-clamp-1 font-semibold leading-tight',
                isCompact ? 'text-sm' : 'text-base'
              )}
            >
              {resource.name}
            </h4>
            <RatingStars
              rating={resource.rating.overall}
              size={isCompact ? 'sm' : 'default'}
              showValue
            />
          </div>

          {/* 匹配理由 */}
          {matchReason && (
            <p
              className={cn(
                'line-clamp-2 text-muted-foreground leading-relaxed',
                isCompact ? 'text-xs' : 'text-sm'
              )}
            >
              {matchReason}
            </p>
          )}

          {/* 匹配方面标签 */}
          {matchedAspects && matchedAspects.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {matchedAspects.slice(0, 3).map((aspect) => (
                <Badge
                  key={aspect}
                  variant="secondary"
                  className={cn(isCompact ? 'text-[10px] px-1.5 py-0' : 'text-xs')}
                >
                  {aspect}
                </Badge>
              ))}
              {matchedAspects.length > 3 && (
                <Badge
                  variant="outline"
                  className={cn(isCompact ? 'text-[10px] px-1.5 py-0' : 'text-xs')}
                >
                  +{matchedAspects.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="mt-auto flex items-center gap-1.5">
            {onFavorite && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFavorite(resource.id)}
                className={cn(
                  'px-2',
                  isCompact ? 'h-7' : 'h-8',
                  isFavorited && 'text-red-500 hover:text-red-600'
                )}
                aria-label={isFavorited ? '取消收藏' : '收藏'}
              >
                <Heart
                  className={cn(
                    isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4',
                    isFavorited && 'fill-current'
                  )}
                />
              </Button>
            )}

            {onVisit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onVisit(resource.id)}
                className={cn('gap-1 px-2', isCompact ? 'h-7' : 'h-8')}
              >
                <span className={cn(isCompact ? 'text-xs' : 'text-sm')}>访问</span>
                <ExternalLink className={cn(isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
              </Button>
            )}

            {onViewDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(resource)}
                className={cn('ml-auto gap-1 px-2', isCompact ? 'h-7' : 'h-8')}
              >
                <span className={cn(isCompact ? 'text-xs' : 'text-sm')}>详情</span>
                <ChevronRight className={cn(isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 相关度指示器 */}
      {relevanceScore !== undefined && relevanceScore > 0.8 && (
        <div className="border-t bg-muted/30 px-3 py-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span>高度匹配</span>
          </div>
        </div>
      )}
    </Card>
  );
}
