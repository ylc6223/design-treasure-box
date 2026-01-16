/**
 * 向量搜索引擎测试
 * Feature: ai-chat-assistant, Property 3: 混合搜索集成
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VectorSearchEngine } from '../vector-search';
import type { Resource } from '@/types';
import type { AIProvider } from '@/types/ai-chat';
import * as fc from 'fast-check';

// Mock AI Provider
class MockAIProvider implements AIProvider {
  name = 'mock-provider';
  version = '1.0.0';
  capabilities = {
    chat: true,
    streaming: true,
    embedding: true,
    functionCalling: false,
    maxTokens: 8192,
    supportedLanguages: ['zh', 'en'],
  };

  async generateChatCompletion(): Promise<any> {
    return { content: 'mock response' };
  }

  async *streamChatCompletion(): AsyncIterable<any> {
    yield { content: 'mock', isComplete: false };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // 生成确定性的伪随机向量（基于文本内容）
    const hash = this.simpleHash(text);
    const vector: number[] = [];
    for (let i = 0; i < 128; i++) {
      vector.push(Math.sin(hash + i) * 0.5 + 0.5);
    }
    return vector;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(t => this.generateEmbedding(t)));
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash;
    }
    return hash;
  }
}

// 测试资源生成器
const testResourceGenerator = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  url: fc.constant('https://example.com'),
  description: fc.string({ minLength: 10, maxLength: 200 }),
  screenshot: fc.constant('https://example.com/image.jpg'),
  categoryId: fc.constantFrom('color', 'css', 'font', 'icon'),
  tags: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 5 }),
  rating: fc.record({
    overall: fc.float({ min: 1, max: 5 }),
    usability: fc.float({ min: 1, max: 5 }),
    aesthetics: fc.float({ min: 1, max: 5 }),
    updateFrequency: fc.float({ min: 1, max: 5 }),
    freeLevel: fc.float({ min: 1, max: 5 }),
  }),
  curatorNote: fc.string({ minLength: 10, maxLength: 100 }),
  isFeatured: fc.boolean(),
  createdAt: fc.constant('2024-01-01T00:00:00.000Z'),
  viewCount: fc.integer({ min: 0, max: 10000 }),
  favoriteCount: fc.integer({ min: 0, max: 1000 }),
}) as fc.Arbitrary<Resource>;

describe('VectorSearchEngine', () => {
  let engine: VectorSearchEngine;
  let provider: MockAIProvider;

  beforeEach(() => {
    provider = new MockAIProvider();
    engine = new VectorSearchEngine(provider);
  });

  describe('索引构建', () => {
    it('应该成功构建向量索引', async () => {
      const resources: Resource[] = [
        {
          id: 'test-1',
          name: 'Test Resource',
          url: 'https://example.com',
          description: 'A test resource for testing',
          screenshot: 'https://example.com/image.jpg',
          categoryId: 'color',
          tags: ['test', 'color'],
          rating: {
            overall: 4.5,
            usability: 4.5,
            aesthetics: 4.5,
            updateFrequency: 4.0,
            freeLevel: 5.0,
          },
          curatorNote: 'Test curator note',
          isFeatured: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          viewCount: 100,
          favoriteCount: 20,
        },
      ];

      await engine.buildIndex(resources);
      expect(engine.getIndexSize()).toBe(1);
    });

    it('应该为多个资源构建索引', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(testResourceGenerator, { minLength: 1, maxLength: 10 }),
          async (resources) => {
            // 为每个测试创建新的引擎实例
            const testEngine = new VectorSearchEngine(provider);
            
            // 确保ID唯一
            const uniqueResources = resources.map((r, i) => ({
              ...r,
              id: `resource-${i}`,
            }));

            await testEngine.buildIndex(uniqueResources);
            expect(testEngine.getIndexSize()).toBe(uniqueResources.length);
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  describe('向量搜索', () => {
    beforeEach(async () => {
      const resources: Resource[] = [
        {
          id: 'coolors-1',
          name: 'Coolors',
          url: 'https://coolors.co',
          description: '快速生成配色方案的在线工具',
          screenshot: 'https://example.com/coolors.jpg',
          categoryId: 'color',
          tags: ['配色', '工具', '免费'],
          rating: {
            overall: 4.5,
            usability: 5.0,
            aesthetics: 4.5,
            updateFrequency: 4.0,
            freeLevel: 5.0,
          },
          curatorNote: '非常好用的配色工具',
          isFeatured: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          viewCount: 1250,
          favoriteCount: 320,
        },
        {
          id: 'tailwind-2',
          name: 'Tailwind CSS',
          url: 'https://tailwindcss.com',
          description: '实用优先的 CSS 框架',
          screenshot: 'https://example.com/tailwind.jpg',
          categoryId: 'css',
          tags: ['CSS', '框架', '免费'],
          rating: {
            overall: 5.0,
            usability: 4.5,
            aesthetics: 4.5,
            updateFrequency: 5.0,
            freeLevel: 5.0,
          },
          curatorNote: '最流行的 CSS 框架',
          isFeatured: true,
          createdAt: '2024-01-02T00:00:00.000Z',
          viewCount: 2100,
          favoriteCount: 580,
        },
      ];

      await engine.buildIndex(resources);
    });

    it('应该返回相关的搜索结果', async () => {
      const results = await engine.search('配色工具', { limit: 5 });

      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(5);
      expect(results[0]).toHaveProperty('resourceId');
      expect(results[0]).toHaveProperty('similarity');
      expect(results[0]).toHaveProperty('resource');
    });

    it('应该按相似度降序排序结果', async () => {
      const results = await engine.search('CSS框架', { limit: 10 });

      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].similarity).toBeGreaterThanOrEqual(results[i + 1].similarity);
      }
    });

    it('应该支持类别过滤', async () => {
      const results = await engine.search('工具', {
        limit: 10,
        categoryFilter: ['color'],
      });

      results.forEach(result => {
        expect(result.resource.categoryId).toBe('color');
      });
    });

    it('应该支持最低评分过滤', async () => {
      const minRating = 4.8;
      const results = await engine.search('框架', {
        limit: 10,
        minRating,
      });

      results.forEach(result => {
        expect(result.resource.rating.overall).toBeGreaterThanOrEqual(minRating);
      });
    });

    it('应该支持最低相似度过滤', async () => {
      const minSimilarity = 0.5;
      const results = await engine.search('设计', {
        limit: 10,
        minSimilarity,
      });

      results.forEach(result => {
        expect(result.similarity).toBeGreaterThanOrEqual(minSimilarity);
      });
    });

    it('应该限制返回结果数量', async () => {
      const limit = 1;
      const results = await engine.search('工具', { limit });

      expect(results.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('相似资源查找', () => {
    beforeEach(async () => {
      const resources: Resource[] = [
        {
          id: 'resource-1',
          name: 'Resource 1',
          url: 'https://example.com/1',
          description: 'First test resource',
          screenshot: 'https://example.com/1.jpg',
          categoryId: 'color',
          tags: ['test'],
          rating: {
            overall: 4.0,
            usability: 4.0,
            aesthetics: 4.0,
            updateFrequency: 4.0,
            freeLevel: 4.0,
          },
          curatorNote: 'Note 1',
          isFeatured: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          viewCount: 100,
          favoriteCount: 10,
        },
        {
          id: 'resource-2',
          name: 'Resource 2',
          url: 'https://example.com/2',
          description: 'Second test resource',
          screenshot: 'https://example.com/2.jpg',
          categoryId: 'color',
          tags: ['test'],
          rating: {
            overall: 4.0,
            usability: 4.0,
            aesthetics: 4.0,
            updateFrequency: 4.0,
            freeLevel: 4.0,
          },
          curatorNote: 'Note 2',
          isFeatured: false,
          createdAt: '2024-01-02T00:00:00.000Z',
          viewCount: 100,
          favoriteCount: 10,
        },
      ];

      await engine.buildIndex(resources);
    });

    it('应该找到相似资源', async () => {
      const results = await engine.findSimilar('resource-1', { limit: 5 });

      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.resourceId !== 'resource-1')).toBe(true);
    });

    it('应该在资源不存在时抛出错误', async () => {
      await expect(engine.findSimilar('non-existent')).rejects.toThrow();
    });
  });

  describe('余弦相似度计算', () => {
    it('应该正确计算相同向量的相似度', async () => {
      const resources: Resource[] = [
        {
          id: 'test-1',
          name: 'Test',
          url: 'https://example.com',
          description: 'Test description',
          screenshot: 'https://example.com/image.jpg',
          categoryId: 'color',
          tags: ['test'],
          rating: {
            overall: 4.0,
            usability: 4.0,
            aesthetics: 4.0,
            updateFrequency: 4.0,
            freeLevel: 4.0,
          },
          curatorNote: 'Note',
          isFeatured: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          viewCount: 100,
          favoriteCount: 10,
        },
      ];

      await engine.buildIndex(resources);
      const results = await engine.search('Test description', { limit: 1 });

      // 相同或非常相似的文本应该有高相似度
      expect(results[0].similarity).toBeGreaterThan(0.5);
    });
  });

  describe('索引管理', () => {
    it('应该能够清空索引', async () => {
      const resources: Resource[] = [
        {
          id: 'test-1',
          name: 'Test',
          url: 'https://example.com',
          description: 'Test',
          screenshot: 'https://example.com/image.jpg',
          categoryId: 'color',
          tags: ['test'],
          rating: {
            overall: 4.0,
            usability: 4.0,
            aesthetics: 4.0,
            updateFrequency: 4.0,
            freeLevel: 4.0,
          },
          curatorNote: 'Note',
          isFeatured: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          viewCount: 100,
          favoriteCount: 10,
        },
      ];

      await engine.buildIndex(resources);
      expect(engine.getIndexSize()).toBe(1);

      engine.clearIndex();
      expect(engine.getIndexSize()).toBe(0);
    });
  });
});
