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

/**
 * POST /api/chat
 * 处理聊天请求
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      query,
      filters,
      conversationHistory: _conversationHistory,
    } = body as {
      query: string;
      filters?: SearchFilters;
      conversationHistory?: any[];
    };

    // 验证输入
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // 初始化 RAG 引擎
    const engine = await initializeRAGEngine();

    // 导入增强搜索
    const { enhancedSearch } = await import('@/lib/ai/enhanced-search');

    // 执行增强搜索
    // 注意：我们将 sessionContext 留空或从 body 中获取（如果前端传递了）
    const response = await enhancedSearch(
      query,
      // 这里的 searchFn 必须兼容 enhancedSearch 的要求
      async (q, f) => {
        const results = await (engine as any).hybridSearch.search(q, f || filters, {
          maxResults: filters?.maxResults || 5,
          minSimilarity: 0.3,
        });
        return results;
      },
      (body as any).sessionContext || {},
      {
        maxResults: filters?.maxResults || 5,
      }
    );

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
  } catch (error: any) {
    console.error('❌ Chat API Error:', error);

    // 返回错误信息
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
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
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
