'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/header'
import { MasonryGrid } from '@/components/masonry-grid'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFavorites } from '@/hooks/use-favorites'
import { useResources } from '@/hooks/use-resources'
import { Heart, ArrowUpDown } from 'lucide-react'
import categories from '@/data/categories.json'

type SortOption = 'time-desc' | 'time-asc' | 'category'

export default function FavoritesPage() {
  const { favorites, isFavorited, addFavorite, removeFavorite } = useFavorites()
  const { data: allResources } = useResources()
  const [sortBy, setSortBy] = useState<SortOption>('time-desc')

  // 获取收藏的资源
  const favoriteResources = useMemo(() => {
    if (!allResources) return []
    
    const resources = allResources.filter((resource) =>
      favorites.some((fav) => fav.resourceId === resource.id)
    )

    // 排序
    switch (sortBy) {
      case 'time-desc':
        return resources.sort((a, b) => {
          const aFav = favorites.find((f) => f.resourceId === a.id)
          const bFav = favorites.find((f) => f.resourceId === b.id)
          if (!aFav || !bFav) return 0
          return new Date(bFav.addedAt).getTime() - new Date(aFav.addedAt).getTime()
        })
      case 'time-asc':
        return resources.sort((a, b) => {
          const aFav = favorites.find((f) => f.resourceId === a.id)
          const bFav = favorites.find((f) => f.resourceId === b.id)
          if (!aFav || !bFav) return 0
          return new Date(aFav.addedAt).getTime() - new Date(bFav.addedAt).getTime()
        })
      case 'category':
        return resources.sort((a, b) => a.categoryId.localeCompare(b.categoryId))
      default:
        return resources
    }
  }, [allResources, favorites, sortBy])

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
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
              <Heart className="h-6 w-6 text-red-500 fill-current" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">我的收藏</h1>
              <p className="text-muted-foreground">
                {favoriteResources.length > 0
                  ? `共收藏 ${favoriteResources.length} 个资源`
                  : '还没有收藏任何资源'}
              </p>
            </div>
          </div>

          {/* 排序选项 */}
          {favoriteResources.length > 0 && (
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">排序：</span>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time-desc">最近收藏</SelectItem>
                  <SelectItem value="time-asc">最早收藏</SelectItem>
                  <SelectItem value="category">按分类</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* 资源列表 */}
        {favoriteResources.length > 0 ? (
          <MasonryGrid
            resources={favoriteResources}
            isFavorited={isFavorited}
            onFavorite={handleFavorite}
            onVisit={handleVisit}
          />
        ) : (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">还没有收藏</h2>
            <p className="mb-6 text-muted-foreground">
              浏览资源时点击收藏按钮，将喜欢的资源添加到这里
            </p>
            <Button asChild>
              <a href="/">浏览资源</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
