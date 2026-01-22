import { AIProvider } from '@/types/ai-chat';

/**
 * AI提供者工厂
 * 管理和创建AI提供者实例
 */
export class AIProviderFactory {
  private providers = new Map<string, AIProvider>();
  private static instance: AIProviderFactory | null = null;

  /**
   * 获取工厂单例实例
   */
  static getInstance(): AIProviderFactory {
    if (!AIProviderFactory.instance) {
      AIProviderFactory.instance = new AIProviderFactory();
    }
    return AIProviderFactory.instance;
  }

  /**
   * 注册AI提供者
   */
  register(provider: AIProvider): void {
    this.providers.set(provider.name, provider);
    console.log(`AI Provider registered: ${provider.name} v${provider.version}`);
  }

  /**
   * 获取AI提供者
   */
  get(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * 获取默认AI提供者
   */
  getDefault(): AIProvider {
    // 优先返回智谱AI提供者
    const zhipuProvider = this.providers.get('zhipu-ai');
    if (zhipuProvider) {
      return zhipuProvider;
    }

    // 如果没有智谱AI，返回第一个可用的提供者
    const firstProvider = this.providers.values().next().value;
    if (!firstProvider) {
      throw new Error('No AI providers registered');
    }

    return firstProvider;
  }

  /**
   * 获取所有已注册的提供者名称
   */
  getRegisteredProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * 检查提供者是否已注册
   */
  isRegistered(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * 注销提供者
   */
  unregister(name: string): boolean {
    const removed = this.providers.delete(name);
    if (removed) {
      console.log(`AI Provider unregistered: ${name}`);
    }
    return removed;
  }

  /**
   * 清空所有提供者（主要用于测试）
   */
  clear(): void {
    this.providers.clear();
  }

  /**
   * 获取提供者统计信息
   */
  getStats(): {
    totalProviders: number;
    providers: Array<{
      name: string;
      version: string;
      capabilities: {
        chat: boolean;
        streaming: boolean;
        embedding: boolean;
        functionCalling: boolean;
      };
    }>;
  } {
    const providers = Array.from(this.providers.values()).map((provider) => ({
      name: provider.name,
      version: provider.version,
      capabilities: {
        chat: provider.capabilities.chat,
        streaming: provider.capabilities.streaming,
        embedding: provider.capabilities.embedding,
        functionCalling: provider.capabilities.functionCalling,
      },
    }));

    return {
      totalProviders: this.providers.size,
      providers,
    };
  }

  /**
   * 根据能力筛选提供者
   */
  getProvidersByCapability(capability: keyof AIProvider['capabilities']): AIProvider[] {
    return Array.from(this.providers.values()).filter(
      (provider) => provider.capabilities[capability] === true
    );
  }

  /**
   * 获取支持流式响应的提供者
   */
  getStreamingProviders(): AIProvider[] {
    return this.getProvidersByCapability('streaming');
  }

  /**
   * 获取支持嵌入的提供者
   */
  getEmbeddingProviders(): AIProvider[] {
    return this.getProvidersByCapability('embedding');
  }

  /**
   * 获取支持函数调用的提供者
   */
  getFunctionCallingProviders(): AIProvider[] {
    return this.getProvidersByCapability('functionCalling');
  }
}

/**
 * 获取AI提供者工厂实例
 */
export function getAIProviderFactory(): AIProviderFactory {
  return AIProviderFactory.getInstance();
}

/**
 * 重置AI提供者工厂（主要用于测试）
 */
export function resetAIProviderFactory(): void {
  const factory = AIProviderFactory.getInstance();
  factory.clear();
}
