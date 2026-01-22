import {
  AIProvider,
  AICapabilities,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatChunk,
} from '@/types/ai-chat';

/**
 * AI提供者抽象基类
 * 提供通用的功能和错误处理
 */
export abstract class BaseAIProvider implements AIProvider {
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly capabilities: AICapabilities;

  /**
   * 抽象方法：生成聊天完成
   */
  abstract generateChatCompletion(
    messages: ChatMessage[],
    options?: ChatOptions
  ): Promise<ChatResponse>;

  /**
   * 抽象方法：流式聊天完成
   */
  abstract streamChatCompletion(
    messages: ChatMessage[],
    options?: ChatOptions
  ): AsyncIterable<ChatChunk>;

  /**
   * 抽象方法：生成文本嵌入
   */
  abstract generateEmbedding(text: string): Promise<number[]>;

  /**
   * 抽象方法：批量生成嵌入
   */
  abstract generateEmbeddings(texts: string[]): Promise<number[][]>;

  /**
   * 验证消息格式
   */
  protected validateMessages(messages: ChatMessage[]): void {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages array cannot be empty');
    }

    for (const message of messages) {
      if (!message.content || typeof message.content !== 'string') {
        throw new Error('Each message must have valid content');
      }

      if (!['user', 'assistant', 'system'].includes(message.type)) {
        throw new Error('Invalid message type');
      }
    }
  }

  /**
   * 验证聊天选项
   */
  protected validateChatOptions(options?: ChatOptions): void {
    if (!options) return;

    if (options.maxTokens !== undefined) {
      if (typeof options.maxTokens !== 'number' || options.maxTokens <= 0) {
        throw new Error('maxTokens must be a positive number');
      }

      if (options.maxTokens > this.capabilities.maxTokens) {
        throw new Error(`maxTokens cannot exceed ${this.capabilities.maxTokens}`);
      }
    }

    if (options.temperature !== undefined) {
      if (
        typeof options.temperature !== 'number' ||
        options.temperature < 0 ||
        options.temperature > 2
      ) {
        throw new Error('temperature must be between 0 and 2');
      }
    }

    if (options.topP !== undefined) {
      if (typeof options.topP !== 'number' || options.topP < 0 || options.topP > 1) {
        throw new Error('topP must be between 0 and 1');
      }
    }
  }

  /**
   * 验证文本输入
   */
  protected validateText(text: string): void {
    if (typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Text input cannot be empty');
    }
  }

  /**
   * 处理API错误
   */
  protected handleAPIError(error: any, operation: string): never {
    console.error(`${this.name} ${operation} error:`, error);

    if (error.response?.status === 401) {
      throw new Error(`Authentication failed for ${this.name}. Please check your API key.`);
    }

    if (error.response?.status === 429) {
      throw new Error(`Rate limit exceeded for ${this.name}. Please try again later.`);
    }

    if (error.response?.status >= 500) {
      throw new Error(`${this.name} service is temporarily unavailable. Please try again later.`);
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error(
        `Cannot connect to ${this.name} service. Please check your network connection.`
      );
    }

    throw new Error(`${this.name} ${operation} failed: ${error.message || 'Unknown error'}`);
  }

  /**
   * 重试机制
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // 如果是认证错误或客户端错误，不重试
        if (
          error instanceof Error &&
          (error.message.includes('Authentication failed') || error.message.includes('Invalid'))
        ) {
          throw error;
        }

        if (attempt === maxRetries) {
          break;
        }

        // 指数退避
        const waitTime = delay * Math.pow(2, attempt - 1);
        console.warn(
          `${this.name} operation failed (attempt ${attempt}/${maxRetries}), retrying in ${waitTime}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    throw lastError!;
  }

  /**
   * 获取提供者信息
   */
  getInfo(): {
    name: string;
    version: string;
    capabilities: AICapabilities;
  } {
    return {
      name: this.name,
      version: this.version,
      capabilities: { ...this.capabilities },
    };
  }

  /**
   * 检查是否支持特定功能
   */
  supportsCapability(capability: keyof AICapabilities): boolean {
    return this.capabilities[capability] === true;
  }

  /**
   * 检查是否支持特定语言
   */
  supportsLanguage(language: string): boolean {
    return this.capabilities.supportedLanguages.includes(language);
  }

  /**
   * 获取支持的最大令牌数
   */
  getMaxTokens(): number {
    return this.capabilities.maxTokens;
  }

  /**
   * 转换消息格式为提供者特定格式
   */
  protected abstract convertMessages(messages: ChatMessage[]): any[];

  /**
   * 转换响应格式为标准格式
   */
  protected abstract convertResponse(response: any): ChatResponse;

  /**
   * 转换流式响应块为标准格式
   */
  protected abstract convertStreamChunk(chunk: any): ChatChunk;
}
