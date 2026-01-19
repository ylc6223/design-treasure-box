import { SupabaseVectorStore } from './supabase-vector-store';
import { getAIServiceManager } from './service-manager';
import resources from '@/data/resources.json';
import type { Resource } from '@/types';
import type { ResourceMetadata } from '@/types/supabase-vector';

export interface SyncResult {
  totalResources: number;
  processedResources: number;
  skippedResources: number;
  errorResources: number;
  duration: number;
  errors: Array<{ resourceId: string; error: string }>;
}

/**
 * 向量同步服务
 * 负责将资源数据同步到 Supabase 向量数据库
 */
export class EmbeddingSyncService {
  private vectorStore = new SupabaseVectorStore();
  private aiProvider = getAIServiceManager().getCurrentProvider();

  /**
   * 增量同步向量数据
   */
  async syncIncrementalEmbeddings(): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      totalResources: resources.length,
      processedResources: 0,
      skippedResources: 0,
      errorResources: 0,
      duration: 0,
      errors: [],
    };

    console.log(`🔄 Starting incremental sync for ${resources.length} resources...`);

    try {
      // 获取现有向量的统计信息
      const stats = await this.vectorStore.getStats();
      console.log(`📊 Current database stats:`, stats);

      for (const resource of resources as Resource[]) {
        try {
          // 检查是否需要更新（简化版：总是更新）
          const needsUpdate = await this.needsVectorUpdate(resource);
          
          if (!needsUpdate) {
            result.skippedResources++;
            continue;
          }

          // 生成向量
          const text = this.resourceToText(resource);
          const embedding = await this.aiProvider.generateEmbedding(text);

          // 存储向量
          const metadata: ResourceMetadata = {
            category: resource.categoryId,
            rating: resource.rating.overall,
            tags: resource.tags,
            lastUpdated: resource.createdAt,
            name: resource.name,
            description: resource.description,
          };

          await this.vectorStore.upsertEmbedding(resource.id, embedding, text, metadata);
          result.processedResources++;

          console.log(`✅ Synced: ${resource.name} (${resource.id})`);
        } catch (error) {
          result.errorResources++;
          result.errors.push({
            resourceId: resource.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          console.error(`❌ Failed to sync ${resource.id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Sync service error:', error);
      throw error;
    }

    result.duration = Date.now() - startTime;
    console.log(`🎉 Sync completed:`, result);
    return result;
  }

  /**
   * 全量同步（强制更新所有向量）
   */
  async syncAllEmbeddings(): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      totalResources: resources.length,
      processedResources: 0,
      skippedResources: 0,
      errorResources: 0,
      duration: 0,
      errors: [],
    };

    console.log(`🔄 Starting full sync for ${resources.length} resources...`);

    try {
      // 批量生成向量
      const texts = (resources as Resource[]).map(r => this.resourceToText(r));
      const embeddings = await this.aiProvider.generateEmbeddings(texts);

      // 准备批量数据
      const batchData = (resources as Resource[]).map((resource, index) => ({
        resourceId: resource.id,
        embedding: embeddings[index],
        content: texts[index], // 添加content字段
        metadata: {
          category: resource.categoryId,
          rating: resource.rating.overall,
          tags: resource.tags,
          lastUpdated: resource.createdAt,
          name: resource.name,
          description: resource.description,
        } as ResourceMetadata,
      }));

      // 批量存储
      await this.vectorStore.batchUpsertEmbeddings(batchData);
      result.processedResources = resources.length;

      console.log(`✅ Batch sync completed for ${resources.length} resources`);
    } catch (error) {
      console.error('❌ Full sync error:', error);
      result.errorResources = resources.length;
      result.errors.push({
        resourceId: 'batch',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    result.duration = Date.now() - startTime;
    console.log(`🎉 Full sync completed:`, result);
    return result;
  }

  /**
   * 检查资源是否需要向量更新
   */
  private async needsVectorUpdate(_resource: Resource): Promise<boolean> {
    // 简化版：总是返回 true 进行更新
    // 在生产环境中，这里应该检查资源的更新时间
    return true;
  }

  /**
   * 将资源转换为文本（用于向量化）
   */
  private resourceToText(resource: Resource): string {
    return `${resource.name}. ${resource.description}. 标签: ${resource.tags.join(', ')}. 策展人笔记: ${resource.curatorNote}`;
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus() {
    const stats = await this.vectorStore.getStats();
    return {
      totalEmbeddings: stats.totalEmbeddings,
      lastSyncTime: stats.lastUpdated,
      isHealthy: (await this.vectorStore.healthCheck()).status === 'healthy',
    };
  }
}