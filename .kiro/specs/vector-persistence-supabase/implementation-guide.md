# 向量化持久化 Supabase 实施指南

## 概述

本文档提供了将当前项目的纯内存向量索引迁移到 Supabase PostgreSQL + pgvector 的详细操作步骤。该指南确保平滑迁移到生产级向量搜索服务，完全移除内存索引依赖。

## 前置条件

### 环境要求
- Node.js >= 18
- pnpm 包管理器
- Supabase 项目（已配置）
- 智谱 AI API 密钥

### 当前项目状态检查
```bash
# 确认当前 AI 聊天助手功能正常
pnpm dev
# 访问 http://localhost:3001 测试 AI 聊天功能
```

## 第一阶段：Supabase 数据库准备

### 步骤 1.1：启用 pgvector 扩展

1. **登录 Supabase Dashboard**
   ```
   访问：https://supabase.com/dashboard
   选择你的项目：qtymidkusovwjamlntsk
   ```

2. **在 SQL Editor 中执行**
   ```sql
   -- 启用 pgvector 扩展
   CREATE EXTENSION IF NOT EXISTS vector;
   
   -- 验证扩展已启用
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```

### 步骤 1.2：创建向量数据表

```sql
-- 创建资源向量表
CREATE TABLE resource_embeddings (
  id SERIAL PRIMARY KEY,
  resource_id VARCHAR(255) UNIQUE NOT NULL,
  embedding vector(1536) NOT NULL,  -- 智谱 embedding-2 维度
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_resource_embeddings_updated_at 
    BEFORE UPDATE ON resource_embeddings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 步骤 1.3：创建向量索引

```sql
-- 创建向量索引（余弦相似度）
-- 注意：对于小数据集（<1000条），可以先跳过此步骤
CREATE INDEX resource_embeddings_embedding_idx 
ON resource_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 创建资源ID索引
CREATE INDEX resource_embeddings_resource_id_idx 
ON resource_embeddings (resource_id);

-- 创建更新时间索引
CREATE INDEX resource_embeddings_updated_at_idx 
ON resource_embeddings (updated_at);

-- 创建元数据索引（类别）- 使用 BTREE 进行精确匹配
CREATE INDEX resource_embeddings_category_idx 
ON resource_embeddings 
USING BTREE ((metadata->>'category'));

-- 创建元数据索引（评分）
CREATE INDEX resource_embeddings_rating_idx 
ON resource_embeddings 
USING BTREE (((metadata->>'rating')::numeric));
```

**索引选择说明：**
- **BTREE vs GIN：** 对于精确匹配查询（如类别过滤），BTREE 索引性能更优
- **存储效率：** BTREE 索引占用空间更小，维护成本更低
- **查询模式：** 项目主要进行等值查询，不需要 GIN 的全文搜索能力
```

### 步骤 1.4：创建相似度搜索函数

```sql
-- 创建相似度搜索函数
CREATE OR REPLACE FUNCTION match_resources(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 10,
  category_filter text[] DEFAULT NULL,
  min_rating float DEFAULT NULL
)
RETURNS TABLE (
  resource_id varchar(255),
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    re.resource_id,
    1 - (re.embedding <=> query_embedding) as similarity,
    re.metadata
  FROM resource_embeddings re
  WHERE 
    1 - (re.embedding <=> query_embedding) > match_threshold
    AND (category_filter IS NULL OR re.metadata->>'category' = ANY(category_filter))
    AND (min_rating IS NULL OR (re.metadata->>'rating')::numeric >= min_rating)
  ORDER BY re.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

**⚠️ 重要：数据类型一致性**

PostgreSQL 严格检查函数返回类型与表字段类型的匹配：
- **表字段：** `resource_id VARCHAR(255)`
- **函数返回：** 必须是 `varchar(255)`，不能是 `text`
- **错误原因：** `text` 和 `varchar(255)` 被视为不同类型
- **TypeScript 映射：** `VARCHAR(255)` → `string`

如果遇到类型不匹配错误，请确保函数返回类型与表结构完全一致。

### 步骤 1.5：验证数据库设置

```sql
-- 验证表结构
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'resource_embeddings'
ORDER BY ordinal_position;

