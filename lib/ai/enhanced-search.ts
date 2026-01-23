/**
 * 增强型 RAG 引擎封装
 *
 * 集成 query-analyzer、clarification-generator、cache-manager
 * 提供统一的智能搜索接口
 */

import type { SearchFilters, SearchResult } from '@/types/ai-chat';
import { analyzeQuery, type QueryAnalysis, type SearchDimensions } from './query-analyzer';
import {
  generateClarificationStrategy,
  shouldClarify,
  type ClarificationStrategy,
} from './clarification-generator';
import { getCacheManager } from './cache-manager';

// ============ 类型定义 ============

/**
 * 增强型搜索响应
 */
export interface EnhancedSearchResponse {
  // 核心结果
  content: string;
  searchResults: SearchResult[];
  processingTime: number;

  // 查询分析
  queryAnalysis: QueryAnalysis;

  // 澄清相关
  needsClarification: boolean;
  clarificationStrategy?: ClarificationStrategy;

  // 缓存状态
  fromCache: boolean;
}

/**
 * 增强型搜索选项
 */
export interface EnhancedSearchOptions {
  maxResults?: number;
  minSimilarity?: number;
  sessionId?: string;
}

// ============ 核心函数 ============

/**
 * 执行增强型搜索
 *
 * 流程:
 * 1. 查询分析 (意图识别、维度提取)
 * 2. 澄清决策 (是否需要澄清)
 * 3. 缓存检查
 * 4. 执行搜索
 * 5. 缓存结果
 *
 * @param query - 用户查询
 * @param searchFn - 实际的搜索函数
 * @param sessionContext - 会话上下文
 * @param options - 搜索选项
 */
export async function enhancedSearch(
  query: string,
  searchFn: (query: string, filters?: SearchFilters) => Promise<SearchResult[]>,
  sessionContext: SearchDimensions = {},
  _options: EnhancedSearchOptions = {}
): Promise<EnhancedSearchResponse> {
  const startTime = Date.now();
  const cacheManager = getCacheManager();

  // 1. 查询分析
  const queryAnalysis = await analyzeQuery(query, sessionContext);
  console.log(
    `🔍 Query Analysis: intent=${queryAnalysis.intent}, confidence=${(queryAnalysis.confidence * 100).toFixed(1)}%`
  );

  // 2. 检查是否需要澄清
  if (shouldClarify(queryAnalysis)) {
    const clarificationStrategy = generateClarificationStrategy(queryAnalysis);

    // 对于模糊查询，仍然尝试搜索
    if (queryAnalysis.clarity === 'ambiguous') {
      // 尝试搜索，同时返回澄清建议
      const searchResults = await searchFn(query);
      const processingTime = Date.now() - startTime;

      return {
        content: `${clarificationStrategy.message}\n\n以下是基于当前信息的初步推荐：`,
        searchResults,
        processingTime,
        queryAnalysis,
        needsClarification: true,
        clarificationStrategy,
        fromCache: false,
      };
    }

    // 极度模糊的查询，直接返回澄清问题
    const processingTime = Date.now() - startTime;
    return {
      content:
        clarificationStrategy.message || '为了更好地帮助您找到合适的资源，我需要了解更多信息。',
      searchResults: [],
      processingTime,
      queryAnalysis,
      needsClarification: true,
      clarificationStrategy,
      fromCache: false,
    };
  }

  // 3. 缓存检查
  const cacheKey = cacheManager.generateSemanticKey(
    query,
    sessionContext as Record<string, string>
  );
  const cachedResult = cacheManager.getFromSemanticCache(cacheKey);

  if (cachedResult) {
    console.log(`📦 Cache hit: ${query.substring(0, 30)}...`);
    return {
      content: cachedResult.content || '',
      searchResults: (cachedResult.resources as SearchResult[]) || [],
      processingTime: cachedResult.processingTime,
      queryAnalysis,
      needsClarification: false,
      fromCache: true,
    };
  }

  // 4. 执行搜索
  console.log(`🔎 Executing search: ${query}`);
  const searchResults = await searchFn(query);
  const processingTime = Date.now() - startTime;

  // 5. 构建响应内容
  const content = buildResponseContent(queryAnalysis, searchResults, query);

  // 6. 缓存结果
  cacheManager.setSemanticCache(cacheKey, {
    resources: searchResults,
    content,
    processingTime,
  });

  return {
    content,
    searchResults,
    processingTime,
    queryAnalysis,
    needsClarification: false,
    fromCache: false,
  };
}

/**
 * 根据意图构建响应内容
 */
function buildResponseContent(
  analysis: QueryAnalysis,
  results: SearchResult[],
  query: string
): string {
  if (results.length === 0) {
    return `抱歉，没有找到与"${query}"完全匹配的资源。\n\n您可以尝试：\n1. 使用更通用的关键词\n2. 浏览分类页面发现更多资源`;
  }

  switch (analysis.intent) {
    case 'inspiration':
      return buildInspirationContent(results);
    case 'correction':
      return buildCorrectionContent(results);
    default:
      return buildSearchContent(results);
  }
}

/**
 * 构建探索型响应内容
 */
function buildInspirationContent(results: SearchResult[]): string {
  const intro = `为您推荐一些精选的设计资源，希望能给您带来灵感：\n\n`;
  const recommendations = results
    .slice(0, 5)
    .map((r, i) => {
      const resource = r.resource;
      return (
        `**${i + 1}. ${resource.name}**\n` +
        `   ${resource.description}\n` +
        `   ⭐ ${resource.rating?.overall || 'N/A'}/5.0 | 🏷️ ${(resource.tags || []).slice(0, 3).join(', ')}`
      );
    })
    .join('\n\n');

  return intro + recommendations + `\n\n💡 想看更多？告诉我具体想要什么风格或行业吧！`;
}

/**
 * 构建纠正型响应内容
 */
function buildCorrectionContent(results: SearchResult[]): string {
  const items = results
    .slice(0, 3)
    .map((r, i) => {
      const resource = r.resource;
      const desc = resource.description?.substring(0, 80) || '';
      return `**${i + 1}. ${resource.name}** - ${desc}...`;
    })
    .join('\n\n');

  return `明白了！已根据您的反馈重新搜索。以下是更新后的推荐：\n\n${items}\n\n这些更符合您的要求吗？`;
}

/**
 * 构建标准搜索响应内容
 */
function buildSearchContent(results: SearchResult[]): string {
  const items = results
    .slice(0, 5)
    .map((r, i) => {
      const resource = r.resource;
      return (
        `**${i + 1}. ${resource.name}**\n` +
        `   ${resource.description}\n` +
        `   匹配原因: ${r.matchReason}`
      );
    })
    .join('\n\n');

  return `找到 ${results.length} 个相关资源：\n\n${items}`;
}

/**
 * 获取缓存统计
 */
export function getSearchCacheStats() {
  return getCacheManager().getStats();
}

/**
 * 清除搜索缓存
 */
export function clearSearchCache() {
  getCacheManager().clearAll();
}
