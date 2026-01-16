import { AIProvider, VercelAIConfig, ZhipuAIConfig } from '@/types/ai-chat';
import { getAIConfigManager } from './config-manager';
import { getAIProviderFactory } from './provider-factory';
import { ZhipuAIProvider } from './zhipu-provider';

/**
 * AI服务管理器
 * 负责管理AI提供者的生命周期、故障转移和缓存
 */
export class AIServiceManager {
  private currentProvider: AIProvider | null = null;
  private configManager = getAIConfigManager();
  private providerFactory = getAIProviderFactory();
  private cache = new Map<string, { data: any; timestamp: number }>();
  private static instance: AIServiceManager | null = null;

  /**
   * 获取服务管理器单例实例
   */
  static getInstance(): AIServiceManager {
    if (!AIServiceManager.instance) {
      AIServiceManager.instance = new AIServiceManager();
    }
    return AIServiceManager.instance;
  }

  /**
   * 初始化服务管理器
   */
  async initialize(): Promise<void> {
    try {
      // 验证配置
      const validation = this.configManager.validateConfiguration();
      if (!validation.isValid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }

      // 获取默认提供者配置
      const defaultConfig = this.configManager.getDefaultProviderConfig();
      
      // 切换到默认提供者
      await this.switchProvider(defaultConfig);

      console.log('AI Service Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI Service Manager:', error);
      throw error;
    }
  }

  /**
   * 切换AI提供者
   */
  async switchProvider(config: VercelAIConfig): Promise<void> {
    try {
      // 这里暂时创建一个占位符提供者
      // 在后续任务中会实现具体的ZhipuAIProvider
      const provider = await this.createProvider(config);
      
      // 注册到工厂
      this.providerFactory.register(provider);
      
      // 设置为当前提供者
      this.currentProvider = provider;

      console.log(`Switched to AI provider: ${provider.name} v${provider.version}`);
    } catch (error) {
      console.error(`Failed to switch to provider ${config.provider}:`, error);
      throw error;
    }
  }

  /**
   * 创建AI提供者实例
   */
  private async createProvider(config: VercelAIConfig): Promise<AIProvider> {
    switch (config.provider) {
      case 'zhipu-ai':
        return new ZhipuAIProvider(config as ZhipuAIConfig);
      
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  /**
   * 获取当前AI提供者
   */
  getCurrentProvider(): AIProvider {
    if (!this.currentProvider) {
      throw new Error('No AI provider is currently active. Call initialize() first.');
    }
    return this.currentProvider;
  }

  /**
   * 检查服务是否可用
   */
  isServiceAvailable(): boolean {
    return this.currentProvider !== null;
  }

  /**
   * 获取可用的提供者列表
   */
  getAvailableProviders(): string[] {
    return this.configManager.getAvailableProviders();
  }

  /**
   * 故障转移到备用提供者
   */
  async failover(): Promise<boolean> {
    const availableProviders = this.getAvailableProviders();
    const currentProviderName = this.currentProvider?.name;

    // 找到除当前提供者外的其他可用提供者
    const fallbackProviders = availableProviders.filter(
      name => name !== currentProviderName
    );

    if (fallbackProviders.length === 0) {
      console.error('No fallback providers available');
      return false;
    }

    // 尝试切换到第一个可用的备用提供者
    try {
      const fallbackConfig = this.configManager.getProviderConfig(fallbackProviders[0]);
      await this.switchProvider(fallbackConfig);
      console.log(`Failed over to provider: ${fallbackProviders[0]}`);
      return true;
    } catch (error) {
      console.error('Failover failed:', error);
      return false;
    }
  }

  /**
   * 缓存数据
   */
  setCache(key: string, data: any, ttlMs?: number): void {
    const runtimeConfig = this.configManager.getRuntimeConfig();
    const expiryTime = ttlMs || runtimeConfig.cacheExpiryMs;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now() + expiryTime,
    });
  }

  /**
   * 获取缓存数据
   */
  getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > cached.timestamp) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取服务统计信息
   */
  getStats(): {
    currentProvider: string | null;
    availableProviders: string[];
    cacheSize: number;
    isInitialized: boolean;
  } {
    return {
      currentProvider: this.currentProvider?.name || null,
      availableProviders: this.getAvailableProviders(),
      cacheSize: this.cache.size,
      isInitialized: this.isServiceAvailable(),
    };
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      providerAvailable: boolean;
      configValid: boolean;
      errors: string[];
    };
  }> {
    const errors: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // 检查配置
    const configValidation = this.configManager.validateConfiguration();
    if (!configValidation.isValid) {
      errors.push(...configValidation.errors);
      status = 'unhealthy';
    }

    // 检查提供者
    const providerAvailable = this.isServiceAvailable();
    if (!providerAvailable) {
      errors.push('No AI provider is currently active');
      status = 'unhealthy';
    }

    // 如果有错误但服务仍可用，标记为降级
    if (errors.length > 0 && providerAvailable) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        providerAvailable,
        configValid: configValidation.isValid,
        errors,
      },
    };
  }
}

/**
 * 获取AI服务管理器实例
 */
export function getAIServiceManager(): AIServiceManager {
  return AIServiceManager.getInstance();
}

/**
 * 重置AI服务管理器（主要用于测试）
 */
export function resetAIServiceManager(): void {
  // @ts-ignore - 访问私有静态属性用于测试
  AIServiceManager.instance = null;
}