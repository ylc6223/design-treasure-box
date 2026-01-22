# AI聊天对话功能实现详解

> 本文档详细说明了设计百宝箱项目的AI聊天对话功能的完整实现，包括前后端交互流程、数据流向、架构设计和关键技术细节。

## 目录

- [系统架构概览](#系统架构概览)
- [前端实现](#前端实现)
- [后端API实现](#后端api实现)
- [RAG引擎实现](#rag引擎实现)
- [向量搜索系统](#向量搜索系统)
- [混合搜索引擎](#混合搜索引擎)
- [引导式提问系统](#引导式提问系统)
- [完整数据流向](#完整数据流向)
- [技术栈和依赖](#技术栈和依赖)

---

## 系统架构概览

### 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端层 (Next.js)                         │
├─────────────────────────────────────────────────────────────────┤
│  - AIChatInterface: 聊天主界面                                   │
│  - AIPromptInput: 悬浮输入框                                     │
│  - useAIChat: 状态管理Hook                                      │
│  - 资源和澄清消息组件                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/JSON
┌─────────────────────────────────────────────────────────────────┐
│                       API层 (Next.js API Routes)                 │
├─────────────────────────────────────────────────────────────────┤
│  - /api/chat: 聊天接口                                           │
│    ├─ POST: 处理聊天请求                                         │
│    └─ GET: 健康检查                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    AI服务层 (AIServiceManager)                   │
├─────────────────────────────────────────────────────────────────┤
│  - AI服务管理器（单例模式）                                      │
│  - 智谱AI提供者（ZhipuAIProvider）                               │
│  - 故障转移和缓存管理                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     RAG引擎层 (VercelAIRAGEngine)                │
├─────────────────────────────────────────────────────────────────┤
│  - 引导式提问引擎（GuidedQuestioningEngine）                     │
│  - 混合搜索引擎（HybridSearchEngine）                            │
│  - 上下文构建和消息生成                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        搜索引擎层                                 │
├─────────────────────────────────────────────────────────────────┤
│  - SupabaseVectorSearchEngine: 向量搜索                         │
│  - 结构化过滤：类别、评分、标签等                                │
│  - 结果合并和权重计算                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      数据存储层                                   │
├─────────────────────────────────────────────────────────────────┤
│  - Supabase PostgreSQL: 向量存储（pgvector）                    │
│  - resource_embeddings表: 1024维向量                            │
│  - resources表: 资源元数据                                       │
│  - EmbeddingSyncService: 向量同步服务                           │
└─────────────────────────────────────────────────────────────────┘
```

### 核心设计模式

1. **单例模式**: `AIServiceManager` 和 `VercelAIRAGEngine` 采用单例模式，确保全局唯一实例
2. **策略模式**: `AIProvider` 接口支持多种AI提供者（智谱AI、OpenAI、Anthropic等）
3. **工厂模式**: `AIProviderFactory` 负责创建和管理AI提供者实例
4. **RAG模式**: 检索增强生成，结合向量搜索和AI生成

---

## 前端实现

### 核心组件架构

#### 1. AIChatInterface（聊天主界面）

**位置**: `components/ai-chat-interface.tsx`

**功能**:

- 右侧滑出面板设计（桌面端固定宽度，移动端全屏）
- 消息列表展示（用户消息、AI响应、资源卡片、澄清问题）
- 实时加载状态和动画效果（使用 Framer Motion）
- 支持消息历史持久化（localStorage）

**关键特性**:

```typescript
// 响应式布局
const isMobile = useMediaQuery('(max-width: 768px)');

// 消息类型支持
type ExtendedChatMessage = {
  id: string;
  sessionId: string;
  type: 'user' | 'assistant' | 'clarification' | 'resource';
  content: string;
  timestamp: Date;
  resources?: Resource[]; // 推荐的资源列表
  clarificationQuestions?: ClarificationQuestion[]; // 澄清问题
  searchMetadata?: SearchMetadata; // 搜索元数据
  isLoading?: boolean;
};
```

**UI/UX特点**:

- 平滑的打开/关闭动画
- 消息自动滚动到底部
- 资源卡片交互（点击查看、收藏）
- 澄清问题快速回复按钮
- 加载骨架屏和空状态处理

#### 2. AIPromptInput（悬浮输入框）

**位置**: `components/ai-prompt-input.tsx`

**功能**:

- 固定在页面底部的悬浮输入框
- 滚动时自动隐藏，停止滚动后延迟显示（500ms）
- 当聊天面板打开时自动隐藏
- 支持触发聊天对话

**实现逻辑**:

```typescript
// 滚动检测逻辑
useEffect(() => {
  let scrollTimeout: NodeJS.Timeout;

  const handleScroll = () => {
    setIsScrolling(true);
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      setIsScrolling(false);
    }, 500);
  };

  window.addEventListener('scroll', handleScroll);
  return () => {
    window.removeEventListener('scroll', handleScroll);
    clearTimeout(scrollTimeout);
  };
}, []);
```

#### 3. useAIChat Hook（状态管理）

**位置**: `hooks/use-ai-chat.ts`

**职责**:

- 管理聊天会话状态（打开/关闭）
- 管理消息列表
- 本地存储持久化
- 限制最大消息数量（50条）

**核心方法**:

```typescript
export function useAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>('default');

  // 打开聊天（支持初始查询）
  const openChat = useCallback((initialQuery?: string) => {
    setIsOpen(true);
    if (initialQuery && messages.length === 0) {
      setMessages([{ id: `user-${Date.now()}`, type: 'user', content: initialQuery, ... }]);
    }
  }, [messages.length, sessionId]);

  // 添加消息
  const addMessage = useCallback((message: ExtendedChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // 清空消息
  const clearMessages = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { isOpen, messages, sessionId, openChat, closeChat, addMessage, clearMessages };
}
```

**存储结构**:

```typescript
interface ChatSession {
  id: string; // 会话ID
  messages: ChatMessage[]; // 消息列表
  createdAt: Date;
  updatedAt: Date;
  context: Record<string, any>;
}

// 存储键
const STORAGE_KEY = 'ai-chat-session';
```

#### 4. LayoutWrapper（布局集成）

**位置**: `components/layout-wrapper.tsx`

**功能**:

- 将AI聊天功能集成到主布局中
- 管理聊天界面的打开/关闭状态
- 处理从底部输入框触发聊天对话的逻辑

### 前端数据流

```
用户输入 → AIPromptInput/AIChatInterface
    ↓
useAIChat.addMessage() - 添加用户消息到状态
    ↓
fetch(/api/chat) - 发送API请求
    ↓
等待响应...
    ↓
接收响应 { content, searchResults, needsClarification, ... }
    ↓
useAIChat.addMessage() - 添加AI响应到状态
    ↓
组件重新渲染，显示AI消息和推荐资源
    ↓
localStorage 自动保存会话
```

### 消息类型处理

前端根据消息类型渲染不同的UI组件：

| 消息类型        | 渲染组件               | 说明                       |
| --------------- | ---------------------- | -------------------------- |
| `user`          | 用户消息气泡           | 显示用户输入               |
| `assistant`     | AI消息气泡             | 显示AI回复文本             |
| `clarification` | `ClarificationMessage` | 显示澄清问题和快速回复按钮 |
| `resource`      | `ResourceMessage`      | 显示推荐资源卡片列表       |

---

## 后端API实现

### API路由: /api/chat

**位置**: `app/api/chat/route.ts`

**运行时配置**:

```typescript
export const runtime = 'nodejs'; // 使用Node.js运行时
export const dynamic = 'force-dynamic'; // 强制动态渲染
```

#### POST方法: 处理聊天请求

**请求格式**:

```typescript
POST /api/chat
Content-Type: application/json

{
  "query": "用户查询内容",
  "filters": {
    "categories": ["css-frameworks", "colors"],
    "minRating": 4.0,
    "maxResults": 5,
    "excludeIds": ["resource-1", "resource-2"]
  },
  "conversationHistory": [
    {
      "id": "msg-1",
      "type": "user",
      "content": "之前的消息",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**处理流程**:

```typescript
export async function POST(request: NextRequest) {
  // 1. 解析请求体
  const body = await request.json();
  const { query, filters, conversationHistory } = body;

  // 2. 验证输入
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return NextResponse.json(
      { error: 'Query is required and must be a non-empty string' },
      { status: 400 }
    );
  }

  // 3. 初始化RAG引擎（单例模式）
  const engine = await initializeRAGEngine();

  // 4. 生成响应
  const response = await engine.generateResponse(query, filters, {
    conversationHistory,
    temperature: 0.7,
    maxTokens: 2000,
  });

  // 5. 返回结果
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
}
```

**响应格式**:

```typescript
{
  "success": true,
  "data": {
    "content": "AI生成的回复内容",
    "searchResults": [
      {
        "resource": { /* Resource对象 */ },
        "similarity": 0.85,
        "matchReason": "高度语义相关；匹配标签: 配色, 免费"
      }
    ],
    "processingTime": 1234,  // 毫秒
    "needsClarification": false,
    "clarificationQuestions": []
  }
}
```

#### GET方法: 健康检查

**功能**: 检查API配置状态和可用性

```typescript
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Chat API is running',
    config: {
      hasApiKey: !!process.env.ZHIPU_AI_API_KEY,
      model: process.env.ZHIPU_AI_MODEL || 'glm-4-plus',
      streaming: process.env.ENABLE_STREAMING === 'true',
    },
  });
}
```

### RAG引擎初始化

**单例模式实现**:

```typescript
let ragEngine: VercelAIRAGEngine | null = null;

async function initializeRAGEngine() {
  if (ragEngine) {
    return ragEngine; // 返回已存在的实例
  }

  try {
    // 1. 获取AI服务管理器并初始化
    const serviceManager = getAIServiceManager();
    if (!serviceManager.isServiceAvailable()) {
      await serviceManager.initialize();
    }
    const provider = serviceManager.getCurrentProvider();

    // 2. 初始化Supabase向量搜索引擎
    const vectorSearch = new SupabaseVectorSearchEngine(provider);

    // 3. 确保向量数据已同步
    const syncService = new EmbeddingSyncService();
    const syncStatus = await syncService.getSyncStatus();

    if (syncStatus.totalEmbeddings === 0) {
      console.log('🔄 No embeddings found, starting initial sync...');
      await syncService.syncAllEmbeddings();
    }

    // 4. 初始化混合搜索引擎
    const hybridSearch = new HybridSearchEngine(vectorSearch, resources);

    // 5. 初始化引导式提问引擎
    const guidedQuestioning = new GuidedQuestioningEngine();

    // 6. 创建RAG引擎
    ragEngine = new VercelAIRAGEngine(provider, hybridSearch, guidedQuestioning);

    return ragEngine;
  } catch (error) {
    console.error('❌ Failed to initialize RAG Engine:', error);
    throw error;
  }
}
```

---

## RAG引擎实现

### VercelAIRAGEngine 核心类

**位置**: `lib/ai/rag-engine.ts`

**RAG（检索增强生成）流程**:

```
用户查询
    ↓
1. 引导式提问引擎分析查询清晰度
    ↓
2. 是否需要澄清？
    ├─ 是 → 生成澄清问题 → 返回给用户
    └─ 否 ↓
3. 执行混合搜索（向量 + 结构化）
    ↓
4. 是否有结果？
    ├─ 否 → 生成建议查询 → 返回给用户
    └─ 是 ↓
5. 构建上下文（搜索结果 + 对话历史）
    ↓
6. AI生成最终响应
    ↓
7. 返回完整结果
```

#### 主要方法

**1. generateResponse(): 生成RAG响应**

```typescript
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
    return {
      content: this.buildClarificationMessage(clarificationQuestions),
      searchResults: [],
      processingTime: Date.now() - startTime,
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
    return {
      content: this.buildNoResultsMessage(query, suggestedQueries),
      searchResults: [],
      processingTime: Date.now() - startTime,
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

  return {
    content: response.content,
    searchResults,
    processingTime: Date.now() - startTime,
    needsClarification: false,
  };
}
```

**2. buildContext(): 构建上下文信息**

```typescript
private buildContext(searchResults: SearchResult[]): string {
  const resourceContext = searchResults
    .map((result, index) => {
      const r = result.resource;
      return `${index + 1}. **${r.name}**
   - 类别: ${r.categoryId}
   - 评分: ${r.rating.overall}/5.0
   - 描述: ${r.description}
   - 标签: ${r.tags.join(', ')}
   - 策展人笔记: ${r.curatorNote}
   - 匹配理由: ${result.matchReason}
   - 相似度: ${(result.similarity * 100).toFixed(1)}%`;
    })
    .join('\n\n');

  return resourceContext;
}
```

**3. buildMessages(): 构建消息列表（支持对话历史）**

```typescript
private buildMessages(query: string, context: string, conversationHistory?: ChatMessage[]): any[] {
  const systemPrompt = this.buildSystemPrompt(context);
  const messages: any[] = [
    {
      id: 'system-1',
      type: 'system',
      content: systemPrompt,
      timestamp: new Date(),
    },
  ];

  // 添加对话历史（最多保留最近5轮对话）
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-10);
    messages.push(...recentHistory);
  }

  // 添加当前查询
  messages.push({
    id: `user-${Date.now()}`,
    type: 'user',
    content: query,
    timestamp: new Date(),
  });

  return messages;
}
```

**4. buildSystemPrompt(): 构建系统提示词**

```typescript
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

请基于以上信息回答用户的问题。`;
}
```

---

## 向量搜索系统

### SupabaseVectorSearchEngine

**位置**: `lib/ai/supabase-vector-search-engine.ts`

**功能**: 使用Supabase的pgvector扩展进行向量相似度搜索

#### 数据库Schema

```sql
CREATE TABLE resource_embeddings (
  id SERIAL PRIMARY KEY,
  resource_id VARCHAR(255) UNIQUE NOT NULL,
  embedding vector(1024) NOT NULL,      -- 1024维向量
  content TEXT NOT NULL,                -- 资源文本内容
  metadata JSONB NOT NULL DEFAULT '{}', -- 元数据（类别、标签等）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 向量相似度匹配函数
CREATE OR REPLACE FUNCTION match_resources(
  query_embedding vector(1024),
  category_filter TEXT DEFAULT NULL,
  min_rating FLOAT DEFAULT NULL,
  match_limit INT DEFAULT 10
)
RETURNS TABLE(
  id INT,
  resource_id VARCHAR,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    re.id,
    re.resource_id,
    1 - (re.embedding <=> query_embedding) AS similarity
  FROM resource_embeddings re
  WHERE
    (category_filter IS NULL OR re.metadata->>'categoryId' = category_filter)
    AND (min_rating IS NULL OR (re.metadata->>'rating')::FLOAT >= min_rating)
  ORDER BY re.embedding <=> query_embedding
  LIMIT match_limit;
END;
$$ LANGUAGE plpgsql;
```

#### 向量生成和同步

**EmbeddingSyncService** 负责将资源转换为向量并存储到数据库：

```typescript
class EmbeddingSyncService {
  async syncAllEmbeddings(): Promise<void> {
    // 1. 获取所有资源
    const resources = await this.fetchAllResources();

    // 2. 生成向量
    for (const resource of resources) {
      const content = this.buildResourceContent(resource);
      const embedding = await this.generateEmbedding(content);

      // 3. 存储到数据库
      await this.upsertEmbedding(resource.id, embedding, content, {
        categoryId: resource.categoryId,
        tags: resource.tags,
        rating: resource.rating.overall,
      });
    }
  }

  private buildResourceContent(resource: Resource): string {
    return `${resource.name}
${resource.description}
类别: ${resource.categoryId}
标签: ${resource.tags.join(', ')}
策展人笔记: ${resource.curatorNote}`;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const provider = this.getAIProvider();
    return provider.generateEmbedding(text);
  }
}
```

#### 向量搜索实现

```typescript
async search(
  query: string,
  options: {
    limit?: number;
    minSimilarity?: number;
    categoryFilter?: string[];
    minRating?: number;
  } = {}
): Promise<VectorMatch[]> {
  // 1. 生成查询向量
  const queryEmbedding = await this.provider.generateEmbedding(query);

  // 2. 执行向量相似度搜索
  const matches = await this.supabase.rpc('match_resources', {
    query_embedding: JSON.stringify(queryEmbedding),
    category_filter: options.categoryFilter?.[0] || null,
    min_rating: options.minRating || null,
    match_limit: options.limit || 10,
  });

  // 3. 过滤低于最小相似度的结果
  const filteredMatches = matches.filter(
    m => m.similarity >= (options.minSimilarity || 0.0)
  );

  // 4. 获取完整的资源信息
  return Promise.all(
    filteredMatches.map(async match => {
      const resource = await this.getResourceById(match.resource_id);
      return {
        resource,
        similarity: match.similarity,
      };
    })
  );
}
```

---

## 混合搜索引擎

### HybridSearchEngine

**位置**: `lib/ai/hybrid-search.ts`

**策略**: 结合向量搜索（语义相似度）和结构化过滤（精确匹配），提供更准确的搜索结果

#### 搜索权重配置

```typescript
interface HybridSearchOptions {
  vectorWeight?: number; // 向量搜索权重（默认0.7）
  structuredWeight?: number; // 结构化过滤权重（默认0.3）
  maxResults?: number; // 最大结果数
  minSimilarity?: number; // 最小相似度
}
```

#### 搜索流程

```typescript
async search(
  query: string,
  filters?: SearchFilters,
  options: HybridSearchOptions = {}
): Promise<SearchResult[]> {
  const {
    vectorWeight = 0.7,      // 70% 权重给向量搜索
    structuredWeight = 0.3,  // 30% 权重给结构化过滤
  } = options;

  // 1. 向量搜索（语义相似度）
  const vectorMatches = await this.vectorSearch.search(query, {
    limit: maxResults * 2,
    minSimilarity,
    categoryFilter: filters?.categories,
    minRating: filters?.minRating,
  });

  // 2. 结构化过滤（精确匹配）
  const filteredResources = this.structuredFilter(this.allResources, filters);

  // 3. 合并结果（加权计算）
  const combinedResults = this.combineResults(
    vectorMatches,
    filteredResources,
    vectorWeight,
    structuredWeight
  );

  // 4. 排序并限制结果数量
  combinedResults.sort((a, b) => b.similarity - a.similarity);

  // 5. 生成匹配理由
  return combinedResults.map(result => ({
    ...result,
    matchReason: this.generateMatchReason(result, query, filters),
  }));
}
```

#### 结构化过滤

```typescript
private structuredFilter(resources: Resource[], filters?: SearchFilters): Resource[] {
  let filtered = [...resources];

  // 类别过滤
  if (filters?.categories && filters.categories.length > 0) {
    filtered = filtered.filter(r => filters.categories!.includes(r.categoryId));
  }

  // 评分过滤
  if (filters?.minRating !== undefined) {
    filtered = filtered.filter(r => r.rating.overall >= filters.minRating!);
  }

  // 排除ID过滤
  if (filters?.excludeIds && filters.excludeIds.length > 0) {
    filtered = filtered.filter(r => !filters.excludeIds!.includes(r.id));
  }

  return filtered;
}
```

#### 结果合并策略

```typescript
private combineResults(
  vectorMatches: VectorMatch[],
  filteredResources: Resource[],
  vectorWeight: number,
  structuredWeight: number
): SearchResult[] {
  const resultMap = new Map<string, SearchResult>();

  // 添加向量搜索结果（应用向量权重）
  for (const match of vectorMatches) {
    resultMap.set(match.resourceId, {
      resource: match.resource,
      similarity: match.similarity * vectorWeight,
      matchReason: '',
    });
  }

  // 增强结构化过滤匹配的资源得分
  const filteredIds = new Set(filteredResources.map(r => r.id));
  for (const [id, result] of resultMap.entries()) {
    if (filteredIds.has(id)) {
      result.similarity += structuredWeight;
    }
  }

  // 添加仅在结构化过滤中出现的资源
  for (const resource of filteredResources) {
    if (!resultMap.has(resource.id)) {
      resultMap.set(resource.id, {
        resource,
        similarity: structuredWeight,
        matchReason: '',
      });
    }
  }

  return Array.from(resultMap.values());
}
```

#### 匹配理由生成

```typescript
private generateMatchReason(result: SearchResult, query: string, filters?: SearchFilters): string {
  const reasons: string[] = [];

  // 语义匹配
  if (result.similarity > 0.7) {
    reasons.push('高度语义相关');
  } else if (result.similarity > 0.5) {
    reasons.push('语义相关');
  }

  // 评分匹配
  if (result.resource.rating.overall >= 4.5) {
    reasons.push('高评分资源');
  }

  // 类别匹配
  if (filters?.categories?.includes(result.resource.categoryId)) {
    reasons.push('符合类别筛选');
  }

  // 标签匹配
  const queryLower = query.toLowerCase();
  const matchedTags = result.resource.tags.filter(tag =>
    queryLower.includes(tag.toLowerCase()) ||
    tag.toLowerCase().includes(queryLower)
  );
  if (matchedTags.length > 0) {
    reasons.push(`匹配标签: ${matchedTags.join(', ')}`);
  }

  // 精选资源
  if (result.resource.isFeatured) {
    reasons.push('精选推荐');
  }

  return reasons.length > 0 ? reasons.join('；') : '符合搜索条件';
}
```

---

## 引导式提问系统

### GuidedQuestioningEngine

**位置**: `lib/ai/guided-questioning.ts`

**功能**: 分析用户查询的清晰度，在查询模糊时生成澄清问题

#### 查询分析维度

```typescript
interface QueryAnalysis {
  clarity: 'clear' | 'vague' | 'ambiguous'; // 清晰度级别
  missingAspects: ('category' | 'style' | 'audience' | 'purpose')[]; // 缺失的方面
  confidence: number; // 置信度（0-1）
}
```

#### 分析逻辑

```typescript
analyzeQueryClarity(query: string): QueryAnalysis {
  const queryLower = query.toLowerCase().trim();

  // 检查查询长度
  if (queryLower.length < 3) {
    return {
      clarity: 'vague',
      missingAspects: ['category', 'style', 'audience', 'purpose'],
      confidence: 0.9,
    };
  }

  const missingAspects: ('category' | 'style' | 'audience' | 'purpose')[] = [];

  // 检查是否包含类别信息
  if (!this.hasCategory(queryLower)) {
    missingAspects.push('category');
  }

  // 检查是否包含风格信息
  if (!this.hasStyle(queryLower)) {
    missingAspects.push('style');
  }

  // 检查是否包含受众信息
  if (!this.hasAudience(queryLower)) {
    missingAspects.push('audience');
  }

  // 检查是否包含目的信息
  if (!this.hasPurpose(queryLower)) {
    missingAspects.push('purpose');
  }

  // 判断清晰度
  let clarity: 'clear' | 'vague' | 'ambiguous';
  if (missingAspects.length === 0) {
    clarity = 'clear';
  } else if (missingAspects.length >= 3) {
    clarity = 'vague';
  } else {
    clarity = 'ambiguous';
  }

  // 计算置信度
  const confidence = this.calculateConfidence(queryLower, missingAspects.length);

  return { clarity, missingAspects, confidence };
}
```

#### 关键词检测

```typescript
// 类别关键词
private hasCategory(query: string): boolean {
  const categoryKeywords = [
    '配色', '颜色', 'color',
    'css', '样式', '框架',
    '字体', 'font', '文字',
    '图标', 'icon',
    '灵感', '设计', 'inspiration',
    '网站', 'website', '网页',
    'ui', '组件', 'component',
    '样机', 'mockup',
  ];
  return categoryKeywords.some(keyword => query.includes(keyword));
}

// 风格关键词
private hasStyle(query: string): boolean {
  const styleKeywords = [
    '简洁', '简约', '极简', 'minimal',
    '现代', 'modern',
    '复古', 'vintage', 'retro',
    '扁平', 'flat',
    '立体', '3d',
    '手绘', 'hand-drawn',
    '专业', 'professional',
    '可爱', 'cute',
    '优雅', 'elegant',
    '炫酷', 'cool',
  ];
  return styleKeywords.some(keyword => query.includes(keyword));
}

// 受众关键词
private hasAudience(query: string): boolean {
  const audienceKeywords = [
    '新手', '初学者', 'beginner',
    '专业', 'professional', '高级',
    '学生', 'student',
    '开发者', 'developer', '程序员',
    '设计师', 'designer',
    '年轻', 'young',
    '企业', 'enterprise', '商业',
  ];
  return audienceKeywords.some(keyword => query.includes(keyword));
}

// 目的关词
private hasPurpose(query: string): boolean {
  const purposeKeywords = [
    '学习', 'learn', '教程',
    '项目', 'project',
    '工作', 'work',
    '练习', 'practice',
    '参考', 'reference',
    '快速', 'quick', '快捷',
    '详细', 'detailed',
    '免费', 'free',
    '商用', 'commercial',
  ];
  return purposeKeywords.some(keyword => query.includes(keyword));
}
```

#### 澄清问题生成

```typescript
generateClarificationQuestions(analysis: QueryAnalysis): Array<{
  question: string;
  options: string[];
  aspect: 'category' | 'style' | 'audience' | 'purpose';
}> {
  const questions = [];

  for (const aspect of analysis.missingAspects) {
    const questionData = this.getQuestionForAspect(aspect);
    if (questionData) {
      questions.push(questionData);
    }
  }

  // 限制问题数量，避免过多
  return questions.slice(0, 3);
}

private getQuestionForAspect(aspect: string): { question: string; options: string[] } | null {
  const questionData = {
    category: {
      question: '您需要哪个类别的资源？',
      options: [
        '我需要配色工具',
        '我需要CSS框架或模板',
        '我需要字体资源',
        '我需要图标库',
        '我需要设计灵感',
        '我需要UI组件或工具包',
      ],
    },
    style: {
      question: '您偏好什么风格的设计？',
      options: [
        '我偏好简约/极简风格',
        '我偏好现代/时尚风格',
        '我偏好复古/经典风格',
        '我偏好专业/商务风格',
        '我偏好创意/个性风格',
      ],
    },
    audience: {
      question: '这个资源主要面向什么人群？',
      options: [
        '主要面向新手/初学者',
        '主要面向专业设计师',
        '主要面向开发者/程序员',
        '主要面向学生',
        '主要面向企业/商业用途',
      ],
    },
    purpose: {
      question: '您使用这个资源的主要目的是什么？',
      options: [
        '用于学习和练习',
        '用于实际项目开发',
        '用于快速参考和灵感',
        '需要免费商用',
        '需要详细的文档和教程',
      ],
    },
  };

  return questionData[aspect] || null;
}
```

#### 是否需要澄清

```typescript
shouldAskForClarification(analysis: QueryAnalysis): boolean {
  // 只有在查询非常模糊（缺少所有方面或几乎所有方面）且置信度高时才需要澄清
  if (analysis.clarity === 'vague' && analysis.missingAspects.length >= 4 && analysis.confidence > 0.8) {
    return true;
  }

  // 如果查询太短且缺少多个方面，需要澄清
  if (analysis.clarity === 'vague' && analysis.confidence > 0.85) {
    return true;
  }

  return false;
}
```

---

## 完整数据流向

### 端到端流程图

```
┌──────────────────┐
│  用户输入查询     │
└────────┬─────────┘
         ↓
┌────────────────────────────────────────────────┐
│  前端层                                        │
│  - AIChatInterface / AIPromptInput             │
│  - 接收用户输入                                 │
│  - 显示用户消息                                 │
└────────┬───────────────────────────────────────┘
         ↓ fetch POST /api/chat
┌────────────────────────────────────────────────┐
│  API层 (/api/chat)                             │
│  - 验证输入                                     │
│  - 初始化RAG引擎（单例）                        │
│  - 调用 engine.generateResponse()              │
└────────┬───────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────┐
│  RAG引擎层 (VercelAIRAGEngine)                 │
│  1. 引导式提问引擎分析查询清晰度                │
│     - analyzeQueryClarity()                    │
�     - 检测缺失的方面（类别、风格、受众、目的）   │
└────────┬───────────────────────────────────────┘
         ↓
    是否需要澄清？
    ├─ 是 → 生成澄清问题 → 返回前端 → 显示澄清问题UI
    └─ 否 ↓
┌────────────────────────────────────────────────┐
│  混合搜索引擎 (HybridSearchEngine)              │
│  2. 向量搜索（语义相似度）                      │
│     - SupabaseVectorSearchEngine.search()     │
│     - 查询向量生成（1024维）                    │
│     - pgvector相似度计算（余弦距离）            │
│     - 返回 Top-K 相似资源                       │
│                                                 │
│  3. 结构化过滤（精确匹配）                      │
│     - 类别过滤                                  │
│     - 评分过滤                                  │
│     - 标签匹配                                  │
│     - 排除指定ID                                │
│                                                 │
│  4. 结果合并（加权计算）                        │
│     - 向量权重: 70%                             │
│     - 结构化权重: 30%                           │
│     - 按相似度排序                              │
│     - 生成匹配理由                              │
└────────┬───────────────────────────────────────┘
         ↓
    是否有结果？
    ├─ 否 → 生成建议查询 → 返回前端 → 显示建议
    └─ 是 ↓
┌────────────────────────────────────────────────┐
│  上下文构建                                     │
│  5. buildContext()                              │
│     - 整合搜索结果                              │
│     - 添加资源详情（评分、标签、描述）           │
│     - 生成结构化上下文文本                      │
│                                                 │
│  6. buildMessages()                             │
│     - 构建系统提示词                            │
│     - 添加对话历史（最近10条）                  │
│     - 添加当前查询                              │
└────────┬───────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────┐
│  AI生成层 (ZhipuAIProvider)                     │
│  7. generateChatCompletion()                   │
│     - 调用智谱AI API                            │
│     - 模型: glm-4-plus                          │
│     - maxTokens: 2000                           │
│     - temperature: 0.7                          │
│     - 返回生成的回复文本                        │
└────────┬───────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────┐
│  响应构建                                       │
│  8. 组装完整响应                                │
│     {                                           │
│       content: "AI回复",                        │
│       searchResults: [...],                    │
│       processingTime: 1234,                    │
│       needsClarification: false,               │
│       clarificationQuestions: []               │
│     }                                           │
└────────┬───────────────────────────────────────┘
         ↓ JSON Response
┌────────────────────────────────────────────────┐
│  前端接收响应                                   │
│  9. useAIChat.addMessage()                     │
│     - 添加AI消息到状态                          │
│     - 触发组件重新渲染                          │
│     - 显示AI回复                                │
│     - 显示推荐资源卡片                          │
│                                                 │
│  10. localStorage自动保存                       │
│      - 持久化对话历史                           │
│      - 限制最多50条消息                         │
└────────────────────────────────────────────────┘
```

### 数据流详解

#### 1. 用户输入阶段

**输入来源**:

- 底部悬浮输入框（`AIPromptInput`）
- 聊天面板输入框（`AIChatInterface`）
- 澄清问题快速回复按钮

**输入验证**:

```typescript
// 前端验证
if (!query.trim()) return;

// 后端验证
if (!query || typeof query !== 'string' || query.trim().length === 0) {
  return NextResponse.json(
    { error: 'Query is required and must be a non-empty string' },
    { status: 400 }
  );
}
```

#### 2. API请求阶段

**请求头**:

```typescript
{
  'Content-Type': 'application/json',
}
```

**请求体**:

```typescript
{
  query: string,
  filters?: {
    categories?: string[],
    minRating?: number,
    maxResults?: number,
    excludeIds?: string[],
  },
  conversationHistory?: Array<{
    id: string,
    type: 'user' | 'assistant',
    content: string,
    timestamp: Date,
  }>
}
```

#### 3. RAG处理阶段

**子流程1: 查询清晰度分析**

```typescript
// 输入: "配色"
// 输出: {
//   clarity: 'vague',
//   missingAspects: ['style', 'audience', 'purpose'],
//   confidence: 0.85
// }
```

**子流程2: 向量搜索**

```typescript
// 1. 生成查询向量
queryEmbedding = await provider.generateEmbedding("配色工具");

// 2. pgvector相似度搜索
SELECT * FROM match_resources(
  '[0.1, 0.2, ..., 0.9]',  // 1024维向量
  NULL,                    // 类别过滤
  NULL,                    // 评分过滤
  10                       // 最大结果数
);

// 3. 返回Top-K最相似资源
[
  { resourceId: 'color-1', similarity: 0.92 },
  { resourceId: 'color-2', similarity: 0.87 },
  ...
]
```

**子流程3: 结构化过滤**

```typescript
// 假设过滤器: { categories: ['colors'], minRating: 4.0 }
filteredResources = allResources.filter(
  (r) => r.categoryId === 'colors' && r.rating.overall >= 4.0
);
```

**子流程4: 结果合并**

```typescript
// 向量搜索结果（70%权重）
vectorResults = [
  { id: 'color-1', similarity: 0.92 * 0.7 = 0.644 },
  { id: 'color-2', similarity: 0.87 * 0.7 = 0.609 },
];

// 结构化过滤结果（30%权重）
structuredResults = ['color-1', 'color-3', 'color-5'];

// 合并后的最终得分
finalResults = [
  { id: 'color-1', similarity: 0.644 + 0.3 = 0.944 },  // 同时匹配
  { id: 'color-2', similarity: 0.609 },                // 仅向量匹配
  { id: 'color-3', similarity: 0.3 },                  // 仅结构化匹配
  { id: 'color-5', similarity: 0.3 },                  // 仅结构化匹配
];
```

#### 4. AI生成阶段

**系统提示词构建**:

```
你是设计百宝箱的AI助手，专门帮助用户找到最适合的设计资源。

## 搜索结果
1. **Coolors**
   - 类别: colors
   - 评分: 4.8/5.0
   - 描述: 快速配色方案生成器
   - 标签: 配色, 免费, 快速
   - 匹配理由: 高度语义相关；匹配标签: 配色
   - 相似度: 92.0%

2. **Adobe Color**
   - 类别: colors
   - 评分: 4.7/5.0
   ...
```

**AI模型调用**:

```typescript
// 智谱AI API
response = await zhipuAI.chat.completions.create({
  model: 'glm-4-plus',
  messages: [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: '配色' },
  ],
  max_tokens: 2000,
  temperature: 0.7,
});
```

#### 5. 响应返回阶段

**响应格式**:

```typescript
{
  success: true,
  data: {
    content: "我为您推荐以下配色工具...",
    searchResults: [
      {
        resource: { /* Resource对象 */ },
        similarity: 0.92,
        matchReason: "高度语义相关；匹配标签: 配色, 免费"
      },
      // ...
    ],
    processingTime: 1234,
    needsClarification: false,
    clarificationQuestions: []
  }
}
```

#### 6. 前端展示阶段

**消息类型处理**:

```typescript
// 根据响应类型渲染不同的UI组件
if (needsClarification) {
  // 渲染澄清问题组件
  return <ClarificationMessage questions={clarificationQuestions} />;
} else if (searchResults.length > 0) {
  // 渲染AI回复 + 资源卡片
  return (
    <>
      <AssistantMessage content={content} />
      <ResourceMessage resources={searchResults} />
    </>
  );
} else {
  // 仅渲染AI回复
  return <AssistantMessage content={content} />;
}
```

**状态持久化**:

```typescript
// 自动保存到localStorage
useEffect(() => {
  if (messages.length > 0) {
    const session: ChatSession = {
      id: sessionId,
      messages: messages.slice(-50), // 限制50条
      createdAt: new Date(),
      updatedAt: new Date(),
      context: {},
    };
    localStorage.setItem('ai-chat-session', JSON.stringify(session));
  }
}, [messages, sessionId]);
```

---

## 技术栈和依赖

### 前端技术栈

| 技术/库       | 版本 | 用途               |
| ------------- | ---- | ------------------ |
| Next.js       | 15+  | React框架，API路由 |
| React         | 18+  | UI库               |
| TypeScript    | 5+   | 类型安全           |
| Framer Motion | -    | 动画库             |
| Tailwind CSS  | -    | 样式框架           |

### 后端技术栈

| 技术/库            | 版本 | 用途        |
| ------------------ | ---- | ----------- |
| Node.js            | 18+  | 运行时环境  |
| Next.js API Routes | -    | RESTful API |

### AI服务

| 服务   | 模型        | 用途         |
| ------ | ----------- | ------------ |
| 智谱AI | glm-4-plus  | 主要聊天模型 |
| 智谱AI | glm-4-air   | 备选模型     |
| 智谱AI | glm-4-flash | 快速响应模型 |

### 数据存储

| 技术         | 用途                       |
| ------------ | -------------------------- |
| Supabase     | 向量数据库（pgvector扩展） |
| PostgreSQL   | 关系型数据库               |
| localStorage | 前端对话历史存储           |

### 核心依赖包

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "framer-motion": "^11.x",
    "next": "15.x",
    "react": "18.x"
  }
}
```

---

## 关键配置

### 环境变量

```bash
# 智谱AI配置
ZHIPU_AI_API_KEY=your_api_key_here
ZHIPU_AI_MODEL=glm-4-plus
ZHIPU_AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4/

# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 功能开关
ENABLE_STREAMING=true  # 启用流式响应
```

### 向量配置

```typescript
// 向量维度
const EMBEDDING_DIMENSIONS = 1024;

// 相似度阈值
const MIN_SIMILARITY = 0.3;

// 搜索权重
const VECTOR_WEIGHT = 0.7;
const STRUCTURED_WEIGHT = 0.3;
```

---

## 性能优化

### 1. 单例模式

RAG引擎和AI服务管理器采用单例模式，避免重复初始化：

```typescript
let ragEngine: VercelAIRAGEngine | null = null;

async function initializeRAGEngine() {
  if (ragEngine) {
    return ragEngine; // 返回已存在的实例
  }
  // 初始化逻辑...
  ragEngine = new VercelAIRAGEngine(...);
  return ragEngine;
}
```

### 2. 向量缓存

AI服务管理器内置缓存机制：

```typescript
class AIServiceManager {
  private cache = new Map<string, { data: any; timestamp: number }>();

  setCache(key: string, data: any, ttlMs?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + (ttlMs || 300000), // 默认5分钟
    });
  }

  getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached || Date.now() > cached.timestamp) {
      return null;
    }
    return cached.data;
  }
}
```

### 3. 对话历史限制

只保留最近的对话历史，避免token浪费：

```typescript
// 最多保留最近10条消息（5轮对话）
const recentHistory = conversationHistory.slice(-10);
```

### 4. 消息数量限制

前端限制最多保存50条消息：

```typescript
const MAX_MESSAGES = 50;
const limitedMessages = messages.slice(-MAX_MESSAGES);
```

---

## 错误处理

### API错误处理

```typescript
try {
  const response = await engine.generateResponse(query, filters);
  return NextResponse.json({ success: true, data: response });
} catch (error: any) {
  console.error('❌ Chat API Error:', error);
  return NextResponse.json(
    {
      success: false,
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    },
    { status: 500 }
  );
}
```

### 前端错误处理

```typescript
try {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, filters, conversationHistory }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  // 处理响应...
} catch (error) {
  console.error('Chat request failed:', error);
  // 显示错误消息给用户
  addMessage({
    type: 'assistant',
    content: '抱歉，发生了错误。请稍后重试。',
    timestamp: new Date(),
  });
}
```

---

## 总结

### 系统特点

1. **RAG架构**: 结合检索和生成，提供更准确的推荐
2. **混合搜索**: 向量搜索 + 结构化过滤，提高匹配准确率
3. **智能澄清**: 自动分析查询清晰度，主动引导用户
4. **对话历史**: 支持多轮对话，上下文理解
5. **单例模式**: 避免重复初始化，提高性能
6. **本地持久化**: 对话历史本地保存，刷新页面不丢失

### 数据流向总结

```
用户输入 → 前端组件 → API路由 → RAG引擎 → 引导式提问 → 混合搜索 → 向量搜索 → AI生成 → 响应返回 → 前端展示 → 本地存储
```

### 关键技术点

- **向量搜索**: pgvector + 智谱AI embedding（1024维）
- **混合权重**: 向量70% + 结构化30%
- **澄清系统**: 4维度分析（类别、风格、受众、目的）
- **AI模型**: 智谱AI glm-4-plus（支持函数调用、流式响应）
- **状态管理**: React Hooks + localStorage
- **动画效果**: Framer Motion

---

**文档版本**: v1.0
**最后更新**: 2025-01-22
**维护者**: Design Treasure Box Team
