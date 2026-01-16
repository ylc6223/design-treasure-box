import { NextRequest, NextResponse } from 'next/server';
import { getAIServiceManager } from '@/lib/ai/service-manager';
import { VercelAIRAGEngine } from '@/lib/ai/rag-engine';
import { HybridSearchEngine } from '@/lib/ai/hybrid-search';
import { VectorSearchEngine } from '@/lib/ai/vector-search';
import { GuidedQuestioningEngine } from '@/lib/ai/guided-questioning';
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
    // 1. 获取 AI 服务管理器并初始化
    const serviceManager = getAIServiceManager();
    
    // 确保服务管理器已初始化
    if (!serviceManager.isServiceAvailable()) {
      await serviceManager.initialize();
    }
    
    const provider = serviceManager.getCurrentProvider();

    // 2. 初始化向量搜索引擎
    const vectorSearch = new VectorSearchEngine(provider);
    await vectorSearch.buildIndex(resources as Resource[]);

    // 3. 初始化混合搜索引擎
    const hybridSearch = new HybridSearchEngine(vectorSearch, resources as Resource[]);

    // 4. 初始化引导式提问引擎
    const guidedQuestioning = new GuidedQuestioningEngine();

    // 5. 创建 RAG 引擎
    ragEngine = new VercelAIRAGEngine(provider, hybridSearch, guidedQuestioning);

    console.log('✅ RAG Engine initialized successfully');
    return ragEngine;
  } catch (error) {
    console.error('❌ Failed to initialize RAG Engine:', error);
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
    const { query, filters, conversationHistory } = body as {
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

    // 生成响应
    const response = await engine.generateResponse(query, filters, {
      conversationHistory,
      temperature: 0.7,
      maxTokens: 2000,
    });

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        content: response.content,
        searchResults: response.searchResults,
        processingTime: response.processingTime,
        needsClarification: response.needsClarification,
        clarificationQuestions: response.clarificationQuestions,
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
