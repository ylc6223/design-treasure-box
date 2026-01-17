'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronRight, Heart, ExternalLink, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RatingStars } from '@/components/rating-stars';
import { cn } from '@/lib/utils';
import type { Resource } from '@/types';

export interface ResourceInlineCardProps {
  resource: Resource;
  isFavorited?: boolean;
  onViewDetails?: (resource: Resource) => void;
  onFavorite?: (resourceId: string) => void;
  onVisit?: (resourceId: string) => void;
  className?: string;
}

/**
 * ResourceInlineCard 组件（简化版）
 * 
 * 用于聊天界面的简化资源卡片
 * - 默认状态：缩略图(48x48) + 名称 + 评分 + 类别
 * - 悬停：显示阴影效果
 * - 点击：展开详细信息（Sheet）
 * - 移动端：Sheet 从底部滑出（80vh）
 * - 桌面端：Sheet 从底部滑出（可考虑后续改为 Popover）
 * 
 * @param resource - 资源数据
 * @param isFavorited - 是否已收藏
 * @param onViewDetails - 查看详情回调
 * @param onFavorite - 收藏回调
 * @param onVisit - 访问回调
 * @param className - 额外的 CSS 类名
 */
export function ResourceInlineCard({
  resource,
  isFavorited = false,
  onViewDetails,
  onFavorite,
  onVisit,
  className,
}: ResourceInlineCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleCardClick = () => {
    setIsDetailOpen(true);
    onViewDetails?.(resource);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite?.(resource.id);
  };

  const handleVisit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVisit?.(resource.id);
    // 打开新窗口访问资源
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* 简化版卡片 */}
      <Card
        className={cn(
          'flex items-center gap-3 p-3',
          'hover:bg-accent/50 transition-colors cursor-pointer',
          'rounded-lg border',
          className
        )}
        onClick={handleCardClick}
      >
        {/* 缩略图 */}
        <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0 bg-muted">
          {!imageError ? (
            <Image
              src={resource.screenshot}
              alt={resource.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-xs text-muted-foreground">N/A</span>
            </div>
          )}
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm truncate">{resource.name}</h4>
            {resource.isFeatured && (
              <Badge variant="secondary" className="text-xs shrink-0">
                <Sparkles className="w-3 h-3 mr-1" />
                精选
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <RatingStars rating={resource.rating.overall} size="sm" />
            <span className="text-xs text-muted-foreground truncate">
              {resource.categoryId}
            </span>
          </div>
        </div>

        {/* 箭头 */}
        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
      </Card>

      {/* 详情展开（Sheet） */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-left">{resource.name}</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* 大图预览 */}
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
              {!imageError ? (
                <Image
                  src={resource.screenshot}
                  alt={resource.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <span className="text-sm text-muted-foreground">图片加载失败</span>
                </div>
              )}
            </div>

            {/* 基本信息 */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <RatingStars rating={resource.rating.overall} size="lg" showValue />
                <Badge>{resource.categoryId}</Badge>
                {resource.isFeatured && (
                  <Badge variant="secondary">
                    <Sparkles className="w-3 h-3 mr-1" />
                    精选
                  </Badge>
                )}
              </div>

              {/* 描述 */}
              <div>
                <h3 className="text-sm font-semibold mb-2">简介</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {resource.description}
                </p>
              </div>

              {/* 策展人笔记 */}
              {resource.curatorNote && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">策展人笔记</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {resource.curatorNote}
                  </p>
                </div>
              )}

              {/* 详细评分 */}
              <div>
                <h3 className="text-sm font-semibold mb-3">详细评分</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">易用性</span>
                    <RatingStars rating={resource.rating.usability} size="sm" showValue />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">美观度</span>
                    <RatingStars rating={resource.rating.aesthetics} size="sm" showValue />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">更新频率</span>
                    <RatingStars rating={resource.rating.updateFrequency} size="sm" showValue />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">免费程度</span>
                    <RatingStars rating={resource.rating.freeLevel} size="sm" showValue />
                  </div>
                </div>
              </div>

              {/* 标签 */}
              {resource.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {resource.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 统计信息 */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>浏览 {resource.viewCount}</span>
                <span>收藏 {resource.favoriteCount}</span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant={isFavorited ? 'default' : 'outline'}
                className="flex-1"
                onClick={handleFavorite}
              >
                <Heart className={cn('w-4 h-4 mr-2', isFavorited && 'fill-current')} />
                {isFavorited ? '已收藏' : '收藏'}
              </Button>
              <Button className="flex-1" onClick={handleVisit}>
                <ExternalLink className="w-4 h-4 mr-2" />
                访问
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