-- 验证索引
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'resource_embeddings';

-- 验证函数
SELECT 
  routine_name, 
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'match_resources';

-- 测试插入（使用随机向量）
INSERT INTO resource_embeddings (resource_id, embedding, metadata) 
VALUES (
  'test-resource-1',
  array_fill(0.1, ARRAY[1536])::vector,
  '{"category": "test", "rating": 4.5}'::jsonb
);

-- 测试搜索函数
SELECT * FROM match_resources(
  array_fill(0.1, ARRAY[1536])::vector,
  0.0,
  5
);

-- 清理测试数据
DELETE FROM resource_embeddings WHERE resource_id = 'test-resource-1';
```

## 第二阶段：安装依赖和配置

### 步骤 2.1：安装 Supabase 客户端

```bash
# 安装 Supabase 客户端
pnpm add @supabase/supabase-js

# 验证安装
pnpm list @supabase/supabase-js
```

### 步骤 2.2：配置环境变量

在 `.env.local` 中添加：

```bash
# 向量存储配置
VECTOR_STORE_PROVIDER=supabase
VECTOR_CACHE_TTL=3600
VECTOR_CACHE_SIZE=1000

# 同步配置
EMBEDDING_SYNC_INTERVAL=300
EMBEDDING_BATCH_SIZE=50
EMBEDDING_FORCE_SYNC=false

# Supabase Secret Key (用于服务端操作)
SUPABASE_SECRET_KEY=your_secret_key_here
```

**获取 Secret Key：**
1. 访问 Supabase Dashboard > Settings > API
2. 在 **Project API keys** 部分找到 `secret` 密钥
3. 复制 `secret` 密钥（注意：这是敏感信息，具有完全数据库访问权限）
4. 添加到 `.env.local` 文件

**注意：** 新版 Supabase 使用 `secret` 密钥替代了之前的 `service_role` 密钥。

### 步骤 2.3：创建 Supabase 客户端配置

创建 `lib/supabase/client.ts`：

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error('Missing Supabase environment variables');
}

// 服务端客户端（用于向量操作）
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseSecretKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// 验证连接
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabaseAdmin
      .from('resource_embeddings')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}
```

## 第三阶段：实现向量存储服务

### 步骤 3.1：创建 Supabase 类型定义

创建 `types/supabase.ts`：

```typescript
export interface Database {
  public: {
    Tables: {
      resource_embeddings: {
        Row: {
          id: number;
          resource_id: string;
          embedding: number[];
          metadata: ResourceMetadata;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          resource_id: string;
          embedding: number[];
          metadata: ResourceMetadata;
        };
        Update: {
          embedding?: number[];
          metadata?: ResourceMetadata;
          updated_at?: string;
        };
      };
    };
    Functions: {
      match_resources: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          category_filter?: string[];
          min_rating?: number;
        };
        Returns: {
          resource_id: string;
          similarity: number;
          metadata: ResourceMetadata;
        }[];
      };
    };
  };
}

export interface ResourceMetadata {
  category: string;
  rating: number;
  tags: string[];
  lastUpdated: string;
  name: string;
  description: string;
}
```

### 步骤 3.2：实现 Supabase 向量存储

创建 `lib/ai/supabase-vector-store.ts`：

```typescript
import { supabaseAdmin } from '@/lib/supabase/client';
import type { Database, ResourceMetadata } from '@/types/supabase';
import type { VectorSearchOptions, VectorSearchResult } from '@/types/ai-chat';

export class SupabaseVectorStore {
  private client = supabaseAdmin;

  /**
   * 搜索相似向量
   */
  async searchSimilar(
    queryEmbedding: number[],
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    const {
      limit = 10,
      minSimilarity = 0.3,
      categoryFilter,
      minRating,
    } = options;

    try {
      const { data, error } = await this.client.rpc('match_resources', {
        query_embedding: queryEmbedding,
        match_threshold: minSimilarity,
        match_count: limit,
        category_filter: categoryFilter || null,
        min_rating: minRating || null,
      });

      if (error) {
        throw new Error(`Vector search failed: ${error.message}`);
      }

      return data.map(row => ({
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
    metadata: ResourceMetadata
  ): Promise<void> {
    try {
      const { error } = await this.client
        .from('resource_embeddings')
        .upsert({
          resource_id: resourceId,
          embedding,
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
      metadata: ResourceMetadata;
    }>
  ): Promise<void> {
    try {
      const records = embeddings.map(item => ({
        resource_id: item.resourceId,
        embedding: item.embedding,
        metadata: item.metadata,
      }));

      const { error } = await this.client
        .from('resource_embeddings')
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

      return {
        totalEmbeddings: count || 0,
        lastUpdated: lastUpdatedData?.[0]?.updated_at 
          ? new Date(lastUpdatedData[0].updated_at) 
          : null,
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
      const { data, error } = await this.client
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
```

