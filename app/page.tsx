'use client'

import { Header } from '@/components/header'
import { MasonryGrid } from '@/components/masonry-grid'
import { ResourceCard } from '@/components/resource-card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useFavorites } from '@/hooks/use-favorites'
import { useFeaturedResources, useResources } from '@/hooks/use-resources'
import { Sparkles, TrendingUp, Clock, ArrowRight } from 'lucide-react'
import categories from '@/data/categories.json'

export default function HomePage() {
  const { data: featuredResources, isLoading: isFeaturedLoading } = useFeaturedResources()
  const { data: allResources, isLoading: isAllLoading } = useResources()
  const { isFavorited, addFavorite, removeFavorite } = useFavorites()

  // 热门资源 (按收藏数排序，取前8个)
  const popularResources = allResources
    ?.slice()
    .sort((a, b) => b.favoriteCount - a.favoriteCount)
    .slice(0, 8)

  // 最新收录 (按创建时间排序，取前8个)
  const latestResources = allResources
    ?.slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)

  const handleFavorite = (resourceId: string) => {
    if (isFavorited(resourceId)) {
      removeFavorite(resourceId)
    } else {
      addFavorite(resourceId)
    }
  }

  const handleVisit = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <Header categories={categories} />

      {/* 主内容区 */}
      <div className="container px-4 py-8">
        {/* 欢迎区域 */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            设计百宝箱
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            精选设计资源聚合入口，为设计师和开发者提供高质量的设计美学参考
          </p>
        </div>

        {/* 编辑精选 - 横向滚动 */}
        {!isFeaturedLoading && featuredResources && featuredResources.length > 0 && (
          <section className="mb-16">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-highlight" />
                <h2 className="text-2xl font-bold">编辑精选</h2>
              </div>
              <Button variant="ghost" size="sm" className="gap-1">
                查看全部
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-4 pb-4">
                {featuredResources.map((resource) => (
                  <div key={resource.id} className="w-[320px] flex-shrink-0">
                    <ResourceCard
                      resource={resource}
                      isFavorited={isFavorited(resource.id)}
                      onFavorite={() => handleFavorite(resource.id)}
                      onVisit={() => handleVisit(resource.url)}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </section>
        )}

        {/* 热门资源 */}
        {!isAllLoading && popularResources && popularResources.length > 0 && (
          <section className="mb-16">
            <div className="mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-highlight" />
              <h2 className="text-2xl font-bold">热门资源</h2>
            </div>
            <MasonryGrid
              resources={popularResources}
              isFavorited={isFavorited}
              onFavorite={handleFavorite}
              onVisit={handleVisit}
            />
          </section>
        )}

        {/* 最新收录 */}
        {!isAllLoading && latestResources && latestResources.length > 0 && (
          <section className="mb-16">
            <div className="mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-highlight" />
              <h2 className="text-2xl font-bold">最新收录</h2>
            </div>
            <MasonryGrid
              resources={latestResources}
              isFavorited={isFavorited}
              onFavorite={handleFavorite}
              onVisit={handleVisit}
            />
          </section>
        )}

        {/* 全部资源 */}
        {!isAllLoading && allResources && (
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">全部资源</h2>
            </div>
            <MasonryGrid
              resources={allResources}
              isFavorited={isFavorited}
              onFavorite={handleFavorite}
              onVisit={handleVisit}
            />
          </section>
        )}
      </div>
    </div>
  )
}
