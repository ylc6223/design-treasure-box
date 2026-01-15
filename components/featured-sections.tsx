'use client'

import * as React from 'react'
import { ResourceCard } from './resource-card'
import { ChevronLeft, ChevronRight, TrendingUp, Clock } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import type { Resource } from '@/types'

interface FeaturedSectionsProps {
  hotResources: Resource[]
  latestResources: Resource[]
  isFavorited: (id: string) => boolean
  onFavorite: (id: string) => void
  onVisit: (url: string) => void
}

/**
 * FeaturedSections 组件
 * 
 * 展示热门资源和最新收录两个横向滚动板块
 */
export function FeaturedSections({
  hotResources,
  latestResources,
  isFavorited,
  onFavorite,
  onVisit,
}: FeaturedSectionsProps) {
  return (
    <div className="space-y-8 mb-12">
      {/* 热门资源 */}
      <Section
        title="热门资源"
        icon={<TrendingUp className="h-5 w-5" />}
        resources={hotResources}
        isFavorited={isFavorited}
        onFavorite={onFavorite}
        onVisit={onVisit}
      />

      {/* 最新收录 */}
      <Section
        title="最新收录"
        icon={<Clock className="h-5 w-5" />}
        resources={latestResources}
        isFavorited={isFavorited}
        onFavorite={onFavorite}
        onVisit={onVisit}
      />
    </div>
  )
}

interface SectionProps {
  title: string
  icon: React.ReactNode
  resources: Resource[]
  isFavorited: (id: string) => boolean
  onFavorite: (id: string) => void
  onVisit: (url: string) => void
}

function Section({
  title,
  icon,
  resources,
  isFavorited,
  onFavorite,
  onVisit,
}: SectionProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(true)

  const checkScroll = React.useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    setCanScrollLeft(container.scrollLeft > 0)
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    )
  }, [])

  React.useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    checkScroll()
    container.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)

    return () => {
      container.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll])

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = container.clientWidth * 0.8
    const targetScroll =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    })
  }

  if (resources.length === 0) return null

  return (
    <div className="relative">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="text-[var(--accent)]">{icon}</div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 横向滚动容器 */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {resources.map((resource) => (
          <div
            key={resource.id}
            className={cn(
              'flex-shrink-0',
              'w-[280px]', // Mobile
              'sm:w-[320px]', // Small screens
              'md:w-[360px]' // Medium and up
            )}
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

      {/* 渐变遮罩 */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[var(--background)] to-transparent pointer-events-none" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[var(--background)] to-transparent pointer-events-none" />
      )}
    </div>
  )
}
