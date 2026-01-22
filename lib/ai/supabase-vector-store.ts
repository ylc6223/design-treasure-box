import { createClient } from '@supabase/supabase-js';
import type {
  VectorDatabase,
  ResourceMetadata,
  VectorSearchOptions,
  VectorSearchResult,
} from '@/types/supabase-vector';

/**
 * Supabase 向量存储服务
 * 负责向量数据的持久化存储和相似度搜索
 */
export class SupabaseVectorStore {
  private client;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // 使用 secret key 创建管理员客户端
    this.client = createClient<VectorDatabase>(supabaseUrl, supabaseSecretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * 搜索相似向量
   */
  async searchSimilar(
    queryEmbedding: number[],
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    const { limit = 10, minSimilarity = 0.3, categoryFilter, minRating } = options;

    try {
      const rpcParams: Record<string, unknown> = {
        query_embedding: queryEmbedding,
        match_threshold: minSimilarity,
        match_count: limit,
      };

      // Only add optional filters if they have values
      if (categoryFilter && categoryFilter.length > 0) {
        rpcParams.category_filter = categoryFilter;
      }
      if (minRating !== undefined) {
        rpcParams.min_rating = minRating;
      }

      // @ts-ignore - Supabase RPC type inference issue
      const { data, error } = await this.client.rpc('match_resources', rpcParams);

      if (error) {
        throw new Error(`Vector search failed: ${error.message}`);
      }

      // @ts-ignore - data type inference issue
      return data.map((row) => ({
        resourceId: row.resource_id,
        similarity: row.similarity,
        metadata: row.metadata,
      }));
    } catch (error) {
      console.error('Supabase vector search error:', error);
      throw error;
    }
  }

  /**
   * 插入或更新向量
   */
  async upsertEmbedding(
    resourceId: string,
    embedding: number[],
    content: string,
    metadata: ResourceMetadata
  ): Promise<void> {
    try {
      const { error } = await this.client
        .from('resource_embeddings')
        // @ts-ignore - Supabase type inference issue
        .upsert({
          resource_id: resourceId,
          embedding,
          content,
          metadata,
        });

      if (error) {
        throw new Error(`Vector upsert failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Supabase vector upsert error:', error);
      throw error;
    }
  }

  /**
   * 批量插入向量
   */
  async batchUpsertEmbeddings(
    embeddings: Array<{
      resourceId: string;
      embedding: number[];
      content: string;
      metadata: ResourceMetadata;
    }>
  ): Promise<void> {
    try {
      const records = embeddings.map((item) => ({
        resource_id: item.resourceId,
        embedding: item.embedding,
        content: item.content,
        metadata: item.metadata,
      }));

      const { error } = await this.client
        .from('resource_embeddings')
        // @ts-ignore - Supabase type inference issue
        .upsert(records);

      if (error) {
        throw new Error(`Batch vector upsert failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Supabase batch vector upsert error:', error);
      throw error;
    }
  }

  /**
   * 删除向量
   */
  async deleteEmbedding(resourceId: string): Promise<void> {
    try {
      const { error } = await this.client
        .from('resource_embeddings')
        .delete()
        .eq('resource_id', resourceId);

      if (error) {
        throw new Error(`Vector delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Supabase vector delete error:', error);
      throw error;
    }
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{
    totalEmbeddings: number;
    lastUpdated: Date | null;
  }> {
    try {
      const { count, error: countError } = await this.client
        .from('resource_embeddings')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw new Error(`Stats count failed: ${countError.message}`);
      }

      const { data: lastUpdatedData, error: lastUpdatedError } = await this.client
        .from('resource_embeddings')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (lastUpdatedError) {
        throw new Error(`Stats last updated failed: ${lastUpdatedError.message}`);
      }

      const data = lastUpdatedData as any;

      return {
        totalEmbeddings: count || 0,
        lastUpdated: data?.[0]?.updated_at ? new Date(data[0].updated_at) : null,
      };
    } catch (error) {
      console.error('Supabase stats error:', error);
      throw error;
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      const { data: _data, error } = await this.client
        .from('resource_embeddings')
        .select('count')
        .limit(1);

      if (error) {
        return {
          status: 'unhealthy',
          message: `Database connection failed: ${error.message}`,
        };
      }

      return {
        status: 'healthy',
        message: 'Database connection successful',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
