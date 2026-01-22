import {
  AIEnvironmentConfig,
  AIRuntimeConfig,
  VercelAIConfig,
  ZhipuAIConfig,
  AIEnvironmentConfigSchema,
  AIRuntimeConfigSchema,
} from '@/types/ai-chat';

/**
 * AI配置管理器
 * 负责加载和管理AI提供者的配置
 */
export class AIConfigManager {
  private config!: AIRuntimeConfig;
  private envConfig!: AIEnvironmentConfig;

  constructor() {
    this.loadConfiguration();
  }

  /**
   * 加载配置
   */
  private loadConfiguration(): void {
    // 加载环境变量配置
    const rawEnvConfig = {
      ZHIPU_AI_API_KEY: process.env.ZHIPU_AI_API_KEY!,
      ZHIPU_AI_BASE_URL: process.env.ZHIPU_AI_BASE_URL,
      ZHIPU_AI_MODEL:
        (process.env.ZHIPU_AI_MODEL as
          | 'glm-4-plus'
          | 'glm-4-air'
          | 'glm-4-flash'
          | 'glm-4'
          | 'glm-4-0520'
          | 'glm-3-turbo'
          | 'glm-4.6v'
          | 'glm-4.6v-flash'
          | 'glm-4.5v'
          | 'glm-4v-plus'
          | 'glm-4.7') || 'glm-4-plus',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      ENABLE_STREAMING: process.env.ENABLE_STREAMING === 'true',
      ENABLE_FUNCTION_CALLING: process.env.ENABLE_FUNCTION_CALLING === 'true',
      MAX_CONVERSATION_LENGTH: parseInt(process.env.MAX_CONVERSATION_LENGTH || '50'),
    };

    // 验证环境变量配置
    const envValidation = AIEnvironmentConfigSchema.safeParse(rawEnvConfig);
    if (!envValidation.success) {
      console.error('Invalid environment configuration:', envValidation.error);
      throw new Error('Invalid environment configuration');
    }
    this.envConfig = envValidation.data;

    // 设置运行时配置
    const rawRuntimeConfig = {
      defaultProvider: 'zhipu-ai',
      fallbackProviders: [],
      maxRetries: 3,
      timeoutMs: 30000,
      enableCaching: true,
      cacheExpiryMs: 300000, // 5分钟
    };

    const runtimeValidation = AIRuntimeConfigSchema.safeParse(rawRuntimeConfig);
    if (!runtimeValidation.success) {
      console.error('Invalid runtime configuration:', runtimeValidation.error);
      throw new Error('Invalid runtime configuration');
    }
    this.config = runtimeValidation.data;
  }

  /**
   * 获取提供者配置
   */
  getProviderConfig(providerName: string): VercelAIConfig {
    switch (providerName) {
      case 'zhipu-ai':
        return {
          provider: 'zhipu-ai',
          model: this.envConfig.ZHIPU_AI_MODEL || 'glm-4',
          apiKey: this.envConfig.ZHIPU_AI_API_KEY,
          baseURL: this.envConfig.ZHIPU_AI_BASE_URL,
          streamingEnabled: this.envConfig.ENABLE_STREAMING ?? true,
          maxTokens: 4000,
          temperature: 0.7,
        } as ZhipuAIConfig;

      case 'openai':
        if (!this.envConfig.OPENAI_API_KEY) {
          throw new Error('OpenAI API key not configured');
        }
        return {
          provider: 'openai',
          model: 'gpt-4',
          apiKey: this.envConfig.OPENAI_API_KEY,
          streamingEnabled: this.envConfig.ENABLE_STREAMING ?? true,
          maxTokens: 4000,
          temperature: 0.7,
        };

      case 'anthropic':
        if (!this.envConfig.ANTHROPIC_API_KEY) {
          throw new Error('Anthropic API key not configured');
        }
        return {
          provider: 'anthropic',
          model: 'claude-3-sonnet-20240229',
          apiKey: this.envConfig.ANTHROPIC_API_KEY,
          streamingEnabled: this.envConfig.ENABLE_STREAMING ?? true,
          maxTokens: 4000,
          temperature: 0.7,
        };

      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
  }

  /**
   * 获取默认提供者配置
   */
  getDefaultProviderConfig(): VercelAIConfig {
    return this.getProviderConfig(this.config.defaultProvider);
  }

  /**
   * 获取运行时配置
   */
  getRuntimeConfig(): AIRuntimeConfig {
    return { ...this.config };
  }

  /**
   * 获取环境配置
   */
  getEnvironmentConfig(): AIEnvironmentConfig {
    return { ...this.envConfig };
  }

  /**
   * 检查提供者是否可用
   */
  isProviderAvailable(providerName: string): boolean {
    try {
      this.getProviderConfig(providerName);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取可用的提供者列表
   */
  getAvailableProviders(): string[] {
    const providers = ['zhipu-ai', 'openai', 'anthropic'];
    return providers.filter((provider) => this.isProviderAvailable(provider));
  }

  /**
   * 验证配置
   */
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查必需的API密钥
    if (!this.envConfig.ZHIPU_AI_API_KEY) {
      errors.push('ZHIPU_AI_API_KEY is required');
    }

    // 检查默认提供者是否可用
    if (!this.isProviderAvailable(this.config.defaultProvider)) {
      errors.push(`Default provider '${this.config.defaultProvider}' is not available`);
    }

    // 检查至少有一个提供者可用
    const availableProviders = this.getAvailableProviders();
    if (availableProviders.length === 0) {
      errors.push('No AI providers are available');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// 单例实例
let configManagerInstance: AIConfigManager | null = null;

/**
 * 获取配置管理器实例
 */
export function getAIConfigManager(): AIConfigManager {
  if (!configManagerInstance) {
    configManagerInstance = new AIConfigManager();
  }
  return configManagerInstance;
}

/**
 * 重置配置管理器实例（主要用于测试）
 */
export function resetAIConfigManager(): void {
  configManagerInstance = null;
}
