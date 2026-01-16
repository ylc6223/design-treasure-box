/**
 * 混合搜索引擎
 * 结合向量搜索和结构化过滤，提供精准的资源匹配
 */

import type { Resource } from '@/types';
import type { SearchFilters, SearchResult } from '@/types/ai-chat';
import type { VectorSearchEngine, VectorMatch } from './vector-search';

/**
 * 混合搜索选项
 */
export interface HybridSearchOptions {
  vectorWeight?: number; // 向量搜索权重 (0-1)
  structuredWeight?: number; // 结构化过滤权重 (0-1)
  maxResults?: number;
  minSimilarity?: number;
}

/**
 * 混合搜索引擎类
 */
export class HybridSearchEngine {
  constructor(
    private vectorSearch: VectorSearchEngine,
    private allResources: Resource[]
  ) {}

  /**
   * 执行混合搜索
   */
  async search(
    query: string,
    filters?: SearchFilters,
    options: HybridSearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      vectorWeight = 0.7,
      structuredWeight = 0.3,
      maxResults = 10,
      minSimilarity = 0.0,
    } = options;

    // 1. 向量搜索
    const vectorMatches = await this.vectorSearch.search(query, {
      limit: maxResults * 2, // 获取更多结果用于后续过滤
      minSimilarity,
      categoryFilter: filters?.categories,
      minRating: filters?.minRating,
    });

    // 2. 结构化过滤
    const filteredResources = this.structuredFilter(this.allResources, filters);

    // 3. 合并结果
    const combinedResults = this.combineResults(
      vectorMatches,
      filteredResources,
      vectorWeight,
      structuredWeight
    );

    // 4. 排序并限制结果数量
    combinedResults.sort((a, b) => b.similarity - a.similarity);

    // 5. 应用excludeIds过滤
    let finalResults = combinedResults;
    if (filters?.excludeIds && filters.excludeIds.length > 0) {
      finalResults = combinedResults.filter(
        r => !filters.excludeIds!.includes(r.resource.id)
      );
    }

    // 6. 限制结果数量
    const limitedResults = finalResults.slice(
      0,
      filters?.maxResults || maxResults
    );

    // 7. 生成匹配理由
    return limitedResults.map(result => ({
      ...result,
      matchReason: this.generateMatchReason(result, query, filters),
    }));
  }

  /**
   * 结构化过滤
   */
  private structuredFilter(
    resources: Resource[],
    filters?: SearchFilters
  ): Resource[] {
    let filtered = [...resources];

    // 类别过滤
    if (filters?.categories && filters.categories.length > 0) {
      filtered = filtered.filter(r =>
        filters.categories!.includes(r.categoryId)
      );
    }

    // 评分过滤
    if (filters?.minRating !== undefined) {
      filtered = filtered.filter(r => r.rating.overall >= filters.minRating!);
    }

    // 排除ID过滤
    if (filters?.excludeIds && filters.excludeIds.length > 0) {
      filtered = filtered.filter(r => !filters.excludeIds!.includes(r.id));
    }

    return filtered;
  }

  /**
   * 合并向量搜索和结构化过滤结果
   */
  private combineResults(
    vectorMatches: VectorMatch[],
    filteredResources: Resource[],
    vectorWeight: number,
    structuredWeight: number
  ): SearchResult[] {
    const resultMap = new Map<string, SearchResult>();

    // 添加向量搜索结果
    for (const match of vectorMatches) {
      resultMap.set(match.resourceId, {
        resource: match.resource,
        similarity: match.similarity * vectorWeight,
        matchReason: '',
      });
    }

    // 增强结构化过滤匹配的资源得分
    const filteredIds = new Set(filteredResources.map(r => r.id));
    for (const [id, result] of resultMap.entries()) {
      if (filteredIds.has(id)) {
        result.similarity += structuredWeight;
      }
    }

    // 添加仅在结构化过滤中出现的资源
    for (const resource of filteredResources) {
      if (!resultMap.has(resource.id)) {
        resultMap.set(resource.id, {
          resource,
          similarity: structuredWeight,
          matchReason: '',
        });
      }
    }

    return Array.from(resultMap.values());
  }

  /**
   * 生成匹配理由
   */
  private generateMatchReason(
    result: SearchResult,
    query: string,
    filters?: SearchFilters
  ): string {
    const reasons: string[] = [];
    const resource = result.resource;

    // 语义匹配
    if (result.similarity > 0.7) {
      reasons.push('高度语义相关');
    } else if (result.similarity > 0.5) {
      reasons.push('语义相关');
    }

    // 评分匹配
    if (resource.rating.overall >= 4.5) {
      reasons.push('高评分资源');
    }

    // 类别匹配
    if (filters?.categories?.includes(resource.categoryId)) {
      reasons.push('符合类别筛选');
    }

    // 标签匹配
    const queryLower = query.toLowerCase();
    const matchedTags = resource.tags.filter(tag =>
      queryLower.includes(tag.toLowerCase()) ||
      tag.toLowerCase().includes(queryLower)
    );
    if (matchedTags.length > 0) {
      reasons.push(`匹配标签: ${matchedTags.join(', ')}`);
    }

    // 精选资源
    if (resource.isFeatured) {
      reasons.push('精选推荐');
    }

    // 如果没有具体理由，提供通用理由
    if (reasons.length === 0) {
      reasons.push('符合搜索条件');
    }

    return reasons.join('；');
  }

  /**
   * 获取相似资源推荐
   */
  async findSimilarResources(
    resourceId: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    const matches = await this.vectorSearch.findSimilar(resourceId, {
      limit,
      minSimilarity: 0.3,
    });

    return matches.map(match => ({
      resource: match.resource,
      similarity: match.similarity,
      matchReason: `与当前资源相似度: ${(match.similarity * 100).toFixed(1)}%`,
    }));
  }
}
