'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { Resource } from '@/types';
import type { ResourceRecommendation } from '@/types/ai-chat';
import { ResourceInlineCard } from './resource-inline-card';

export interface ResourceMessageProps {
  resources: ResourceRecommendation[];
  onResourceClick: (resource: Resource) => void;
  onFavorite: (resourceId: string) => void;
  onVisit: (resourceId: string) => void;
  className?: string;
}

/**
 * ResourceMessage 组件
 * 
 * 在聊天界面中显示AI推荐的资源列表
 * 使用 ResourceInlineCard 组件渲染每个资源（简化版）
 */
export function ResourceMessage({
  resources,
  onResourceClick,
  onFavorite,
  onVisit,
  className,
}: ResourceMessageProps) {
  if (resources.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {resources.map((recommendation) => (
        <ResourceInlineCard
          key={recommendation.resource.id}
          resource={recommendation.resource}
          onViewDetails={onResourceClick}
          onFavorite={onFavorite}
          onVisit={onVisit}
        />
      ))}
    </div>
  );
}
