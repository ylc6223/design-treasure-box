'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ExternalLink, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
 */
export function ResourceInlineCard({
  resource,
  isFavorited: _isFavorited = false,
  onViewDetails: _onViewDetails,
  onFavorite: _onFavorite,
  onVisit,
  className,
}: ResourceInlineCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleCardClick = () => {
    // 直接打开新窗口访问资源
    window.open(resource.url, '_blank', 'noopener,noreferrer');
    onVisit?.(resource.id);
  };

  return (
    <Card
      className={cn(
        'group flex items-center gap-3 p-3',
        'hover:bg-accent/50 transition-colors cursor-pointer',
        'rounded-lg border',
        className
      )}
      onClick={handleCardClick}
    >
      {/* 缩略图 */}
      <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0 bg-muted">
        {!imageError && resource.screenshotUrl ? (
          <Image
            src={resource.screenshotUrl}
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
          <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
            {resource.name}
          </h4>
          {resource.isFeatured && (
            <Badge variant="secondary" className="text-xs shrink-0">
              <Sparkles className="w-3 h-3 mr-1" />
              精选
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <RatingStars rating={resource.rating.overall} size="sm" />
          <span className="text-xs text-muted-foreground truncate">{resource.categoryId}</span>
        </div>
      </div>

      {/* 操作区 */}
      <div className="flex items-center gap-1 shrink-0">
        <ExternalLink className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary/50 transition-colors" />
      </div>
    </Card>
  );
}