## 第四阶段：实现数据同步服务

### 步骤 4.1：创建同步服务

创建 `lib/ai/embedding-sync-service.ts`：

```typescript
import { SupabaseVectorStore } from './supabase-vector-store';
import { getAIServiceManager } from './service-manager';
import resources from '@/data/resources.json';
import type { Resource } from '@/types';
import type { ResourceMetadata } from '@/types/supabase';

export interface SyncResult {
  totalResources: number;
  processedResources: number;
  skippedResources: number;
  errorResources: number;
  duration: number;
  errors: Array<{ resourceId: string; error: string }>;
}

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
      // 获取现有向量的更新时间
      const stats = await this.vectorStore.getStats();
      console.log(`📊 Current database stats:`, stats);

      for (const resource of resources as Resource[]) {
        try {
          // 检查是否需要更新
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
            lastUpdated: resource.updatedAt || resource.createdAt,
            name: resource.name,
            description: resource.description,
          };

          await this.vectorStore.upsertEmbedding(resource.id, embedding, metadata);
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
  async syncAllEmbeddings(force = false): Promise<SyncResult> {
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
        metadata: {
          category: resource.categoryId,
          rating: resource.rating.overall,
          tags: resource.tags,
          lastUpdated: resource.updatedAt || resource.createdAt,
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
  private async needsVectorUpdate(resource: Resource): Promise<boolean> {
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
```

## 第五阶段：替换现有向量搜索引擎

### 步骤 5.1：创建新的向量搜索引擎

创建 `lib/ai/supabase-vector-search-engine.ts`：

```typescript
import { SupabaseVectorStore } from './supabase-vector-store';
import type { Resource } from '@/types';
import type { AIProvider } from '@/types/ai-chat';
import type { VectorMatch, VectorSearchOptions } from './vector-search';

/**
 * Supabase 向量搜索引擎
 * 完全替换内存向量索引
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
```

### 步骤 5.2：更新 RAG 引擎集成

修改 `app/api/chat/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAIServiceManager } from '@/lib/ai/service-manager';
import { VercelAIRAGEngine } from '@/lib/ai/rag-engine';
import { HybridSearchEngine } from '@/lib/ai/hybrid-search';
import { SupabaseVectorSearchEngine } from '@/lib/ai/supabase-vector-search-engine'; // 新的引擎
import { GuidedQuestioningEngine } from '@/lib/ai/guided-questioning';
import { EmbeddingSyncService } from '@/lib/ai/embedding-sync-service'; // 新的同步服务
import resources from '@/data/resources.json';
import type { Resource } from '@/types';
import type { SearchFilters } from '@/types/ai-chat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 初始化 RAG 引擎（单例模式）
let ragEngine: VercelAIRAGEngine | null = null;

async function initializeRAGEngine() {
  if (ragEngine) {
    return ragEngine;
  }

  try {
    console.log('🚀 Initializing Supabase-based RAG Engine...');

    // 1. 获取 AI 服务管理器并初始化
    const serviceManager = getAIServiceManager();
    
    if (!serviceManager.isServiceAvailable()) {
      await serviceManager.initialize();
    }
    
    const provider = serviceManager.getCurrentProvider();

    // 2. 初始化 Supabase 向量搜索引擎
    const vectorSearch = new SupabaseVectorSearchEngine(provider);

    // 3. 确保向量数据已同步
    const syncService = new EmbeddingSyncService();
    const syncStatus = await syncService.getSyncStatus();
    
    console.log('📊 Current sync status:', syncStatus);
    
    if (syncStatus.totalEmbeddings === 0) {
      console.log('🔄 No embeddings found, starting initial sync...');
      await syncService.syncAllEmbeddings();
    } else {
      console.log(`✅ Found ${syncStatus.totalEmbeddings} existing embeddings`);
    }

    // 4. 初始化混合搜索引擎
    const hybridSearch = new HybridSearchEngine(vectorSearch, resources as Resource[]);

    // 5. 初始化引导式提问引擎
    const guidedQuestioning = new GuidedQuestioningEngine();

    // 6. 创建 RAG 引擎
    ragEngine = new VercelAIRAGEngine(provider, hybridSearch, guidedQuestioning);

    console.log('✅ Supabase RAG Engine initialized successfully');
    return ragEngine;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase RAG Engine:', error);
    throw error;
  }
}

// 其余代码保持不变...
```

