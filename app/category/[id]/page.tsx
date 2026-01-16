'use client'

import { MasonryGrid } from '@/components/masonry-grid'
import { Button } from '@/components/ui/button'
import { useFavorites } from '@/hooks/use-favorites'
import { useResourcesByCategory } from '@/hooks/use-resources'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import categories from '@/data/categories.json'
import * as LucideIcons from 'lucide-react'

interface CategoryPageProps {
  params: {
    id: string
  }
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const router = useRouter()
  const { data: resources, isLoading } = useResourcesByCategory(params.id)
  const { isFavorited, addFavorite, removeFavorite } = useFavorites()

  // 查找当前分类
  const category = categories.find((cat) => cat.id === params.id)

  // 获取分类图标
  const IconComponent = category
    ? (LucideIcons[category.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>)
    : null

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

  // 如果分类不存在，显示 404
  if (!category) {
    return (
      <div className="min-h-screen">
        <div className="container px-4 py-16 text-center">
          <h1 className="text-4xl font-bold">分类不存在</h1>
          <p className="mt-4 text-muted-foreground">
            抱歉，您访问的分类不存在
          </p>
          <Button
            onClick={() => router.push('/')}
            className="mt-8"
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回首页
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* 主内容区 */}
      <div className="container px-4 py-8">
        {/* 分类头部 */}
        <div className="mb-12">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>

          <div className="flex items-start gap-4">
            {/* 分类图标 */}
            {IconComponent && (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `${category.color}20`,
                  color: category.color,
                }}
              >
                <IconComponent className="h-8 w-8" />
              </div>
            )}

            {/* 分类信息 */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold tracking-tight">
                {category.name}
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">
                {category.description}
              </p>
              {resources && (
                <p className="mt-4 text-sm text-muted-foreground">
                  共 {resources.length} 个资源
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 资源列表 */}
        {isLoading ? (
          <div className="text-center text-muted-foreground">
            加载中...
          </div>
        ) : resources && resources.length > 0 ? (
          <MasonryGrid
            resources={resources}
            isFavorited={isFavorited}
            onFavorite={handleFavorite}
            onVisit={handleVisit}
          />
        ) : (
          <div className="py-16 text-center">
            <p className="text-lg text-muted-foreground">
              该分类暂无资源
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
