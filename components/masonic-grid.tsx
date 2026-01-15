'use client'

import * as React from 'react'
import { Masonry, useInfiniteLoader } from 'masonic'
import { ResourceCard } from './resource-card'
import { Loader2 } from 'lucide-react'
import type { Resource } from '@/types'

export interface MasonicGridProps {
  resources: Resource[]
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  isFavorited: (id: string) => boolean
  onFavorite: (id: string) => void
  onVisit: (url: string) => void
  className?: string
}

interface MasonryCardProps {
  data: Resource
  width: number
  isFavorited: boolean
  onFavorite: () => void
  onVisit: () => void
}

/**
 * MasonryCard 组件
 * 
 * 用于 masonic 库的单个卡片渲染组件
 * 垂直间距由 usePositioner 的 rowGutter 参数控制
 */
const MasonryCard = React.memo<MasonryCardProps>(
  ({ data, width, isFavorited, onFavorite, onVisit }) => {
    return (
      <ResourceCard
        resource={data}
        isFavorited={isFavorited}
        onFavorite={onFavorite}
        onVisit={onVisit}
      />
    )
  }
)

MasonryCard.displayName = 'MasonryCard'

/**
 * MasonicGrid 组件
 * 
 * 基于 masonic 库的高性能虚拟化瀑布流布局，支持无限滚动
 * 
 * 特性：
 * - 虚拟化渲染，只渲染可见区域的卡片
 * - 自动响应式列数调整
 * - 高性能滚动
 * - 内置无限滚动支持 (useInfiniteLoader)
 */
export function MasonicGrid({
  resources,
  hasMore,
  isLoading,
  onLoadMore,
  isFavorited,
  onFavorite,
  onVisit,
  className,
}: MasonicGridProps) {
  // 使用 masonic 的 useInfiniteLoader 处理无限滚动
  const maybeLoadMore = useInfiniteLoader(onLoadMore, {
    isItemLoaded: (index) => index < resources.length,
    minimumBatchSize: 24,
    threshold: 3,
  })

  if (resources.length === 0 && !isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-[var(--text-secondary)]">
            暂无资源
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            请尝试其他筛选条件
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <Masonry
        items={resources}
        columnWidth={280}
        columnGutter={24}
        rowGutter={24}
        overscanBy={2}
        onRender={maybeLoadMore}
        render={({ data, width }) => (
          <MasonryCard
            data={data}
            width={width}
            isFavorited={isFavorited(data.id)}
            onFavorite={() => onFavorite(data.id)}
            onVisit={() => onVisit(data.url)}
          />
        )}
      />

      {/* 加载指示器 */}
      {hasMore && isLoading && (
        <div className="mt-12 flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
          <span className="ml-2 text-sm text-[var(--text-muted)]">
            加载中...
          </span>
        </div>
      )}

      {/* 已加载全部提示 */}
      {!hasMore && resources.length > 0 && (
        <div className="mt-12 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            已加载全部 {resources.length} 个资源
          </p>
        </div>
      )}
    </div>
  )
}