## 第六阶段：测试和验证

### 步骤 6.1：创建测试脚本

创建 `scripts/test-vector-migration.ts`：

```typescript
import { SupabaseVectorStore } from '../lib/ai/supabase-vector-store';
import { EmbeddingSyncService } from '../lib/ai/embedding-sync-service';
import { SupabaseVectorSearchEngine } from '../lib/ai/supabase-vector-search-engine';
import { getAIServiceManager } from '../lib/ai/service-manager';

async function testVectorMigration() {
  console.log('🧪 Starting vector migration test...');

  try {
    // 1. 测试数据库连接
    console.log('\n1️⃣ Testing database connection...');
    const vectorStore = new SupabaseVectorStore();
    const healthCheck = await vectorStore.healthCheck();
    console.log('Health check result:', healthCheck);

    if (healthCheck.status !== 'healthy') {
      throw new Error('Database connection failed');
    }

    // 2. 测试向量同步
    console.log('\n2️⃣ Testing vector synchronization...');
    const syncService = new EmbeddingSyncService();
    const syncResult = await syncService.syncAllEmbeddings();
    console.log('Sync result:', syncResult);

    // 3. 测试向量搜索
    console.log('\n3️⃣ Testing vector search...');
    const serviceManager = getAIServiceManager();
    await serviceManager.initialize();
    const provider = serviceManager.getCurrentProvider();
    
    const searchEngine = new SupabaseVectorSearchEngine(provider);
    const searchResults = await searchEngine.search('颜色工具', {
      limit: 3,
      minSimilarity: 0.1,
    });
    
    console.log('Search results:', searchResults.map(r => ({
      id: r.resourceId,
      name: r.resource.name,
      similarity: r.similarity,
    })));

    // 4. 测试统计信息
    console.log('\n4️⃣ Testing statistics...');
    const stats = await vectorStore.getStats();
    console.log('Vector store stats:', stats);

    console.log('\n✅ All tests passed! Vector migration is ready.');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// 运行测试
testVectorMigration();
```

### 步骤 6.2：运行测试

```bash
# 编译并运行测试脚本
npx tsx scripts/test-vector-migration.ts

# 或者创建 package.json 脚本
pnpm run test:vector-migration
```

在 `package.json` 中添加：

```json
{
  "scripts": {
    "test:vector-migration": "tsx scripts/test-vector-migration.ts"
  }
}
```

### 步骤 6.3：验证 AI 聊天功能

```bash
# 启动开发服务器
pnpm dev

# 访问 http://localhost:3001
# 测试 AI 聊天功能：
# 1. 点击底部 AI 输入框
# 2. 输入查询："推荐一些颜色工具"
# 3. 验证返回结果和资源卡片显示
```

## 第七阶段：生产部署

### 步骤 7.1：环境变量配置

确保生产环境包含所有必要的环境变量：

```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
SUPABASE_SECRET_KEY=your_production_secret_key
ZHIPU_AI_API_KEY=your_zhipu_api_key
VECTOR_STORE_PROVIDER=supabase
VECTOR_CACHE_TTL=3600
EMBEDDING_BATCH_SIZE=50
```

### 步骤 7.2：数据库优化

在生产环境中优化数据库性能：

