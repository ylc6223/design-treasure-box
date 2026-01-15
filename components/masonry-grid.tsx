'use client'

import * as React from 'react'
import { ResourceCard } from './resource-card'
import { cn } from '@/lib/utils'
import type { Resource } from '@/types'

export interface MasonryGridProps {
  resources: Resource[]
  isFavorited: (id: string) => boolean
  onFavorite: (id: string) => void
  onVisit: (url: string) => void
  className?: string
}

/**
 * MasonryGrid 组件
 * 
 * 瀑布流布局展示资源卡片
 * 
 * 响应式列数：
 * - XL (≥1440px): 5列
 * - Desktop (≥1200px): 4列
 * - Tablet (768-1199px): 3列
 * - Mobile (<768px): 2列
 * 
 * 特性：
 * - CSS Grid 瀑布流布局
 * - Stagger fade-in 加载动画
 * - 响应式列数
 */
export function MasonryGrid({
  resources,
  isFavorited,
  onFavorite,
  onVisit,
  className,
}: MasonryGridProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (resources.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">
            暂无资源
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            请尝试其他筛选条件
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'grid gap-6',
        // 响应式列数
        'grid-cols-2', // Mobile: 2列
        'md:grid-cols-3', // Tablet: 3列
        'lg:grid-cols-4', // Desktop: 4列
        'xl:grid-cols-5', // XL: 5列
        className
      )}
    >
      {resources.map((resource, index) => (
        <div
          key={resource.id}
          className={cn(
            'opacity-0 animate-fade-in',
            mounted && 'opacity-100'
          )}
          style={{
            animationDelay: `${index * 50}ms`,
            animationFillMode: 'forwards',
          }}
        >
          <ResourceCard
            resource={resource}
            isFavorited={isFavorited(resource.id)}
            onFavorite={() => onFavorite(resource.id)}
            onVisit={() => onVisit(resource.url)}
          />
        </div>
      ))}
    </div>
  )
}
