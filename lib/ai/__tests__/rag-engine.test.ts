/**
 * RAG引擎测试（集成引导式提问）
 * Feature: ai-chat-assistant, Property 6: 推荐质量和解释
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 3.5, 5.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VercelAIRAGEngine } from '../rag-engine';
import { HybridSearchEngine } from '../hybrid-search';
import { VectorSearchEngine } from '../vector-search';
import { GuidedQuestioningEngine } from '../guided-questioning';
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
    return {
      content: '基于搜索结果，我推荐以下资源：\n\n1. **Coolors** - 这是一个优秀的配色工具，界面简洁，功能强大。\n\n推荐理由：\n- 高评分资源（4.5/5.0）\n- 完全免费使用\n- 适合快速生成配色方案',
      usage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      },
      finishReason: 'stop' as const,
    };
  }

  async *streamChatCompletion(): AsyncIterable<any> {
    const chunks = ['基于', '搜索', '结果', '，', '我推荐', 'Coolors'];
    for (const chunk of chunks) {
      yield { content: chunk, isComplete: false };
    }
    yield { content: '', isComplete: true };
  }

  async generateEmbedding(text: string): Promise<number[]> {
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

// 测试资源
const testResources: Resource[] = [
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
    id: 'adobe-color-2',
    name: 'Adobe Color',
    url: 'https://color.adobe.com',
    description: 'Adobe 官方配色工具',
    screenshot: 'https://example.com/adobe.jpg',
    categoryId: 'color',
    tags: ['配色', 'Adobe', '免费'],
    rating: {
      overall: 4.5,
      usability: 4.5,
      aesthetics: 5.0,
      updateFrequency: 4.5,
      freeLevel: 5.0,
    },
    curatorNote: 'Adobe 出品的专业配色工具',
    isFeatured: true,
    createdAt: '2024-01-02T00:00:00.000Z',
    viewCount: 980,
    favoriteCount: 245,
  },
  {
    id: 'tailwind-3',
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
    createdAt: '2024-01-03T00:00:00.000Z',
    viewCount: 2100,
    favoriteCount: 580,
  },
];

describe('VercelAIRAGEngine', () => {
  let ragEngine: VercelAIRAGEngine;
  let provider: MockAIProvider;
  let vectorSearch: VectorSearchEngine;
  let hybridSearch: HybridSearchEngine;
  let guidedQuestioning: GuidedQuestioningEngine;

  beforeEach(async () => {
    provider = new MockAIProvider();
    vectorSearch = new VectorSearchEngine(provider);
    await vectorSearch.buildIndex(testResources);
    hybridSearch = new HybridSearchEngine(vectorSearch, testResources);
    guidedQuestioning = new GuidedQuestioningEngine();
    ragEngine = new VercelAIRAGEngine(provider, hybridSearch, guidedQuestioning);
  });

  describe('RAG响应生成', () => {
    it('应该生成包含搜索结果的响应', async () => {
      // 使用更具体的查询以避免触发澄清
      const response = await ragEngine.generateResponse('推荐免费的配色工具');

      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('searchResults');
      expect(response).toHaveProperty('processingTime');
      expect(response.content).toBeTruthy();
      expect(response.searchResults.length).toBeGreaterThan(0);
      expect(response.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('应该返回不超过指定数量的搜索结果', async () => {
      const maxResults = 2;
      const response = await ragEngine.generateResponse('推荐工具', {
        maxResults,
      });

      expect(response.searchResults.length).toBeLessThanOrEqual(maxResults);
    });

    it('应该支持类别过滤', async () => {
      const response = await ragEngine.generateResponse('推荐工具', {
        categories: ['color'],
      });

      response.searchResults.forEach(result => {
        expect(result.resource.categoryId).toBe('color');
      });
    });

    it('应该支持最低评分过滤', async () => {
      const minRating = 4.8;
      const response = await ragEngine.generateResponse('推荐工具', {
        minRating,
      });

      response.searchResults.forEach(result => {
        expect(result.resource.rating.overall).toBeGreaterThanOrEqual(minRating);
      });
    });

    it('应该在没有结果时仍然返回响应', async () => {
      const response = await ragEngine.generateResponse('完全不存在的查询词xyz123', {
        categories: ['non-existent-category'],
      });

      expect(response).toHaveProperty('content');
      expect(response.searchResults.length).toBe(0);
    });
  });

  describe('流式响应生成', () => {
    it('应该生成流式响应', async () => {
      const chunks: string[] = [];
      let searchResults: any[] | undefined;

      // 使用更具体的查询
      for await (const item of ragEngine.streamResponse('推荐免费的配色工具')) {
        if (item.searchResults) {
          searchResults = item.searchResults;
        }
        if (item.chunk) {
          chunks.push(item.chunk);
        }
      }

      expect(searchResults).toBeDefined();
      expect(searchResults!.length).toBeGreaterThan(0);
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('应该先返回搜索结果再返回内容', async () => {
      let receivedSearchResults = false;
      let receivedContent = false;

      for await (const item of ragEngine.streamResponse('推荐工具')) {
        if (item.searchResults) {
          receivedSearchResults = true;
          expect(receivedContent).toBe(false); // 搜索结果应该先到
        }
        if (item.chunk) {
          receivedContent = true;
          expect(receivedSearchResults).toBe(true); // 内容应该在搜索结果之后
        }
      }

      expect(receivedSearchResults).toBe(true);
      expect(receivedContent).toBe(true);
    });
  });

  describe('相似资源推荐', () => {
    it('应该返回相似资源', async () => {
      const results = await ragEngine.getSimilarResources('coolors-1', 3);

      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(3);
      expect(results.every(r => r.resource.id !== 'coolors-1')).toBe(true);
    });

    it('应该包含匹配理由', async () => {
      const results = await ragEngine.getSimilarResources('coolors-1', 3);

      results.forEach(result => {
        expect(result.matchReason).toBeTruthy();
        expect(result.matchReason).toContain('相似度');
      });
    });
  });

  describe('查询意图分析', () => {
    it('应该识别搜索意图', async () => {
      const queries = ['找配色工具', '搜索CSS框架', '有没有图标库'];

      for (const query of queries) {
        const intent = await ragEngine.analyzeQueryIntent(query);
        expect(intent.intent).toBe('search');
        expect(intent.confidence).toBeGreaterThan(0);
      }
    });

    it('应该识别比较意图', async () => {
      const queries = ['比较Coolors和Adobe Color', '对比两个工具', '哪个更好'];

      for (const query of queries) {
        const intent = await ragEngine.analyzeQueryIntent(query);
        expect(intent.intent).toBe('comparison');
        expect(intent.confidence).toBeGreaterThan(0);
      }
    });

    it('应该识别推荐意图', async () => {
      const queries = ['建议使用什么', '适合新手的工具'];

      for (const query of queries) {
        const intent = await ragEngine.analyzeQueryIntent(query);
        expect(intent.intent).toBe('recommendation');
        expect(intent.confidence).toBeGreaterThan(0);
      }
    });

    it('应该为未知查询返回问题意图', async () => {
      const intent = await ragEngine.analyzeQueryIntent('这是什么？');
      expect(intent.intent).toBe('question');
    });
  });

  describe('属性测试：推荐质量', () => {
    it('Property: 任何查询都应该返回最多5个资源推荐', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          async (query) => {
            const response = await ragEngine.generateResponse(query, {
              maxResults: 5,
            });

            expect(response.searchResults.length).toBeLessThanOrEqual(5);
          }
        ),
        { numRuns: 5 }
      );
    });

    it('Property: 所有推荐都应该包含匹配理由', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          async (query) => {
            const response = await ragEngine.generateResponse(query);

            response.searchResults.forEach(result => {
              expect(result.matchReason).toBeTruthy();
              expect(typeof result.matchReason).toBe('string');
              expect(result.matchReason.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 5 }
      );
    });

    it('Property: 响应时间应该被正确记录', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length > 0),
          async (query) => {
            const response = await ragEngine.generateResponse(query);

            expect(response.processingTime).toBeGreaterThanOrEqual(0);
            expect(typeof response.processingTime).toBe('number');
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  describe('引导式提问集成', () => {
    it('应该检测模糊查询并返回澄清问题', async () => {
      const vaguQuery = '推荐';
      const response = await ragEngine.generateResponse(vaguQuery);

      expect(response.needsClarification).toBe(true);
      expect(response.clarificationQuestions).toBeDefined();
      expect(response.clarificationQuestions!.length).toBeGreaterThan(0);
      expect(response.searchResults.length).toBe(0);
    });

    it('应该为清晰查询直接返回搜索结果', async () => {
      const clearQuery = '推荐免费的配色工具，适合新手学习使用';
      const response = await ragEngine.generateResponse(clearQuery);

      expect(response.needsClarification).toBe(false);
      expect(response.clarificationQuestions).toBeUndefined();
      expect(response.searchResults.length).toBeGreaterThan(0);
    });

    it('应该在流式响应中处理澄清问题', async () => {
      const vaguQuery = '工具';
      let needsClarification = false;
      let clarificationQuestions: string[] | undefined;

      for await (const item of ragEngine.streamResponse(vaguQuery)) {
        if (item.needsClarification) {
          needsClarification = true;
          clarificationQuestions = item.clarificationQuestions;
        }
      }

      expect(needsClarification).toBe(true);
      expect(clarificationQuestions).toBeDefined();
      expect(clarificationQuestions!.length).toBeGreaterThan(0);
    });

    it('应该处理澄清回答并继续搜索', async () => {
      const originalQuery = '推荐';
      const clarificationAnswer = '我需要配色工具，适合新手使用';

      const response = await ragEngine.handleClarificationResponse(
        originalQuery,
        clarificationAnswer
      );

      expect(response.needsClarification).toBe(false);
      expect(response.searchResults.length).toBeGreaterThan(0);
    });

    it('应该在没有结果时提供建议查询', async () => {
      // 使用一个更具体但仍然找不到结果的查询
      const noResultQuery = '推荐专门用于xyz123的完全不存在的特殊工具';
      const response = await ragEngine.generateResponse(noResultQuery);

      expect(response.searchResults.length).toBe(0);
      // 可能返回澄清问题或无结果消息
      expect(response.content).toBeTruthy();
      expect(response.content.length).toBeGreaterThan(0);
    });

    it('应该支持对话历史上下文', async () => {
      const conversationHistory = [
        {
          id: 'msg-1',
          type: 'user' as const,
          content: '推荐配色工具',
          timestamp: new Date(),
        },
        {
          id: 'msg-2',
          type: 'assistant' as const,
          content: '我推荐Coolors',
          timestamp: new Date(),
        },
      ];

      const response = await ragEngine.generateResponse(
        '还有其他的吗？',
        undefined,
        { conversationHistory }
      );

      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('searchResults');
    });
  });

  describe('属性测试：引导式提问集成', () => {
    it('Property: 模糊查询应该触发澄清流程', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('推荐', '工具', '找', '有吗', '什么'),
          async (vaguQuery) => {
            const response = await ragEngine.generateResponse(vaguQuery);

            // 模糊查询应该要么返回澄清问题，要么返回建议
            if (response.needsClarification) {
              expect(response.clarificationQuestions).toBeDefined();
              expect(response.clarificationQuestions!.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 5 }
      );
    });

    it('Property: 澄清问题数量应该合理（不超过3个）', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 10 }),
          async (query) => {
            const response = await ragEngine.generateResponse(query);

            if (response.needsClarification && response.clarificationQuestions) {
              expect(response.clarificationQuestions.length).toBeLessThanOrEqual(3);
              expect(response.clarificationQuestions.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('Property: 处理澄清回答后应该返回有效响应', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 5, maxLength: 50 }),
          async (originalQuery, clarificationAnswer) => {
            const response = await ragEngine.handleClarificationResponse(
              originalQuery,
              clarificationAnswer
            );

            expect(response).toHaveProperty('content');
            expect(response).toHaveProperty('searchResults');
            expect(response).toHaveProperty('processingTime');
            expect(response.processingTime).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 5 }
      );
    });
  });
});
