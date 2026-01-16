/**
 * 向量搜索引擎
 * 实现基于向量嵌入的语义相似度搜索
 */

import type { Resource } from '@/types';
import type { AIProvider } from '@/types/ai-chat';

/**
 * 向量索引条目
 */
export interface VectorIndexEntry {
  resourceId: string;
  embedding: number[];
  metadata: {
    category: string;
    rating: number;
    tags: string[];
    lastUpdated: Date;
  };
}

/**
 * 向量匹配结果
 */
export interface VectorMatch {
  resourceId: string;
  similarity: number;
  resource: Resource;
}

/**
 * 向量搜索选项
 */
export interface VectorSearchOptions {
  limit?: number;
  minSimilarity?: number;
  categoryFilter?: string[];
  minRating?: number;
}

/**
 * 向量搜索引擎类
 */
export class VectorSearchEngine {
  private index: Map<string, VectorIndexEntry> = new Map();
  private resources: Map<string, Resource> = new Map();

  constructor(private provider: AIProvider) {}

  /**
   * 构建向量索引
   */
  async buildIndex(resources: Resource[]): Promise<void> {
    console.log(`Building vector index for ${resources.length} resources...`);

    // 存储资源
    for (const resource of resources) {
      this.resources.set(resource.id, resource);
    }

    // 为每个资源生成嵌入向量
    const texts = resources.map(r => this.resourceToText(r));
    const embeddings = await this.provider.generateEmbeddings(texts);

    // 构建索引
    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      this.index.set(resource.id, {
        resourceId: resource.id,
        embedding: embeddings[i],
        metadata: {
          category: resource.categoryId,
          rating: resource.rating.overall,
          tags: resource.tags,
          lastUpdated: new Date(resource.createdAt),
        },
      });
    }

    console.log(`Vector index built with ${this.index.size} entries`);
  }

  /**
   * 向量搜索
   */
  async search(
    query: string,
    options: VectorSearchOptions = {}
  ): Promise<VectorMatch[]> {
    const {
      limit = 10,
      minSimilarity = 0.0,
      categoryFilter,
      minRating,
    } = options;

    // 生成查询向量
    const queryEmbedding = await this.provider.generateEmbedding(query);

    // 计算所有资源的相似度
    const matches: VectorMatch[] = [];

    for (const [resourceId, entry] of this.index.entries()) {
      // 应用过滤器
      if (categoryFilter && !categoryFilter.includes(entry.metadata.category)) {
        continue;
      }

      if (minRating && entry.metadata.rating < minRating) {
        continue;
      }

      // 计算余弦相似度
      const similarity = this.cosineSimilarity(queryEmbedding, entry.embedding);

      if (similarity >= minSimilarity) {
        const resource = this.resources.get(resourceId);
        if (resource) {
          matches.push({
            resourceId,
            similarity,
            resource,
          });
        }
      }
    }

    // 按相似度降序排序并限制结果数量
    matches.sort((a, b) => b.similarity - a.similarity);
    return matches.slice(0, limit);
  }

  /**
   * 获取相似资源
   */
  async findSimilar(
    resourceId: string,
    options: VectorSearchOptions = {}
  ): Promise<VectorMatch[]> {
    const entry = this.index.get(resourceId);
    if (!entry) {
      throw new Error(`Resource not found in index: ${resourceId}`);
    }

    const { limit = 5, minSimilarity = 0.0 } = options;

    // 计算与其他资源的相似度
    const matches: VectorMatch[] = [];

    for (const [otherId, otherEntry] of this.index.entries()) {
      // 跳过自己
      if (otherId === resourceId) {
        continue;
      }

      const similarity = this.cosineSimilarity(entry.embedding, otherEntry.embedding);

      if (similarity >= minSimilarity) {
        const resource = this.resources.get(otherId);
        if (resource) {
          matches.push({
            resourceId: otherId,
            similarity,
            resource,
          });
        }
      }
    }

    // 按相似度降序排序并限制结果数量
    matches.sort((a, b) => b.similarity - a.similarity);
    return matches.slice(0, limit);
  }

  /**
   * 计算余弦相似度
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * 将资源转换为文本表示（用于生成嵌入）
   */
  private resourceToText(resource: Resource): string {
    return `${resource.name}. ${resource.description}. 标签: ${resource.tags.join(', ')}. 策展人笔记: ${resource.curatorNote}`;
  }

  /**
   * 获取索引大小
   */
  getIndexSize(): number {
    return this.index.size;
  }

  /**
   * 清空索引
   */
  clearIndex(): void {
    this.index.clear();
    this.resources.clear();
  }
}
