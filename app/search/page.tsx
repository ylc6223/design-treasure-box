'use client'

import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { MasonryGrid } from '@/components/masonry-grid'
import { Badge } from '@/components/ui/badge'
import { useFavorites } from '@/hooks/use-favorites'
import { useResources } from '@/hooks/use-resources'
import { useSearch } from '@/hooks/use-search'
import { Search, X, TrendingUp } from 'lucide-react'
import categories from '@/data/categories.json'
import type { SearchFilters } from '@/types'

/**
 * 搜索结果页面内容组件
 * 
 * 使用 Suspense 包裹以处理 useSearchParams
 */
function SearchResultsContent() {
  const searchParams = useSearchParams()
  const { data: allResources, isLoading } = useResources()
  const { isFavorited, addFavorite, removeFavorite } = useFavorites()

  // 从 URL 参数构建搜索筛选条件
  const filters = useMemo<SearchFilters>(() => {
    const query = searchParams.get('q') || ''
    const tagsParam = searchParams.get('tags')
    const categoryId = searchParams.get('category') || undefined
    
    return {
      query,
      tags: tagsParam ? tagsParam.split(',').filter(Boolean) : undefined,
      categoryId,
    }
  }, [searchParams])

  // 执行搜索
  const { results, total, hasResults } = useSearch(allResources, filters)

  // 热门资源（按收藏数排序，取前12个）
  const popularResources = useMemo(() => {
    if (!allResources) return []
    return allResources
      .slice()
      .sort((a, b) => b.favoriteCount - a.favoriteCount)
      .slice(0, 12)
  }, [allResources])

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
      {/* 主内容区 */}
      <div className="container px-4 py-8">
        {/* 搜索信息区域 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-3xl font-bold">搜索结果</h1>
          </div>

          {/* 搜索条件展示 */}
          <div className="flex flex-wrap items-center gap-2">
            {filters.query && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border rounded-lg">
                <span className="text-sm text-muted-foreground">关键词:</span>
                <span className="text-sm font-medium">{filters.query}</span>
              </div>
            )}

            {filters.tags && filters.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">标签:</span>
                {filters.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {filters.categoryId && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border rounded-lg">
                <span className="text-sm text-muted-foreground">分类:</span>
                <span className="text-sm font-medium">
                  {categories.find(c => c.id === filters.categoryId)?.name}
                </span>
              </div>
            )}
          </div>

          {/* 结果统计 */}
          <p className="mt-4 text-muted-foreground">
            {isLoading ? (
              '搜索中...'
            ) : hasResults ? (
              <>找到 <span className="font-semibold text-text-primary">{total}</span> 个相关资源</>
            ) : (
              '未找到相关资源'
            )}
          </p>
        </div>

        {/* 搜索结果 */}
        {!isLoading && hasResults && (
          <section>
            <MasonryGrid
              resources={results}
              isFavorited={isFavorited}
              onFavorite={handleFavorite}
              onVisit={handleVisit}
            />
          </section>
        )}

        {/* 无结果时显示热门推荐 */}
        {!isLoading && !hasResults && (
          <section>
            <div className="mb-8 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <X className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">未找到相关资源</h2>
              <p className="text-muted-foreground mb-6">
                试试调整搜索关键词，或浏览下面的热门推荐
              </p>
            </div>

            {/* 热门推荐 */}
            <div className="mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-highlight" />
              <h3 className="text-2xl font-bold">热门推荐</h3>
            </div>
            <MasonryGrid
              resources={popularResources}
              isFavorited={isFavorited}
              onFavorite={handleFavorite}
              onVisit={handleVisit}
            />
          </section>
        )}

        {/* 加载状态 */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-4 text-muted-foreground">加载中...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 搜索结果页面
 * 
 * 功能：
 * - 搜索关键词高亮
 * - MasonryGrid 展示搜索结果
 * - 无结果时显示热门推荐
 * - 支持路由参数: /search?q=xxx&tags=xxx&category=xxx
 * 
 * Requirements: 3.1, 3.4
 */
export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  )
}
