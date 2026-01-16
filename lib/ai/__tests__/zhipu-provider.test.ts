import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZhipuAIProvider } from '../zhipu-provider';
import { ZhipuAIConfig, ChatMessage } from '@/types/ai-chat';

// Mock the dependencies
vi.mock('zhipu-ai-provider', () => ({
  createZhipu: vi.fn(() => vi.fn(() => ({
    doGenerate: vi.fn(),
    doStream: vi.fn(),
  }))),
}));

vi.mock('ai', () => ({
  generateText: vi.fn(),
  streamText: vi.fn(),
}));

describe('ZhipuAIProvider', () => {
  let provider: ZhipuAIProvider;
  let config: ZhipuAIConfig;

  beforeEach(() => {
    config = {
      provider: 'zhipu-ai',
      model: 'glm-4',
      apiKey: 'test-api-key',
      baseURL: 'https://test.api.com',
      streamingEnabled: true,
    };
    provider = new ZhipuAIProvider(config);
  });

  describe('初始化', () => {
    it('应该正确初始化提供者', () => {
      expect(provider.name).toBe('zhipu-ai');
      expect(provider.version).toBe('0.2.1');
      expect(provider.capabilities.chat).toBe(true);
      expect(provider.capabilities.streaming).toBe(true);
      expect(provider.capabilities.embedding).toBe(true);
      expect(provider.capabilities.functionCalling).toBe(true);
      expect(provider.capabilities.maxTokens).toBe(8192);
      expect(provider.capabilities.supportedLanguages).toContain('zh');
      expect(provider.capabilities.supportedLanguages).toContain('en');
    });

    it('应该返回正确的模型信息', () => {
      const modelInfo = provider.getModelInfo();
      expect(modelInfo.model).toBe('glm-4');
      expect(modelInfo.embeddingModel).toBe('embedding-2');
      expect(modelInfo.maxTokens).toBe(8192);
    });
  });

  describe('消息验证', () => {
    it('应该拒绝空消息数组', async () => {
      await expect(provider.generateChatCompletion([])).rejects.toThrow(
        'Messages array cannot be empty'
      );
    });

    it('应该拒绝无效的消息类型', async () => {
      const invalidMessages: ChatMessage[] = [
        {
          id: '1',
          type: 'invalid' as any,
          content: 'test',
          timestamp: new Date(),
        },
      ];

      await expect(provider.generateChatCompletion(invalidMessages)).rejects.toThrow(
        'Invalid message type'
      );
    });

    it('应该拒绝空内容的消息', async () => {
      const emptyMessages: ChatMessage[] = [
        {
          id: '1',
          type: 'user',
          content: '',
          timestamp: new Date(),
        },
      ];

      await expect(provider.generateChatCompletion(emptyMessages)).rejects.toThrow(
        'Each message must have valid content'
      );
    });
  });

  describe('选项验证', () => {
    const validMessages: ChatMessage[] = [
      {
        id: '1',
        type: 'user',
        content: 'Hello',
        timestamp: new Date(),
      },
    ];

    it('应该拒绝负数的maxTokens', async () => {
      await expect(
        provider.generateChatCompletion(validMessages, { maxTokens: -100 })
      ).rejects.toThrow('maxTokens must be a positive number');
    });

    it('应该拒绝超过限制的maxTokens', async () => {
      await expect(
        provider.generateChatCompletion(validMessages, { maxTokens: 10000 })
      ).rejects.toThrow('maxTokens cannot exceed 8192');
    });

    it('应该拒绝无效的temperature', async () => {
      await expect(
        provider.generateChatCompletion(validMessages, { temperature: 3 })
      ).rejects.toThrow('temperature must be between 0 and 2');
    });

    it('应该拒绝无效的topP', async () => {
      await expect(
        provider.generateChatCompletion(validMessages, { topP: 1.5 })
      ).rejects.toThrow('topP must be between 0 and 1');
    });
  });

  describe('消息格式转换', () => {
    it('应该正确转换用户消息', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          type: 'user',
          content: 'Hello',
          timestamp: new Date(),
        },
      ];

      const converted = (provider as any).convertMessages(messages);
      expect(converted).toEqual([
        {
          role: 'user',
          content: 'Hello',
        },
      ]);
    });

    it('应该正确转换助手消息', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          type: 'assistant',
          content: 'Hi there',
          timestamp: new Date(),
        },
      ];

      const converted = (provider as any).convertMessages(messages);
      expect(converted).toEqual([
        {
          role: 'assistant',
          content: 'Hi there',
        },
      ]);
    });

    it('应该正确转换系统消息', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          type: 'system',
          content: 'You are a helpful assistant',
          timestamp: new Date(),
        },
      ];

      const converted = (provider as any).convertMessages(messages);
      expect(converted).toEqual([
        {
          role: 'system',
          content: 'You are a helpful assistant',
        },
      ]);
    });

    it('应该正确转换混合消息', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          type: 'system',
          content: 'System prompt',
          timestamp: new Date(),
        },
        {
          id: '2',
          type: 'user',
          content: 'User message',
          timestamp: new Date(),
        },
        {
          id: '3',
          type: 'assistant',
          content: 'Assistant response',
          timestamp: new Date(),
        },
      ];

      const converted = (provider as any).convertMessages(messages);
      expect(converted).toHaveLength(3);
      expect(converted[0].role).toBe('system');
      expect(converted[1].role).toBe('user');
      expect(converted[2].role).toBe('assistant');
    });
  });

  describe('响应格式转换', () => {
    it('应该正确转换基本响应', () => {
      const mockResponse = {
        text: 'Test response',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        finishReason: 'stop',
      };

      const converted = (provider as any).convertResponse(mockResponse);
      expect(converted.content).toBe('Test response');
      expect(converted.usage?.promptTokens).toBe(10);
      expect(converted.usage?.completionTokens).toBe(20);
      expect(converted.usage?.totalTokens).toBe(30);
      expect(converted.finishReason).toBe('stop');
    });

    it('应该处理没有usage的响应', () => {
      const mockResponse = {
        text: 'Test response',
        finishReason: 'stop',
      };

      const converted = (provider as any).convertResponse(mockResponse);
      expect(converted.content).toBe('Test response');
      expect(converted.usage).toBeUndefined();
    });

    it('应该正确映射finishReason', () => {
      const testCases = [
        { input: 'stop', expected: 'stop' },
        { input: 'length', expected: 'length' },
        { input: 'content_filter', expected: 'content_filter' },
        { input: 'function_call', expected: 'function_call' },
        { input: 'tool_calls', expected: 'function_call' },
        { input: 'unknown', expected: 'stop' },
      ];

      testCases.forEach(({ input, expected }) => {
        const mockResponse = {
          text: 'Test',
          finishReason: input,
        };
        const converted = (provider as any).convertResponse(mockResponse);
        expect(converted.finishReason).toBe(expected);
      });
    });
  });

  describe('流式响应块转换', () => {
    it('应该正确转换流式响应块', () => {
      const chunk = 'Test chunk';
      const converted = (provider as any).convertStreamChunk(chunk);
      
      expect(converted.content).toBe('Test chunk');
      expect(converted.isComplete).toBe(false);
    });

    it('应该处理空字符串块', () => {
      const chunk = '';
      const converted = (provider as any).convertStreamChunk(chunk);
      
      expect(converted.content).toBe('');
      expect(converted.isComplete).toBe(false);
    });
  });

  describe('文本嵌入验证', () => {
    it('应该拒绝空文本', async () => {
      await expect(provider.generateEmbedding('')).rejects.toThrow(
        'Text input cannot be empty'
      );
    });

    it('应该拒绝只有空格的文本', async () => {
      await expect(provider.generateEmbedding('   ')).rejects.toThrow(
        'Text input cannot be empty'
      );
    });

    it('应该拒绝空数组', async () => {
      await expect(provider.generateEmbeddings([])).rejects.toThrow(
        'Texts array cannot be empty'
      );
    });
  });

  describe('配置更新', () => {
    it('应该允许更新配置', () => {
      const newConfig = {
        model: 'glm-4-turbo' as const,
        temperature: 0.5,
      };

      provider.updateConfig(newConfig);
      const modelInfo = provider.getModelInfo();
      expect(modelInfo.model).toBe('glm-4-turbo');
    });

    it('应该保留未更新的配置', () => {
      const originalApiKey = config.apiKey;
      
      provider.updateConfig({ model: 'glm-4-turbo' });
      
      // API key应该保持不变
      expect((provider as any).config.apiKey).toBe(originalApiKey);
    });
  });

  describe('能力检查', () => {
    it('应该正确报告支持的能力', () => {
      expect(provider.supportsCapability('chat')).toBe(true);
      expect(provider.supportsCapability('streaming')).toBe(true);
      expect(provider.supportsCapability('embedding')).toBe(true);
      expect(provider.supportsCapability('functionCalling')).toBe(true);
    });

    it('应该正确报告支持的语言', () => {
      expect(provider.supportsLanguage('zh')).toBe(true);
      expect(provider.supportsLanguage('en')).toBe(true);
      expect(provider.supportsLanguage('fr')).toBe(false);
    });

    it('应该返回正确的最大令牌数', () => {
      expect(provider.getMaxTokens()).toBe(8192);
    });
  });

  describe('提供者信息', () => {
    it('应该返回完整的提供者信息', () => {
      const info = provider.getInfo();
      
      expect(info.name).toBe('zhipu-ai');
      expect(info.version).toBe('0.2.1');
      expect(info.capabilities).toEqual(provider.capabilities);
    });

    it('应该返回能力的副本而不是引用', () => {
      const info1 = provider.getInfo();
      const info2 = provider.getInfo();
      
      expect(info1.capabilities).toEqual(info2.capabilities);
      expect(info1.capabilities).not.toBe(info2.capabilities);
    });
  });
});
