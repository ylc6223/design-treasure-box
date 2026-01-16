'use client'

import * as React from 'react'
import { RatingBreakdown } from '@/components/rating-breakdown'
import { ResourceCard } from '@/components/resource-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useFavorites } from '@/hooks/use-favorites'
import { useResourceById, useResources } from '@/hooks/use-resources'
import { ArrowLeft, ExternalLink, Heart, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import categories from '@/data/categories.json'
import { RatingSection } from './rating-section'

interface ResourceDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ResourceDetailPage({ params }: ResourceDetailPageProps) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const { data: resource, isLoading } = useResourceById(resolvedParams.id)
  const { data: allResources } = useResources()
  const { isFavorited, addFavorite, removeFavorite } = useFavorites()

  // 获取相关资源（同分类的其他资源，排除当前资源）
  const relatedResources = allResources
    ?.filter((r) => r.categoryId === resource?.categoryId && r.id !== resource?.id)
    .slice(0, 4) // 最多显示4个

  // 获取分类信息
  const category = categories.find((cat) => cat.id === resource?.categoryId)

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

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container px-4 py-16 text-center">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    )
  }

  // 资源不存在
  if (!resource) {
    return (
      <div className="min-h-screen">
        <div className="container px-4 py-16 text-center">
          <h1 className="text-4xl font-bold">资源不存在</h1>
          <p className="mt-4 text-muted-foreground">
            抱歉，您访问的资源不存在
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
        {/* 返回按钮 */}
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* 左侧：资源信息 */}
          <div className="lg:col-span-2 space-y-8">
            {/* ResourceHero */}
            <div className="space-y-6">
              {/* 资源截图 */}
              <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                <Image
                  src={resource.screenshot}
                  alt={resource.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                />
                {resource.isFeatured && (
                  <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-highlight px-2 py-1 text-xs font-medium text-white">
                    <Sparkles className="h-3 w-3" />
                    编辑精选
                  </div>
                )}
              </div>

              {/* 基本信息 */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                      {resource.name}
                    </h1>
                    {category && (
                      <Badge variant="secondary">
                        {category.name}
                      </Badge>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isFavorited(resource.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFavorite(resource.id)}
                    >
                      <Heart 
                        className={`mr-2 h-4 w-4 ${
                          isFavorited(resource.id) ? 'fill-current' : ''
                        }`} 
                      />
                      {isFavorited(resource.id) ? '已收藏' : '收藏'}
                    </Button>
                    <Button
                      onClick={() => handleVisit(resource.url)}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      访问网站
                    </Button>
                  </div>
                </div>

                {/* 描述 */}
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {resource.description}
                </p>

                {/* 标签 */}
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* 统计信息 */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span>浏览 {resource.viewCount.toLocaleString()}</span>
                  <span>收藏 {resource.favoriteCount.toLocaleString()}</span>
                  <span>
                    收录于 {new Date(resource.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            </div>

            {/* 策展人推荐 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">策展人推荐</h2>
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-muted-foreground leading-relaxed">
                  {resource.curatorNote}
                </p>
              </div>
            </div>

            {/* 相关资源 */}
            {relatedResources && relatedResources.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">相关资源</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {relatedResources.map((relatedResource) => (
                    <ResourceCard
                      key={relatedResource.id}
                      resource={relatedResource}
                      isFavorited={isFavorited(relatedResource.id)}
                      onFavorite={() => handleFavorite(relatedResource.id)}
                      onVisit={() => handleVisit(relatedResource.url)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 右侧：评分详情 */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* 原有的评分分解 */}
              <RatingBreakdown rating={resource.rating} />
              
              {/* 新增：用户评分区域 */}
              <div className="rounded-lg border bg-surface p-6">
                <h3 className="text-lg font-semibold mb-4">用户评分</h3>
                <RatingSection resource={resource} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}