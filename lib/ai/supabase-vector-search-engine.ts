import { SupabaseVectorStore } from './supabase-vector-store';
import type { Resource } from '@/types';
import type { AIProvider } from '@/types/ai-chat';

/**
 * 向量匹配结果接口（保持兼容性）
 */
export interface VectorMatch {
  resourceId: string;
  similarity: number;
  resource: Resource;
}

/**
 * 向量搜索选项接口（保持兼容性）
 */
export interface VectorSearchOptions {
  limit?: number;
  minSimilarity?: number;
  categoryFilter?: string[];
  minRating?: number;
}

/**
 * Supabase 向量搜索引擎
 * 完全替换内存向量索引，所有向量操作都通过数据库
 */
export class SupabaseVectorSearchEngine {
  private vectorStore = new SupabaseVectorStore();
  private resources: Map<string, Resource> = new Map();

  constructor(private provider: AIProvider) {
    // 加载资源数据到内存映射（仅用于快速查找）
    this.loadResources();
  }

  /**
   * 加载资源数据
   */
  private async loadResources(): Promise<void> {
    const resources = await import('@/data/resources.json');
    for (const resource of resources.default as Resource[]) {
      this.resources.set(resource.id, resource);
    }
    console.log(`📚 Loaded ${this.resources.size} resources for mapping`);
  }

  /**
   * 向量搜索（替换原有的 search 方法）
   */
  async search(
    query: string,
    options: VectorSearchOptions = {}
  ): Promise<VectorMatch[]> {
    try {
      // 生成查询向量
      const queryEmbedding = await this.provider.generateEmbedding(query);

      // 执行向量搜索
      const searchResults = await this.vectorStore.searchSimilar(queryEmbedding, {
        limit: options.limit || 10,
        minSimilarity: options.minSimilarity || 0.0,
        categoryFilter: options.categoryFilter,
        minRating: options.minRating,
      });

      // 转换为 VectorMatch 格式
      const matches: VectorMatch[] = [];
      for (const result of searchResults) {
        const resource = this.resources.get(result.resourceId);
        if (resource) {
          matches.push({
            resourceId: result.resourceId,
            similarity: result.similarity,
            resource,
          });
        }
      }

      return matches;
    } catch (error) {
      console.error('Supabase vector search failed:', error);
      throw error;
    }
  }

  /**
   * 查找相似资源
   */
  async findSimilar(
    resourceId: string,
    options: VectorSearchOptions = {}
  ): Promise<VectorMatch[]> {
    try {
      const resource = this.resources.get(resourceId);
      if (!resource) {
        throw new Error(`Resource not found: ${resourceId}`);
      }

      // 生成资源文本的向量
      const text = this.resourceToText(resource);
      const embedding = await this.provider.generateEmbedding(text);

      // 搜索相似向量
      const searchResults = await this.vectorStore.searchSimilar(embedding, {
        limit: (options.limit || 5) + 1, // +1 因为会包含自己
        minSimilarity: options.minSimilarity || 0.0,
      });

      // 过滤掉自己，转换格式
      const matches: VectorMatch[] = [];
      for (const result of searchResults) {
        if (result.resourceId !== resourceId) {
          const similarResource = this.resources.get(result.resourceId);
          if (similarResource) {
            matches.push({
              resourceId: result.resourceId,
              similarity: result.similarity,
              resource: similarResource,
            });
          }
        }
      }

      return matches.slice(0, options.limit || 5);
    } catch (error) {
      console.error('Find similar resources failed:', error);
      throw error;
    }
  }

  /**
   * 获取索引大小（从数据库）
   */
  async getIndexSize(): Promise<number> {
    const stats = await this.vectorStore.getStats();
    return stats.totalEmbeddings;
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    return this.vectorStore.healthCheck();
  }

  /**
   * 将资源转换为文本表示
   */
  private resourceToText(resource: Resource): string {
    return `${resource.name}. ${resource.description}. 标签: ${resource.tags.join(', ')}. 策展人笔记: ${resource.curatorNote}`;
  }

  /**
   * 清空索引（数据库操作）
   */
  async clearIndex(): Promise<void> {
    // 注意：这会删除所有向量数据，谨慎使用
    console.warn('⚠️ clearIndex() is not implemented for safety reasons');
    throw new Error('clearIndex() is not supported in production mode');
  }
}