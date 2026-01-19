'use client'

/**
 * MasonryGrid 使用示例
 * 
 * 展示如何使用 MasonryGrid 组件
 */

import { MasonryGrid } from './masonry-grid'
import { useFavorites, useResources } from '@/hooks'

/**
 * 基础示例：显示所有资源
 */
export function BasicMasonryGridExample() {
  const { data: resources = [] } = useResources()
  const { isFavorited, addFavorite, removeFavorite } = useFavorites()

  const handleFavorite = (id: string) => {
    if (isFavorited(id)) {
      removeFavorite(id)
    } else {
      addFavorite(id)
    }
  }

  return (
    <MasonryGrid
      resources={resources}
      isFavorited={isFavorited}
      onFavorite={handleFavorite}
    />
  )
}

/**
 * 精选资源示例
 */
export function FeaturedMasonryGridExample() {
  const { data: resources = [] } = useResources()
  const { isFavorited, addFavorite, removeFavorite } = useFavorites()

  // 只显示精选资源
  const featuredResources = resources.filter((r) => r.isFeatured)

  const handleFavorite = (id: string) => {
    if (isFavorited(id)) {
      removeFavorite(id)
    } else {
      addFavorite(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">编辑精选</h2>
        <span className="text-sm text-muted-foreground">
          {featuredResources.length} 个资源
        </span>
      </div>

      <MasonryGrid
        resources={featuredResources}
        isFavorited={isFavorited}
        onFavorite={handleFavorite}
      />
    </div>
  )
}

/**
 * 分类资源示例
 */
export function CategoryMasonryGridExample({ categoryId }: { categoryId: string }) {
  const { data: resources = [] } = useResources()
  const { isFavorited, addFavorite, removeFavorite } = useFavorites()

  // 按分类筛选
  const categoryResources = resources.filter((r) => r.categoryId === categoryId)

  const handleFavorite = (id: string) => {
    if (isFavorited(id)) {
      removeFavorite(id)
    } else {
      addFavorite(id)
    }
  }

  return (
    <MasonryGrid
      resources={categoryResources}
      isFavorited={isFavorited}
      onFavorite={handleFavorite}
      className="mt-8"
    />
  )
}

/**
 * 收藏资源示例
 */
export function FavoritesMasonryGridExample() {
  const { data: resources = [] } = useResources()
  const { isFavorited, addFavorite, removeFavorite } = useFavorites()

  // 只显示收藏的资源
  const favoriteResources = resources.filter((r) => isFavorited(r.id))

  const handleFavorite = (id: string) => {
    if (isFavorited(id)) {
      removeFavorite(id)
    } else {
      addFavorite(id)
    }
  }

  if (favoriteResources.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">还没有收藏任何资源</p>
          <p className="mt-2 text-sm text-muted-foreground">
            浏览资源并点击爱心图标来收藏
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">我的收藏</h2>
        <span className="text-sm text-muted-foreground">
          {favoriteResources.length} 个资源
        </span>
      </div>

      <MasonryGrid
        resources={favoriteResources}
        isFavorited={isFavorited}
        onFavorite={handleFavorite}
      />
    </div>
  )
}
