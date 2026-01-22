/**
 * 增强搜索集成测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enhancedSearch, getSearchCacheStats, clearSearchCache } from '../enhanced-search';
import type { SearchResult } from '@/types/ai-chat';

// Mock 搜索结果
const mockSearchResults: SearchResult[] = [
  {
    resource: {
      id: '1',
      name: 'Medical Icons Pack',
      description: 'A comprehensive medical icon set',
      categoryId: 'icons',
      rating: {
        overall: 4.5,
        usability: 4.5,
        aesthetics: 4.5,
        updateFrequency: 4.0,
        freeLevel: 4.0,
      },
      tags: ['medical', 'healthcare', 'icons'],
      curatorNote: 'Great for health apps',
      url: 'https://example.com/medical-icons',
    },
    similarity: 0.85,
    matchReason: 'Matches medical + icons keywords',
  },
  {
    resource: {
      id: '2',
      name: 'Healthcare UI Kit',
      description: 'UI components for healthcare applications',
      categoryId: 'ui-kits',
      rating: {
        overall: 4.2,
        usability: 4.3,
        aesthetics: 4.1,
        updateFrequency: 3.8,
        freeLevel: 3.5,
      },
      tags: ['healthcare', 'ui', 'components'],
      curatorNote: 'Modern design',
      url: 'https://example.com/healthcare-ui',
    },
    similarity: 0.72,
    matchReason: 'Related to healthcare',
  },
];

// Mock 搜索函数
const mockSearchFn = vi.fn().mockResolvedValue(mockSearchResults);

describe('EnhancedSearch Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSearchCache();
  });

  describe('enhancedSearch', () => {
    it('应成功执行清晰查询的搜索', async () => {
      const result = await enhancedSearch('医疗 图标 极简', mockSearchFn);

      expect(result.needsClarification).toBe(false);
      expect(result.searchResults).toHaveLength(2);
      expect(result.queryAnalysis).toBeDefined();
      expect(result.queryAnalysis.intent).toBe('search');
      expect(mockSearchFn).toHaveBeenCalledWith('医疗 图标 极简');
    });

    it('应对模糊查询返回澄清策略', async () => {
      const result = await enhancedSearch('图标', mockSearchFn);

      expect(result.needsClarification).toBe(true);
      expect(result.clarificationStrategy).toBeDefined();
      expect(result.clarificationStrategy?.questions.length).toBeGreaterThan(0);
    });

    it('应对探索意图返回正确的意图类型', async () => {
      const result = await enhancedSearch('推荐一些好看的设计', mockSearchFn);

      expect(result.queryAnalysis.intent).toBe('inspiration');
      // 探索意图可能触发澄清或直接搜索
      expect(['inspiration', 'search']).toContain(result.queryAnalysis.intent);
    });

    it('应对纠正意图返回正确的意图类型', async () => {
      const result = await enhancedSearch('不对，换个红色的', mockSearchFn);

      expect(result.queryAnalysis.intent).toBe('correction');
      // 纠正意图可能触发澄清或直接操作
    });

    it('应利用缓存减少重复搜索', async () => {
      // 第一次搜索
      const result1 = await enhancedSearch('医疗 图标 极简', mockSearchFn);
      expect(result1.fromCache).toBe(false);
      expect(mockSearchFn).toHaveBeenCalledTimes(1);

      // 第二次相同搜索
      const result2 = await enhancedSearch('医疗 图标 极简', mockSearchFn);
      expect(result2.fromCache).toBe(true);
      // 搜索函数不应再次调用
      expect(mockSearchFn).toHaveBeenCalledTimes(1);
    });

    it('应继承会话上下文', async () => {
      const sessionContext = { industry: '金融' };

      const result = await enhancedSearch('极简风格', mockSearchFn, sessionContext);

      expect(result.queryAnalysis.dimensions.industry).toBe('金融');
      expect(result.queryAnalysis.dimensions.style).toBe('极简');
    });
  });

  describe('缓存统计', () => {
    it('应正确统计缓存命中率', async () => {
      // 执行一些搜索
      await enhancedSearch('医疗图标', mockSearchFn);
      await enhancedSearch('医疗图标', mockSearchFn); // 缓存命中
      await enhancedSearch('金融网站', mockSearchFn);

      const stats = getSearchCacheStats();
      expect(stats.semantic.totalHits).toBeGreaterThan(0);
    });
  });

  describe('边界情况', () => {
    it('应处理空搜索结果', async () => {
      const emptySearchFn = vi.fn().mockResolvedValue([]);

      // 使用清晰的查询（含多个维度）避免触发澄清
      const result = await enhancedSearch('医疗 极简 网站 蓝色', emptySearchFn);

      expect(result.searchResults).toHaveLength(0);
      // 清晰查询无结果时应返回抱歉消息
      expect(result.content).toContain('抱歉');
    });

    it('应处理模糊查询返回澄清', async () => {
      const failingSearchFn = vi.fn().mockRejectedValue(new Error('Search failed'));

      // 模糊查询会触发澄清，不会执行搜索
      const result = await enhancedSearch('测试查询', failingSearchFn);

      // 应该返回澄清策略而不是抛出异常
      expect(result.needsClarification).toBe(true);
    });
  });
});
