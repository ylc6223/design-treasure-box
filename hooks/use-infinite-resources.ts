'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchResourcePage } from './use-resources';

const ITEMS_PER_PAGE = 24;

export interface UseInfiniteResourcesOptions {
  categoryId?: string;
}

/**
 * useInfiniteResources Hook
 *
 * 使用 TanStack Query 的 useInfiniteQuery 管理无限滚动
 *
 * 实现：基于 Supabase 的后端分页
 *
 * @param categoryId - 当前选中的分类 ID（可选）
 * @returns 无限查询结果对象
 */
export function useInfiniteResources({ categoryId }: UseInfiniteResourcesOptions) {
  const query = useInfiniteQuery({
    queryKey: ['infinite-resources', categoryId],
    initialPageParam: 0,

    queryFn: async ({ pageParam = 0 }) => {
      const { data, total } = await fetchResourcePage({
        page: pageParam,
        pageSize: ITEMS_PER_PAGE,
        categoryId,
      });

      const hasMore = (pageParam + 1) * ITEMS_PER_PAGE < total;

      return {
        resources: data,
        nextCursor: hasMore ? pageParam + 1 : undefined,
        total,
      };
    },

    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 5, // 5 分钟
  });

  // 展平所有页面的资源
  const resources = useMemo(() => {
    return query.data?.pages.flatMap((page) => page.resources) ?? [];
  }, [query.data]);

  return {
    resources,
    hasMore: query.hasNextPage ?? false,
    loadMore: query.fetchNextPage,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    // 获取总数 (取第一页的total)
    total: query.data?.pages[0]?.total ?? 0,
  };
}
