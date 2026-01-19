/**
 * RAG (检索增强生成) 引擎
 * 集成Vercel AI SDK进行智能响应生成
 */

import type { AIProvider, SearchFilters, SearchResult, ChatMessage } from '@/types/ai-chat';
import type { HybridSearchEngine } from './hybrid-search';
import type { GuidedQuestioningEngine } from './guided-questioning';

/**
 * RAG响应选项
 */
export interface RAGResponseOptions {
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  conversationHistory?: ChatMessage[];
}

/**
 * RAG响应结果
 */
export interface RAGResponse {
  content: string;
  searchResults: SearchResult[];
  processingTime: number;
  needsClarification?: boolean;
  clarificationQuestions?: Array<{
    question: string;
    options: string[];
    aspect: 'category' | 'style' | 'audience' | 'purpose';
  }>;
}

/**
 * RAG引擎类
 */
export class VercelAIRAGEngine {
  constructor(
    private provider: AIProvider,
    private hybridSearch: HybridSearchEngine,
    private guidedQuestioning: GuidedQuestioningEngine
  ) {}

  /**
   * 生成RAG响应（集成引导式提问）
   */
  async generateResponse(
    query: string,
    filters?: SearchFilters,
    options: RAGResponseOptions = {}
  ): Promise<RAGResponse> {
    const startTime = Date.now();

    // 1. 分析查询清晰度
    const queryAnalysis = this.guidedQuestioning.analyzeQueryClarity(query);

    // 2. 如果需要澄清，返回澄清问题
    if (this.guidedQuestioning.shouldAskForClarification(queryAnalysis)) {
      const clarificationQuestions = this.guidedQuestioning.generateClarificationQuestions(queryAnalysis);
      const processingTime = Date.now() - startTime;

      return {
        content: this.buildClarificationMessage(clarificationQuestions),
        searchResults: [],
        processingTime,
        needsClarification: true,
        clarificationQuestions,
      };
    }

    // 3. 执行混合搜索
    const searchResults = await this.hybridSearch.search(query, filters, {
      maxResults: filters?.maxResults || 5,
      minSimilarity: 0.3,
    });

    // 4. 如果没有搜索结果，提供建议
    if (searchResults.length === 0) {
      const suggestedQueries = this.guidedQuestioning.generateSuggestedQueries(query);
      const processingTime = Date.now() - startTime;

      return {
        content: this.buildNoResultsMessage(query, suggestedQueries),
        searchResults: [],
        processingTime,
        needsClarification: false,
      };
    }

    // 5. 构建上下文（包含对话历史）
    const context = this.buildContext(searchResults);

    // 6. 生成响应
    const messages = this.buildMessages(query, context, options.conversationHistory);
    const response = await this.provider.generateChatCompletion(messages, {
      maxTokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
    });

    const processingTime = Date.now() - startTime;

    return {
      content: response.content,
      searchResults,
      processingTime,
      needsClarification: false,
    };
  }

  /**
   * 流式生成RAG响应（集成引导式提问）
   */
  async *streamResponse(
    query: string,
    filters?: SearchFilters,
    options: RAGResponseOptions = {}
  ): AsyncIterable<{ 
    chunk: string; 
    searchResults?: SearchResult[]; 
    needsClarification?: boolean; 
    clarificationQuestions?: Array<{
      question: string;
      options: string[];
      aspect: 'category' | 'style' | 'audience' | 'purpose';
    }>;
  }> {
    // 1. 分析查询清晰度
    const queryAnalysis = this.guidedQuestioning.analyzeQueryClarity(query);

    // 2. 如果需要澄清，返回澄清问题
    if (this.guidedQuestioning.shouldAskForClarification(queryAnalysis)) {
      const clarificationQuestions = this.guidedQuestioning.generateClarificationQuestions(queryAnalysis);
      yield {
        chunk: this.buildClarificationMessage(clarificationQuestions),
        searchResults: [],
        needsClarification: true,
        clarificationQuestions,
      };
      return;
    }

    // 3. 执行混合搜索
    const searchResults = await this.hybridSearch.search(query, filters, {
      maxResults: filters?.maxResults || 5,
      minSimilarity: 0.3,
    });

    // 先返回搜索结果
    yield { chunk: '', searchResults };

    // 4. 如果没有搜索结果，提供建议
    if (searchResults.length === 0) {
      const suggestedQueries = this.guidedQuestioning.generateSuggestedQueries(query);
      yield {
        chunk: this.buildNoResultsMessage(query, suggestedQueries),
        searchResults: [],
        needsClarification: false,
      };
      return;
    }

    // 5. 构建上下文（包含对话历史）
    const context = this.buildContext(searchResults);

    // 6. 流式生成响应
    const messages = this.buildMessages(query, context, options.conversationHistory);
    const stream = this.provider.streamChatCompletion(messages, {
      maxTokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
    });

    for await (const chunk of stream) {
      yield { chunk: chunk.content };
    }
  }

  /**
   * 处理澄清回答并继续搜索
   */
  async handleClarificationResponse(
    originalQuery: string,
    clarificationAnswer: string,
    filters?: SearchFilters,
    options: RAGResponseOptions = {}
  ): Promise<RAGResponse> {
    // 1. 根据澄清回答优化查询
    const refinedQuery = this.guidedQuestioning.refineQuery(originalQuery, clarificationAnswer);

    // 2. 使用优化后的查询重新生成响应
    return this.generateResponse(refinedQuery, filters, options);
  }

