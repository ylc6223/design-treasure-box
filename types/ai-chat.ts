import { z } from 'zod';

// AI能力定义
export const AICapabilitiesSchema = z.object({
  chat: z.boolean(),
  streaming: z.boolean(),
  embedding: z.boolean(),
  functionCalling: z.boolean(),
  maxTokens: z.number(),
  supportedLanguages: z.array(z.string()),
});

export type AICapabilities = z.infer<typeof AICapabilitiesSchema>;

// 聊天消息类型
export const ChatMessageSchema = z.object({
  id: z.string(),
  type: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.date(),
  resources: z.array(z.any()).optional(), // 将在后续定义ResourceRecommendation
  clarificationQuestions: z.array(z.string()).optional(),
  searchMetadata: z.object({
    query: z.string(),
    filters: z.any(), // 将在后续定义SearchFilters
    resultCount: z.number(),
    processingTime: z.number(),
    searchType: z.enum(['semantic', 'hybrid', 'fallback']),
  }).optional(),
  isLoading: z.boolean().optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// 扩展的聊天消息类型（用于UI组件）
export const ExtendedChatMessageSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  type: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.date(),
  metadata: z.object({
    query: z.string().optional(),
    searchResults: z.array(z.any()).optional(), // SearchResult[]
    clarificationNeeded: z.boolean().optional(),
    resources: z.array(z.any()).optional(), // ResourceRecommendation[]
  }).optional(),
  resources: z.array(z.any()).optional(),
  clarificationQuestions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()),
    aspect: z.enum(['category', 'style', 'audience', 'purpose']),
  })).optional(),
  searchMetadata: z.object({
    query: z.string(),
    filters: z.any(),
    resultCount: z.number(),
    processingTime: z.number(),
    searchType: z.enum(['semantic', 'hybrid', 'fallback']),
  }).optional(),
  isLoading: z.boolean().optional(),
});

export type ExtendedChatMessage = z.infer<typeof ExtendedChatMessageSchema>;

// 聊天选项
export const ChatOptionsSchema = z.object({
  maxTokens: z.number().optional(),
  temperature: z.number().optional(),
  topP: z.number().optional(),
  stream: z.boolean().optional(),
});

export type ChatOptions = z.infer<typeof ChatOptionsSchema>;

// 聊天响应
export const ChatResponseSchema = z.object({
  content: z.string(),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }).optional(),
  finishReason: z.enum(['stop', 'length', 'content_filter', 'function_call']).optional(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

// 聊天流式响应块
export const ChatChunkSchema = z.object({
  content: z.string(),
  isComplete: z.boolean(),
});

export type ChatChunk = z.infer<typeof ChatChunkSchema>;

// AI提供者抽象接口
export interface AIProvider {
  name: string;
  version: string;
  capabilities: AICapabilities;
  
  // 聊天完成
  generateChatCompletion(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  
  // 流式聊天
  streamChatCompletion(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<ChatChunk>;
  
  // 文本嵌入
  generateEmbedding(text: string): Promise<number[]>;
  
  // 批量嵌入
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

// Vercel AI配置
export const VercelAIConfigSchema = z.object({
  provider: z.enum(['zhipu-ai', 'openai', 'anthropic']),
  model: z.string(),
  apiKey: z.string(),
  baseURL: z.string().optional(),
  maxTokens: z.number().optional(),
  temperature: z.number().optional(),
  streamingEnabled: z.boolean(),
});

export type VercelAIConfig = z.infer<typeof VercelAIConfigSchema>;

// 智谱AI配置
export const ZhipuAIConfigSchema = VercelAIConfigSchema.extend({
  provider: z.literal('zhipu-ai'),
  model: z.enum([
    // 最新文本模型（2025）
    'glm-4-plus',      // 推荐：增强版，性能最好
    'glm-4-air',       // 轻量快速版本
    'glm-4-flash',     // 超快速版本
    'glm-4',           // 标准版本
    'glm-4-0520',      // 特定版本
    'glm-3-turbo',     // 旧版本（兼容）
    // 多模态模型
    'glm-4.6v',        // 最新多模态（106B）
    'glm-4.6v-flash',  // 轻量多模态（9B）
    'glm-4.5v',        // 上一代多模态
    'glm-4v-plus',     // 增强多模态
    // 代码专用
    'glm-4.7',         // 代码编程专用
  ]),
  embeddingModel: z.enum(['embedding-2', 'embedding-3']).optional(),
});

export type ZhipuAIConfig = z.infer<typeof ZhipuAIConfigSchema>;

// 环境变量配置
export const AIEnvironmentConfigSchema = z.object({
  ZHIPU_AI_API_KEY: z.string(),
  ZHIPU_AI_BASE_URL: z.string().optional(),
  ZHIPU_AI_MODEL: z.enum([
    'glm-4-plus', 'glm-4-air', 'glm-4-flash', 'glm-4', 
    'glm-4-0520', 'glm-3-turbo', 'glm-4.6v', 'glm-4.6v-flash',
    'glm-4.5v', 'glm-4v-plus', 'glm-4.7'
  ]).optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ENABLE_STREAMING: z.boolean().optional(),
  ENABLE_FUNCTION_CALLING: z.boolean().optional(),
  MAX_CONVERSATION_LENGTH: z.number().optional(),
});

export type AIEnvironmentConfig = z.infer<typeof AIEnvironmentConfigSchema>;

// 运行时配置
export const AIRuntimeConfigSchema = z.object({
  defaultProvider: z.string(),
  fallbackProviders: z.array(z.string()),
  maxRetries: z.number(),
  timeoutMs: z.number(),
  enableCaching: z.boolean(),
  cacheExpiryMs: z.number(),
});

export type AIRuntimeConfig = z.infer<typeof AIRuntimeConfigSchema>;

// 聊天会话
export const ChatSessionSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  messages: z.array(ChatMessageSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  context: z.object({
    lastQuery: z.string().optional(),
    userPreferences: z.any().optional(), // 将在后续定义UserPreferences
    conversationSummary: z.string().optional(),
  }),
});

export type ChatSession = z.infer<typeof ChatSessionSchema>;

// 搜索过滤器
export const SearchFiltersSchema = z.object({
  categories: z.array(z.string()).optional(),
  minRating: z.number().optional(),
  maxResults: z.number().optional(),
  excludeIds: z.array(z.string()).optional(),
});

export type SearchFilters = z.infer<typeof SearchFiltersSchema>;

// 搜索结果
export const SearchResultSchema = z.object({
  resource: z.any(), // 将使用现有的Resource类型
  similarity: z.number(),
  matchReason: z.string(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

// 资源推荐
export const ResourceRecommendationSchema = z.object({
  resource: z.any(), // 将使用现有的Resource类型
  relevanceScore: z.number(),
  matchReason: z.string(),
  matchedAspects: z.array(z.string()),
  confidence: z.number(),
});

export type ResourceRecommendation = z.infer<typeof ResourceRecommendationSchema>;

// 查询分析
export const QueryAnalysisSchema = z.object({
  clarity: z.enum(['clear', 'vague', 'ambiguous']),
  missingAspects: z.array(z.enum(['category', 'style', 'audience', 'purpose'])),
  confidence: z.number(),
});

export type QueryAnalysis = z.infer<typeof QueryAnalysisSchema>;

// 用户偏好
export const UserPreferencesSchema = z.object({
  favoriteCategories: z.array(z.string()),
  stylePreferences: z.array(z.string()),
  audienceType: z.enum(['young', 'professional', 'mixed']),
  qualityThreshold: z.number(),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;