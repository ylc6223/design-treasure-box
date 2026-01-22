'use client';

import * as React from 'react';
import { TrendingUp, Clock } from 'lucide-react';
import ExpandableCards from '@/components/smoothui/expandable-cards';
import type { Resource } from '@/types';

interface FeaturedSectionsProps {
  hotResources: Resource[];
  latestResources: Resource[];
  isFavorited: (id: string) => boolean;
  onFavorite: (id: string) => void;
  onVisit: (url: string) => void;
}

/**
 * FeaturedSections 组件
 *
 * 使用手风琴风格展示热门资源和最新收录
 * 固定显示 4 个资源，未来将对接真实 API
 */
export function FeaturedSections({
  hotResources,
  latestResources,
  isFavorited,
  onFavorite,
  onVisit,
}: FeaturedSectionsProps) {
  // 固定取前 4 个
  const topHotResources = React.useMemo(() => hotResources.slice(0, 4), [hotResources]);

  const topLatestResources = React.useMemo(() => latestResources.slice(0, 4), [latestResources]);

  return (
    <div className="space-y-12 mb-12">
      {/* 热门资源 */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="text-2xl font-semibold">热门资源</h2>
        </div>
        <ExpandableCards
          resources={topHotResources}
          isFavorited={isFavorited}
          onFavorite={onFavorite}
          onVisit={onVisit}
          className="!p-0"
          cardClassName="border-[var(--border)]"
        />
      </div>

      {/* 最新收录 */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="text-2xl font-semibold">最新收录</h2>
        </div>
        <ExpandableCards
          resources={topLatestResources}
          isFavorited={isFavorited}
          onFavorite={onFavorite}
          onVisit={onVisit}
          className="!p-0"
          cardClassName="border-[var(--border)]"
        />
      </div>
    </div>
  );
}
