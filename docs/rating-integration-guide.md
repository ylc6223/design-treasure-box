# 评分功能集成指南

## 快速开始

### 1. 在资源详情页中使用

最简单的方式是使用 `RatingSection` 组件：

```tsx
// app/resource/[id]/page.tsx

import { RatingSection } from './rating-section'

export default function ResourceDetailPage({ params }) {
  const resource = await getResource(params.id)

  return (
    <div className="container mx-auto py-8">
      <h1>{resource.name}</h1>
      <p>{resource.description}</p>

      {/* 添加评分区域 */}
      <RatingSection resource={resource} />
    </div>
  )
}
```

### 2. 在资源卡片中显示评分

如果你想在资源卡片中显示简化的评分信息：

```tsx
// components/resource-card.tsx

import { RatingStars } from '@/components/rating-stars'

export function ResourceCard({ resource }) {
  return (
    <Card>
      <h3>{resource.name}</h3>
      
      {/* 显示策展人评分 */}
      <RatingStars rating={resource.rating.overall} showValue />
      
      {/* 或者显示用户聚合评分（需要从 API 获取） */}
      {aggregatedRating && (
        <div className="flex items-center gap-2">
          <RatingStars rating={aggregatedRating.overall} showValue />
          <span className="text-xs text-muted">({ratingCount} 人评分)</span>
        </div>
      )}
    </Card>
  )
}
```

### 3. 自定义评分对话框触发

如果你想自定义评分按钮的位置和样式：

```tsx
'use client'

import { useState } from 'react'
import { RatingDialog } from '@/components/rating/rating-dialog'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'

export function CustomRatingButton({ resource }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = async (data) => {
    const response = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    // 处理响应...
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Star className="h-4 w-4" />
        为这个资源评分
      </Button>

      <RatingDialog
        resource={resource}
        open={isOpen}
        onOpenChange={setIsOpen}
        onSubmit={handleSubmit}
      />
    </>
  )
}
```

## 使用 TanStack Query 优化（推荐）

为了更好的数据缓存和状态管理，推荐创建自定义 Hooks：

### 创建 Hooks

```tsx
// hooks/use-ratings.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ResourceRatings, SubmitRatingRequest } from '@/types/rating'

/**
 * 获取资源评分数据
 */
export function useResourceRatings(resourceId: string) {
  return useQuery<ResourceRatings>({
    queryKey: ['ratings', resourceId],
    queryFn: async () => {
      const response = await fetch(`/api/ratings/${resourceId}`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || '获取评分失败')
      }
      
      return result.data
    },
    staleTime: 1000 * 60 * 5, // 5分钟内不重新获取
  })
}

/**
 * 提交评分
 */
export function useSubmitRating() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SubmitRatingRequest) => {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '评分提交失败')
      }

      return result.data
    },
    onSuccess: (_, variables) => {
      // 刷新评分数据
      queryClient.invalidateQueries({
        queryKey: ['ratings', variables.resourceId],
      })
    },
  })
}
```

### 使用 Hooks

```tsx
'use client'

import { useState } from 'react'
import { useResourceRatings, useSubmitRating } from '@/hooks/use-ratings'
import { RatingDialog } from '@/components/rating/rating-dialog'
import { RatingDisplay } from '@/components/rating/rating-display'

export function RatingSectionWithQuery({ resource, user }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // 获取评分数据
  const { data: ratings, isLoading, error } = useResourceRatings(resource.id)
  
  // 提交评分
  const submitRating = useSubmitRating()

  const handleSubmit = async (data) => {
    try {
      await submitRating.mutateAsync(data)
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Rating submission failed:', error)
      // 错误处理...
    }
  }

  if (isLoading) return <div>加载中...</div>
  if (error) return <div>加载失败</div>

  return (
    <>
      <RatingDisplay
        curatorRating={resource.rating}
        aggregatedRating={ratings?.aggregatedRating || null}
        ratingCount={ratings?.ratingCount || 0}
        userRating={ratings?.userRating || null}
        isAuthenticated={!!user}
        onRate={() => setIsDialogOpen(true)}
      />

      <RatingDialog
        resource={resource}
        existingRating={ratings?.userRating || null}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
      />
    </>
  )
}
```

## 完整的页面示例

```tsx
// app/resource/[id]/page.tsx

import { Suspense } from 'react'
import { RatingSection } from './rating-section'
import { Skeleton } from '@/components/ui/skeleton'

export default async function ResourceDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const resource = await getResource(id)

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* 资源基本信息 */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">{resource.name}</h1>
        <p className="text-lg text-muted-foreground">{resource.description}</p>
      </div>

      {/* 资源截图 */}
      <div className="aspect-video relative rounded-lg overflow-hidden">
        <img 
          src={resource.screenshot} 
          alt={resource.name}
          className="object-cover w-full h-full"
        />
      </div>

      {/* 评分区域 */}
      <div className="border-t pt-8">
        <h2 className="text-2xl font-semibold mb-4">用户评分</h2>
        <Suspense fallback={<RatingSkeleton />}>
          <RatingSection resource={resource} />
        </Suspense>
      </div>

      {/* 策展人笔记 */}
      <div className="border-t pt-8">
        <h2 className="text-2xl font-semibold mb-4">策展人笔记</h2>
        <p className="text-muted-foreground">{resource.curatorNote}</p>
      </div>
    </div>
  )
}

function RatingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-6 bg-muted rounded w-1/3" />
      <div className="h-4 bg-muted rounded w-1/2" />
    </div>
  )
}
```

## 样式定制

所有组件都支持 Tailwind CSS 类名定制：

```tsx
<RatingDisplay
  className="bg-surface rounded-lg p-6 shadow-sm"
  curatorRating={resource.rating}
  // ...
/>

<RatingDialog
  // Dialog 内容样式通过 DialogContent 的 className 定制
  // ...
/>
```

## 错误处理

建议在组件中添加错误边界和用户友好的错误提示：

```tsx
try {
  await submitRating.mutateAsync(data)
  // 成功提示
  toast.success('评分提交成功！')
} catch (error) {
  // 错误提示
  if (error.message.includes('AUTHENTICATION_ERROR')) {
    toast.error('请先登录')
  } else if (error.message.includes('VALIDATION_ERROR')) {
    toast.error('评分数据无效，请检查输入')
  } else {
    toast.error('评分提交失败，请稍后重试')
  }
}
```

## 性能优化建议

1. **使用 TanStack Query** 进行数据缓存，避免重复请求
2. **懒加载评分对话框**，只在用户点击时加载
3. **使用 Suspense** 包裹评分区域，提供加载状态
4. **乐观更新**：提交评分后立即更新 UI，无需等待服务器响应

```tsx
const submitRating = useMutation({
  mutationFn: submitRatingFn,
  onMutate: async (newRating) => {
    // 取消正在进行的查询
    await queryClient.cancelQueries({ queryKey: ['ratings', resourceId] })

    // 保存之前的数据
    const previousRatings = queryClient.getQueryData(['ratings', resourceId])

    // 乐观更新
    queryClient.setQueryData(['ratings', resourceId], (old) => ({
      ...old,
      userRating: newRating,
    }))

    return { previousRatings }
  },
  onError: (err, newRating, context) => {
    // 回滚
    queryClient.setQueryData(
      ['ratings', resourceId],
      context.previousRatings
    )
  },
})
```