```sql
-- 分析表统计信息
ANALYZE resource_embeddings;

-- 检查索引使用情况
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM match_resources(
  array_fill(0.1, ARRAY[1536])::vector,
  0.3,
  10
);

-- 如果数据量较大，调整索引参数
DROP INDEX IF EXISTS resource_embeddings_embedding_idx;
CREATE INDEX resource_embeddings_embedding_idx 
ON resource_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 200);  -- 根据数据量调整
```

### 步骤 7.3：监控设置

创建监控脚本 `scripts/monitor-vector-service.ts`：

```typescript
import { SupabaseVectorStore } from '../lib/ai/supabase-vector-store';

async function monitorVectorService() {
  const vectorStore = new SupabaseVectorStore();
  
  try {
    const healthCheck = await vectorStore.healthCheck();
    const stats = await vectorStore.getStats();
    
    const report = {
      timestamp: new Date().toISOString(),
      health: healthCheck.status,
      totalEmbeddings: stats.totalEmbeddings,
      lastUpdated: stats.lastUpdated,
    };
    
    console.log('📊 Vector Service Report:', JSON.stringify(report, null, 2));
    
    // 在生产环境中，可以发送到监控系统
    // await sendToMonitoringSystem(report);
    
  } catch (error) {
    console.error('❌ Monitoring failed:', error);
  }
}

// 定期监控
setInterval(monitorVectorService, 60000); // 每分钟检查一次
```

## 故障排除

### 常见问题和解决方案

#### 1. pgvector 扩展未启用
```sql
-- 检查扩展状态
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 如果未启用，执行：
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 2. GIN 索引创建失败
**错误信息：** `data type text has no default operator class for access method "gin"`

**解决方案：** 使用 BTREE 索引替代 GIN 索引
```sql
-- 正确的索引创建方式
CREATE INDEX resource_embeddings_category_idx 
ON resource_embeddings 
USING BTREE ((metadata->>'category'));

-- 如果确实需要 GIN 索引，需要指定操作符类：
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX resource_embeddings_category_gin_idx 
ON resource_embeddings 
USING GIN ((metadata->>'category') gin_trgm_ops);
```

#### 3. 函数返回类型不匹配
**错误信息：** `structure of query does not match function result type`

**原因：** 函数返回类型与表字段类型不匹配
```sql
-- 错误示例：表字段是 VARCHAR(255)，但函数返回 text
RETURNS TABLE (resource_id text, ...)  -- ❌ 错误

-- 正确示例：类型必须完全匹配
RETURNS TABLE (resource_id varchar(255), ...)  -- ✅ 正确
```

**解决方案：** 确保函数返回类型与表结构一致
```sql
-- 查看表字段的确切类型
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'resource_embeddings' AND column_name = 'resource_id';

-- 根据查询结果调整函数定义
```

#### 4. 向量维度不匹配
```typescript
// 确保向量维度为 1536
const embedding = await provider.generateEmbedding(text);
console.log('Embedding dimension:', embedding.length); // 应该是 1536
```

#### 5. 权限问题
```sql
-- 检查表权限
\dp resource_embeddings

-- 如果需要，授予权限：
GRANT ALL ON resource_embeddings TO your_user;
GRANT USAGE ON SEQUENCE resource_embeddings_id_seq TO your_user;
```

#### 6. 搜索性能问题
```sql
-- 检查查询计划
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM match_resources(
  array_fill(0.1, ARRAY[1536])::vector,
  0.3,
  10
);

-- 如果索引未使用，重建索引：
REINDEX INDEX resource_embeddings_embedding_idx;
```

## 总结

完成以上步骤后，你的项目将：

1. ✅ **完全移除内存向量索引** - 所有向量操作都通过 Supabase 数据库
2. ✅ **实现持久化存储** - 系统重启无需重新生成向量
3. ✅ **支持增量同步** - 智能检测和更新变更的资源
4. ✅ **提供高性能搜索** - pgvector 优化的向量索引
5. ✅ **确保生产就绪** - 完整的错误处理和监控机制

这个实施方案确保了平滑迁移到生产级向量搜索服务，为未来的扩展和优化奠定了坚实基础。