  /**
   * 获取相似资源推荐
   */
  async getSimilarResources(
    resourceId: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    return this.hybridSearch.findSimilarResources(resourceId, limit);
  }

  /**
   * 构建上下文信息
   */
  private buildContext(searchResults: SearchResult[]): string {
    if (searchResults.length === 0) {
      return '没有找到相关资源。';
    }

    const resourceContext = searchResults
      .map((result, index) => {
        const r = result.resource;
        return `${index + 1}. **${r.name}**
   - 类别: ${r.categoryId}
   - 评分: ${r.rating.overall}/5.0 (可用性: ${r.rating.usability}, 美观: ${r.rating.aesthetics}, 更新频率: ${r.rating.updateFrequency}, 免费程度: ${r.rating.freeLevel})
   - 描述: ${r.description}
   - 标签: ${r.tags.join(', ')}
   - 策展人笔记: ${r.curatorNote}
   - 匹配理由: ${result.matchReason}
   - 相似度: ${(result.similarity * 100).toFixed(1)}%`;
      })
      .join('\n\n');

    return resourceContext;
  }

  /**
   * 构建消息列表（支持对话历史）
   */
  private buildMessages(query: string, context: string, conversationHistory?: ChatMessage[]): any[] {
    const systemPrompt = this.buildSystemPrompt(context);
    const messages: any[] = [
      {
        id: 'system-1',
        type: 'system' as const,
        content: systemPrompt,
        timestamp: new Date(),
      },
    ];

    // 添加对话历史（最多保留最近5轮对话）
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10); // 最多10条消息（5轮对话）
      messages.push(...recentHistory.map(msg => ({
        id: msg.id,
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp,
      })));
    }

    // 添加当前查询
    messages.push({
      id: `user-${Date.now()}`,
      type: 'user' as const,
      content: query,
      timestamp: new Date(),
    });

    return messages;
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(context: string): string {
    return `你是设计百宝箱的AI助手，专门帮助用户找到最适合的设计资源。

## 你的职责
1. 基于搜索结果为用户推荐最合适的设计资源
2. 解释为什么推荐这些资源，突出它们的优势
3. 如果用户需求不明确，主动询问澄清问题
4. 提供实用的使用建议和注意事项

## 搜索结果
${context}

## 回答原则
1. **具体推荐**: 明确指出推荐哪些资源，按优先级排序
2. **解释理由**: 说明为什么这些资源适合用户的需求
3. **突出特点**: 强调每个资源的独特优势和适用场景
4. **实用建议**: 提供使用技巧或注意事项
5. **友好语气**: 保持专业但不失亲和力
6. **简洁明了**: 避免冗长，重点突出

## 特殊情况处理
- 如果没有完全匹配的资源，推荐最接近的替代方案
- 如果用户需求模糊，询问具体的使用场景、目标受众或风格偏好
- 如果搜索结果为空，建议用户尝试其他关键词或浏览分类

请基于以上信息回答用户的问题。`;
  }

  /**
   * 构建澄清消息（不再需要，因为前端会处理步骤式显示）
   */
  private buildClarificationMessage(_questions: Array<{
    question: string;
    options: string[];
    aspect: 'category' | 'style' | 'audience' | 'purpose';
  }>): string {
    // 返回一个简单的提示，实际问题由前端步骤式展示
    return '为了更好地帮助您找到合适的资源，我需要了解更多信息。';
  }

  /**
   * 构建无结果消息
   */
  private buildNoResultsMessage(query: string, suggestedQueries: string[]): string {
    return `抱歉，没有找到与"${query}"完全匹配的资源。

您可以尝试以下搜索：
${suggestedQueries.map((q, i) => `${i + 1}. ${q}`).join('\n')}

或者浏览我们的分类页面，发现更多优质设计资源。`;
  }

  /**
   * 分析查询意图
   */
  async analyzeQueryIntent(query: string): Promise<{
    intent: 'search' | 'recommendation' | 'comparison' | 'question';
    confidence: number;
    suggestedFilters?: SearchFilters;
  }> {
    // 简单的意图分析逻辑
    const queryLower = query.toLowerCase();

    // 搜索意图
    if (
      queryLower.includes('找') ||
      queryLower.includes('搜索') ||
      queryLower.includes('有没有') ||
      queryLower.includes('推荐')
    ) {
      return {
        intent: 'search',
        confidence: 0.8,
      };
    }

    // 比较意图
    if (
      queryLower.includes('比较') ||
      queryLower.includes('对比') ||
      queryLower.includes('区别') ||
      queryLower.includes('哪个更好')
    ) {
      return {
        intent: 'comparison',
        confidence: 0.8,
      };
    }

    // 推荐意图
    if (
      queryLower.includes('推荐') ||
      queryLower.includes('建议') ||
      queryLower.includes('适合')
    ) {
      return {
        intent: 'recommendation',
        confidence: 0.8,
      };
    }

    // 默认为问题
    return {
      intent: 'question',
      confidence: 0.6,
    };
  }
}
