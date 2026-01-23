import { NextRequest, NextResponse } from 'next/server';
import { getAIServiceManager } from '@/lib/ai/service-manager';
import { SupabaseVectorSearchEngine } from '@/lib/ai/supabase-vector-search-engine';
import { EmbeddingSyncService } from '@/lib/ai/embedding-sync-service';
import { enhancedSearch } from '@/lib/ai/enhanced-search';
import type { SearchFilters } from '@/types/ai-chat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 初始化向量搜索引擎（单例模式）
let vectorSearchEngine: SupabaseVectorSearchEngine | null = null;

async function initializeVectorSearch() {
  if (vectorSearchEngine) {
    return vectorSearchEngine;
  }

  try {
    // eslint-disable-next-line no-console
    console.log('🚀 Initializing Supabase Vector Search Engine...');

    // 1. 获取 AI 服务管理器并初始化
    const serviceManager = getAIServiceManager();

    if (!serviceManager.isServiceAvailable()) {
      await serviceManager.initialize();
    }

    const provider = serviceManager.getCurrentProvider();

    // 2. 初始化 Supabase 向量搜索引擎
    vectorSearchEngine = new SupabaseVectorSearchEngine(provider);

    // 3. 确保向量数据已同步
    const syncService = new EmbeddingSyncService();
    const syncStatus = await syncService.getSyncStatus();

    // eslint-disable-next-line no-console
    console.log('📊 Current sync status:', syncStatus);

    if (syncStatus.totalEmbeddings === 0) {
      // eslint-disable-next-line no-console
      console.log('🔄 No embeddings found, starting initial sync...');
      await syncService.syncAllEmbeddings();
    } else {
      // eslint-disable-next-line no-console
      console.log(`✅ Found ${syncStatus.totalEmbeddings} existing embeddings`);
    }

    // eslint-disable-next-line no-console
    console.log('✅ Vector Search Engine initialized successfully');
    return vectorSearchEngine;
  } catch (error) {
    console.error('❌ Failed to initialize Vector Search Engine:', error);
    throw error;
  }
}

/**
 * POST /api/chat
 * 处理聊天请求 - 使用新的 enhancedSearch 架构
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, filters, sessionContext } = body as {
      query: string;
      filters?: SearchFilters;
      sessionContext?: Record<string, string>;
    };

    // 验证输入
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // 初始化向量搜索引擎
    const vectorSearch = await initializeVectorSearch();

    // 创建搜索函数
    const searchFn = async (q: string, f?: SearchFilters) => {
      const results = await vectorSearch.search(q, {
        limit: f?.maxResults || filters?.maxResults || 5,
        minSimilarity: 0.3,
        categoryFilter: f?.categories,
        minRating: f?.minRating,
      });

      // 转换为 SearchResult 格式（添加 matchReason）
      return results.map((match) => ({
        resource: match.resource,
        similarity: match.similarity,
        matchReason: `Similarity: ${(match.similarity * 100).toFixed(0)}%`,
      }));
    };

    // 执行增强搜索（包含意图识别、澄清、缓存等）
    const response = await enhancedSearch(query, searchFn, sessionContext || {}, {
      maxResults: filters?.maxResults || 5,
    });

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        content: response.content,
        searchResults: response.searchResults,
        processingTime: response.processingTime,
        needsClarification: response.needsClarification,
        clarificationStrategy: response.clarificationStrategy,
        queryAnalysis: response.queryAnalysis,
        fromCache: response.fromCache,
      },
    });
  } catch (error: unknown) {
    console.error('❌ Chat API Error:', error);

    // 返回错误信息
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat
 * 健康检查
 */
export async function GET() {
  try {
    // 检查环境变量
    const hasApiKey = !!process.env.ZHIPU_AI_API_KEY;
    const model = process.env.ZHIPU_AI_MODEL || 'glm-4-plus';

    return NextResponse.json({
      status: 'ok',
      message: 'Chat API is running',
      config: {
        hasApiKey,
        model,
        streaming: process.env.ENABLE_STREAMING === 'true',
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        status: 'error',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
