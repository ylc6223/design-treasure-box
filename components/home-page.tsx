'use client'

import { useState, useMemo } from 'react'
import { MasonicGrid } from '@/components/masonic-grid'
import { CategoryFilter } from '@/components/category-filter'
import { FeaturedSections } from '@/components/featured-sections'
import { AIPromptInput } from '@/components/ai-prompt-input'
import { AIChatInterface } from '@/components/ai-chat-interface'
import { useFavorites, useResources, useInfiniteResources } from '@/hooks'
import { Loader2 } from 'lucide-react'
import categories from '@/data/categories.json'

export function HomePage() {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [initialQuery, setInitialQuery] = useState<string | undefined>(undefined)
  const { data: allResources, isLoading } = useResources()
  const { isFavorited, addFavorite, removeFavorite } = useFavorites()

  // 热门资源：按收藏数和浏览量排序，取前8个
  const hotResources = useMemo(() => {
    if (!allResources) return []
    return [...allResources]
      .sort((a, b) => {
        const scoreA = a.favoriteCount * 2 + a.viewCount
        const scoreB = b.favoriteCount * 2 + b.viewCount
        return scoreB - scoreA
      })
      .slice(0, 8)
  }, [allResources])

  // 最新收录：按创建时间排序，取前8个
  const latestResources = useMemo(() => {
    if (!allResources) return []
    return [...allResources]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8)
  }, [allResources])

  // 使用无限滚动 hook (基于 TanStack Query useInfiniteQuery)
  const { resources, hasMore, loadMore, isFetchingNextPage } = useInfiniteResources({
    categoryId: activeCategory,
  })

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

  const handleCategoryChange = (categoryId: string | undefined) => {
    setActiveCategory(categoryId)
  }

  const handleAIPromptSubmit = (prompt: string) => {
    setInitialQuery(prompt)
    setIsChatOpen(true)
  }

  const handleChatClose = () => {
    setIsChatOpen(false)
    setInitialQuery(undefined)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen">
        {/* 主内容区 */}
        <div className="container px-4 py-8">
        {/* 欢迎区域 */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            设计百宝箱
          </h1>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            精选设计资源聚合入口，为设计师和开发者提供高质量的设计美学参考
          </p>
        </div>

        {/* 热门资源和最新收录 - 仅在未选择分类时显示 */}
        {!activeCategory && (
          <FeaturedSections
            hotResources={hotResources}
            latestResources={latestResources}
            isFavorited={isFavorited}
            onFavorite={handleFavorite}
            onVisit={handleVisit}
          />
        )}

        {/* 分类筛选 */}
        <div className="mb-8">
          <CategoryFilter
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>

        {/* 瀑布流网格 */}
        <MasonicGrid
          resources={resources}
          hasMore={hasMore}
          isLoading={isFetchingNextPage}
          onLoadMore={loadMore}
          isFavorited={isFavorited}
          onFavorite={handleFavorite}
          onVisit={handleVisit}
        />
      </div>
    </div>

    {/* AI Prompt Input - 底部浮动输入框 */}
    <AIPromptInput
      onSubmit={handleAIPromptSubmit}
      placeholder="输入你想要的设计资源，AI 帮你找..."
    />

    {/* AI Chat Interface - 右侧滑出聊天界面 */}
    <AIChatInterface
      isOpen={isChatOpen}
      onClose={handleChatClose}
      initialQuery={initialQuery}
    />
  </>
  )
}
