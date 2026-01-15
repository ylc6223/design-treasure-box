'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { Resource } from '@/types'
import { useResources } from './use-resources'

const ITEMS_PER_PAGE = 24

export interface UseInfiniteResourcesOptions {
  categoryId?: string
}

interface ResourcePage {
  resources: Resource[]
  nextCursor: number | undefined
  hasMore: boolean
}

/**
 * useInfiniteResources Hook
 * 
 * 使用 TanStack Query 的 useInfiniteQuery 管理无限滚动
 * 
 * 当前实现：基于本地数据模拟分页
 * 未来迁移：替换 fetchResourcePage 为真实 API 调用
 * 
 * @param categoryId - 当前选中的分类 ID（可选）
 * @returns 无限查询结果对象
 */
export function useInfiniteResources({
  categoryId,
}: UseInfiniteResourcesOptions) {
  // 获取所有资源数据（未来替换为 API 调用）
  const { data: allResources = [] } = useResources()

  // 根据分类筛选资源
  const filteredResources = useMemo(() => {
    if (!categoryId) {
      return allResources
    }
    return allResources.filter((resource) => resource.categoryId === categoryId)
  }, [allResources, categoryId])

  // 分页获取函数
  // 未来迁移：替换为 fetch('/api/resources?page=X&category=Y')
  const fetchResourcePage = async ({ pageParam = 0 }): Promise<ResourcePage> => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300))

    const start = pageParam * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    const resources = filteredResources.slice(start, end)
    
    const hasMore = end < filteredResources.length
    const nextCursor = hasMore ? pageParam + 1 : undefined

    return {
      resources,
      nextCursor,
      hasMore,
    }
  }

  const query = useInfiniteQuery({
    queryKey: ['infinite-resources', categoryId],
    queryFn: fetchResourcePage,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: allResources.length > 0,
    staleTime: 1000 * 60 * 5, // 5 分钟
  })

  // 展平所有页面的资源
  const resources = useMemo(() => {
    return query.data?.pages.flatMap(page => page.resources) ?? []
  }, [query.data])

  return {
    resources,
    hasMore: query.hasNextPage ?? false,
    loadMore: query.fetchNextPage,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    total: filteredResources.length,
  }
}
