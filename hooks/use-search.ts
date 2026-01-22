'use client';

import { useMemo } from 'react';
import { type Resource, type SearchFilters } from '@/types';

/**
 * 搜索和筛选资源
 *
 * @param resources - 资源列表
 * @param filters - 搜索筛选条件
 * @returns 筛选后的资源列表
 */
function filterResources(resources: Resource[], filters: SearchFilters): Resource[] {
  let filtered = [...resources];

  // 关键词搜索（在名称、描述、标签中模糊匹配）
  if (filters.query && filters.query.trim()) {
    const query = filters.query.toLowerCase().trim();
    filtered = filtered.filter((resource) => {
      const matchName = resource.name.toLowerCase().includes(query);
      const matchDescription = resource.description.toLowerCase().includes(query);
      const matchTags = resource.tags.some((tag) => tag.toLowerCase().includes(query));
      const matchNote = resource.curatorNote.toLowerCase().includes(query);

      return matchName || matchDescription || matchTags || matchNote;
    });
  }

  // 分类筛选
  if (filters.categoryId) {
    filtered = filtered.filter((resource) => resource.categoryId === filters.categoryId);
  }

  // 标签筛选（多标签组合，资源必须包含所有选中的标签）
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter((resource) => {
      return filters.tags!.every((tag) => resource.tags.includes(tag));
    });
  }

  // 精选筛选
  if (filters.isFeatured !== undefined) {
    filtered = filtered.filter((resource) => resource.isFeatured === filters.isFeatured);
  }

  // 排序
  if (filters.sortBy) {
    filtered.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (filters.sortBy) {
        case 'rating':
          aValue = a.rating.overall;
          bValue = b.rating.overall;
          break;
        case 'viewCount':
          aValue = a.viewCount;
          bValue = b.viewCount;
          break;
        case 'favoriteCount':
          aValue = a.favoriteCount;
          bValue = b.favoriteCount;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      const direction = filters.sortDirection === 'asc' ? 1 : -1;
      return (aValue - bValue) * direction;
    });
  }

  return filtered;
}

/**
 * useSearch Hook
 *
 * 搜索和筛选资源的 Hook
 *
 * @param resources - 资源列表
 * @param filters - 搜索筛选条件
 * @returns {Object} 搜索结果对象
 * @returns {Resource[]} results - 筛选后的资源列表
 * @returns {number} total - 结果总数
 * @returns {boolean} hasResults - 是否有结果
 */
export function useSearch(resources: Resource[] | undefined, filters: SearchFilters) {
  const results = useMemo(() => {
    if (!resources) return [];
    return filterResources(resources, filters);
  }, [resources, filters]);

  return {
    results,
    total: results.length,
    hasResults: results.length > 0,
  };
}

/**
 * 获取所有唯一标签
 *
 * @param resources - 资源列表
 * @returns 标签列表（按使用频率降序）
 */
export function useAllTags(resources: Resource[] | undefined) {
  return useMemo(() => {
    if (!resources) return [];

    // 统计标签使用频率
    const tagCounts = new Map<string, number>();

    resources.forEach((resource) => {
      resource.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    // 按使用频率降序排序
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }, [resources]);
}

/**
 * 获取热门标签（使用频率最高的前 N 个）
 *
 * @param resources - 资源列表
 * @param limit - 返回数量限制，默认 10
 * @returns 热门标签列表
 */
export function usePopularTags(resources: Resource[] | undefined, limit = 10) {
  const allTags = useAllTags(resources);
  return useMemo(() => allTags.slice(0, limit), [allTags, limit]);
}
