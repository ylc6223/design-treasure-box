import { createZhipu } from 'zhipu-ai-provider';
import { generateText, streamText } from 'ai';
import { BaseAIProvider } from './base-provider';
import { 
  AICapabilities, 
  ChatMessage, 
  ChatOptions, 
  ChatResponse, 
  ChatChunk,
  ZhipuAIConfig 
} from '@/types/ai-chat';

/**
 * 智谱AI提供者实现
 * 集成zhipu-ai-provider和Vercel AI SDK
 */
export class ZhipuAIProvider extends BaseAIProvider {
  readonly name = 'zhipu-ai';
  readonly version = '0.2.1';
  readonly capabilities: AICapabilities = {
    chat: true,
    streaming: true,
    embedding: true,
    functionCalling: true,
    maxTokens: 8192,
    supportedLanguages: ['zh', 'en'],
  };

  private zhipuClient: ReturnType<typeof createZhipu>;
  private config: ZhipuAIConfig;

  constructor(config: ZhipuAIConfig) {
    super();
    this.config = config;
    
    // 创建智谱AI客户端
    this.zhipuClient = createZhipu({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });

    console.log(`ZhipuAI Provider initialized with model: ${config.model}`);
  }

  /**
   * 生成聊天完成
   */
  async generateChatCompletion(
    messages: ChatMessage[], 
    options?: ChatOptions
  ): Promise<ChatResponse> {
    this.validateMessages(messages);
    this.validateChatOptions(options);

    try {
      const result = await this.withRetry(async () => {
        const response = await generateText({
          model: this.zhipuClient(this.config.model) as any,
          messages: this.convertMessages(messages),
          temperature: options?.temperature || 0.7,
          topP: options?.topP,
        });

        return response;
      });

      return this.convertResponse(result);
    } catch (error) {
      this.handleAPIError(error, 'generateChatCompletion');
    }
  }

  /**
   * 流式聊天完成
   */
  async *streamChatCompletion(
    messages: ChatMessage[], 
    options?: ChatOptions
  ): AsyncIterable<ChatChunk> {
    this.validateMessages(messages);
    this.validateChatOptions(options);

    try {
      const result = await streamText({
        model: this.zhipuClient(this.config.model) as any,
        messages: this.convertMessages(messages),
        temperature: options?.temperature || 0.7,
        topP: options?.topP,
      });

      for await (const chunk of result.textStream) {
        yield this.convertStreamChunk(chunk);
      }
    } catch (error) {
      this.handleAPIError(error, 'streamChatCompletion');
    }
  }

  /**
   * 生成文本嵌入
   */
  async generateEmbedding(text: string): Promise<number[]> {
    this.validateText(text);

    try {
      return await this.withRetry(async () => {
        // 使用智谱AI的嵌入API
        const embeddingModel = this.config.embeddingModel || 'embedding-2';
        
        // 注意：zhipu-ai-provider可能需要直接调用API
        // 这里使用简化的实现，实际可能需要调用智谱的嵌入端点
        const response = await fetch(`${this.config.baseURL || 'https://open.bigmodel.cn'}/api/paas/v4/embeddings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            model: embeddingModel,
            input: text,
          }),
        });

        if (!response.ok) {
          throw new Error(`Embedding API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data[0].embedding;
      });
    } catch (error) {
      this.handleAPIError(error, 'generateEmbedding');
    }
  }

  /**
   * 批量生成嵌入
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts array cannot be empty');
    }

    try {
      return await this.withRetry(async () => {
        const embeddingModel = this.config.embeddingModel || 'embedding-2';
        
        const response = await fetch(`${this.config.baseURL || 'https://open.bigmodel.cn'}/api/paas/v4/embeddings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            model: embeddingModel,
            input: texts,
          }),
        });

        if (!response.ok) {
          throw new Error(`Batch embedding API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data.map((item: any) => item.embedding);
      });
    } catch (error) {
      this.handleAPIError(error, 'generateEmbeddings');
    }
  }

  /**
   * 转换消息格式为智谱AI格式
   */
  protected convertMessages(messages: ChatMessage[]): any[] {
    return messages.map(msg => ({
      role: msg.type === 'assistant' ? 'assistant' : msg.type === 'system' ? 'system' : 'user',
      content: msg.content,
    }));
  }

  /**
   * 转换响应格式为标准格式
   */
  protected convertResponse(response: any): ChatResponse {
    return {
      content: response.text,
      usage: response.usage ? {
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
      } : undefined,
      finishReason: this.mapFinishReason(response.finishReason),
    };
  }

  /**
   * 转换流式响应块为标准格式
   */
  protected convertStreamChunk(chunk: string): ChatChunk {
    return {
      content: chunk,
      isComplete: false, // 流式响应中每个块都不是最终的
    };
  }

  /**
   * 映射完成原因
   */
  private mapFinishReason(reason: string | undefined): ChatResponse['finishReason'] {
    if (!reason) return undefined;
    
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      case 'function_call':
      case 'tool_calls':
        return 'function_call';
      default:
        return 'stop';
    }
  }

  /**
   * 获取模型信息
   */
  getModelInfo(): {
    model: string;
    embeddingModel: string;
    maxTokens: number;
  } {
    return {
      model: this.config.model,
      embeddingModel: this.config.embeddingModel || 'embedding-2',
      maxTokens: this.capabilities.maxTokens,
    };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ZhipuAIConfig>): void {
    this.config = { ...this.config, ...config };
    
    // 如果API密钥或基础URL改变，重新创建客户端
    if (config.apiKey || config.baseURL) {
      this.zhipuClient = createZhipu({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseURL,
      });
    }
    
    console.log('ZhipuAI Provider config updated');
  }
}

/**
 * 创建智谱AI提供者实例
 */
export function createZhipuAIProvider(config: ZhipuAIConfig): ZhipuAIProvider {
  return new ZhipuAIProvider(config);
}
