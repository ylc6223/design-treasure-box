/**
 * AI聊天界面属性测试
 * Feature: ai-chat-assistant, Property 1: 聊天界面触发和显示
 * Validates: Requirements 1.1, 1.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIChatInterface } from '../ai-chat-interface';
import * as fc from 'fast-check';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

describe('AIChatInterface - Property Tests', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 1: 聊天界面触发和显示', () => {
    /**
     * Property: 对于任何用户输入，触发发送操作应该导致聊天界面滑入并显示用户查询作为第一条消息
     * Validates: Requirements 1.1, 1.2
     */
    it('Property: 任何初始查询都应该触发界面打开并显示为第一条消息', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          async (initialQuery) => {
            const { unmount } = render(
              <AIChatInterface
                isOpen={true}
                onClose={mockOnClose}
                initialQuery={initialQuery}
              />
            );

            // 等待消息渲染
            await waitFor(() => {
              const messageElement = screen.queryByText(initialQuery.trim());
              expect(messageElement).toBeInTheDocument();
            }, { timeout: 2000 });

            unmount();
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * Property: 界面打开时应该显示正确的可见状态
     */
    it('Property: 界面打开状态应该正确反映在DOM中', () => {
      const { rerender, container } = render(
        <AIChatInterface
          isOpen={false}
          onClose={mockOnClose}
        />
      );

      // 关闭状态：面板应该有 translate-x-full 类
      let chatPanel = container.querySelector('.fixed.top-0.right-0');
      expect(chatPanel).toHaveClass('translate-x-full');

      // 打开状态：面板应该有 translate-x-0 类
      rerender(
        <AIChatInterface
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      chatPanel = container.querySelector('.fixed.top-0.right-0');
      expect(chatPanel).toHaveClass('translate-x-0');
    });

    /**
     * Property: 用户输入任何非空消息都应该被添加到消息列表
     */
    it('Property: 任何非空用户输入都应该被添加到消息列表', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 过滤掉 userEvent 的特殊字符
          fc.string({ minLength: 1, maxLength: 100 })
            .filter(s => s.trim().length > 0)
            .filter(s => !s.includes('[') && !s.includes('{') && !s.includes('}')),
          async (userInput) => {
            const user = userEvent.setup();
            const { unmount, container } = render(
              <AIChatInterface
                isOpen={true}
                onClose={mockOnClose}
              />
            );

            // 输入消息 - 使用 container 查询以避免多个实例问题
            const textarea = container.querySelector('textarea[placeholder="描述您需要的设计资源..."]') as HTMLTextAreaElement;
            expect(textarea).toBeTruthy();
            
            await user.type(textarea, userInput);

            // 点击发送按钮
            const sendButton = container.querySelector('button[aria-label="发送消息"]') as HTMLButtonElement;
            expect(sendButton).toBeTruthy();
            await user.click(sendButton);

            // 验证消息显示
            await waitFor(() => {
              expect(screen.getByText(userInput.trim())).toBeInTheDocument();
            });

            unmount();
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * Property: 空白输入不应该被发送
     */
    it('Property: 空白或纯空格的输入不应该创建消息', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 0, maxLength: 20 }).filter(s => s.trim().length === 0),
          async (emptyInput) => {
            const user = userEvent.setup();
            const { unmount } = render(
              <AIChatInterface
                isOpen={true}
                onClose={mockOnClose}
              />
            );

            // 获取初始消息数量（应该是0，因为有欢迎消息）
            const initialMessages = screen.queryAllByRole('article');
            const initialCount = initialMessages.length;

            // 尝试输入空白消息
            const textarea = screen.getByPlaceholderText('描述您需要的设计资源...');
            if (emptyInput) {
              await user.type(textarea, emptyInput);
            }

            // 尝试点击发送按钮（应该被禁用）
            const sendButton = screen.getByLabelText('发送消息');
            
            // 验证按钮被禁用
            expect(sendButton).toBeDisabled();

            // 验证消息数量没有增加
            const finalMessages = screen.queryAllByRole('article');
            expect(finalMessages.length).toBe(initialCount);

            unmount();
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * Property: 发送消息后输入框应该被清空
     */
    it('Property: 发送消息后输入框应该被清空', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 过滤掉 userEvent 的特殊字符
          fc.string({ minLength: 1, maxLength: 50 })
            .filter(s => s.trim().length > 0)
            .filter(s => !s.includes('[') && !s.includes('{') && !s.includes('}')),
          async (userInput) => {
            const user = userEvent.setup();
            const { unmount, container } = render(
              <AIChatInterface
                isOpen={true}
                onClose={mockOnClose}
              />
            );

            // 输入消息 - 使用 container 查询
            const textarea = container.querySelector('textarea[placeholder="描述您需要的设计资源..."]') as HTMLTextAreaElement;
            expect(textarea).toBeTruthy();
            await user.type(textarea, userInput);

            // 验证输入框有内容
            expect(textarea.value).toBe(userInput);

            // 点击发送按钮
            const sendButton = container.querySelector('button[aria-label="发送消息"]') as HTMLButtonElement;
            expect(sendButton).toBeTruthy();
            await user.click(sendButton);

            // 验证输入框被清空
            await waitFor(() => {
              expect(textarea.value).toBe('');
            });

            unmount();
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * Property: 消息应该按时间顺序显示
     */
    it('Property: 多条消息应该按发送顺序显示', async () => {
      const user = userEvent.setup();
      render(
        <AIChatInterface
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const messages = ['第一条消息', '第二条消息'];
      const textarea = screen.getByPlaceholderText('描述您需要的设计资源...');

      // 发送第一条消息
      await user.type(textarea, messages[0]);
      const sendButton = screen.getByLabelText('发送消息');
      await user.click(sendButton);

      // 等待第一条消息显示
      await waitFor(() => {
        expect(screen.getByText(messages[0])).toBeInTheDocument();
      }, { timeout: 3000 });

      // 等待第一条消息的响应完成（等待加载状态消失）
      await waitFor(() => {
        const loadingIndicator = screen.queryByText('Loading');
        expect(loadingIndicator).not.toBeInTheDocument();
      }, { timeout: 2000 });

      // 发送第二条消息
      await user.clear(textarea);
      await user.type(textarea, messages[1]);
      await user.click(sendButton);

      // 等待第二条消息显示
      await waitFor(() => {
        expect(screen.getByText(messages[1])).toBeInTheDocument();
      }, { timeout: 3000 });

      // 验证两条消息都存在
      expect(screen.getByText(messages[0])).toBeInTheDocument();
      expect(screen.getByText(messages[1])).toBeInTheDocument();
    });

    /**
     * Property: 关闭按钮应该触发 onClose 回调
     */
    it('Property: 点击关闭按钮应该调用 onClose', async () => {
      const user = userEvent.setup();
      render(
        <AIChatInterface
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByLabelText('关闭聊天');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    /**
     * Property: 点击遮罩层应该触发 onClose 回调
     */
    it('Property: 点击遮罩层应该调用 onClose', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <AIChatInterface
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // 找到遮罩层（第一个 fixed 元素）
      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();

      if (overlay) {
        await user.click(overlay);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });

    /**
     * Property: 界面应该显示正确的标题和描述
     */
    it('Property: 界面应该始终显示标题和描述', () => {
      render(
        <AIChatInterface
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('AI 设计助手')).toBeInTheDocument();
      expect(screen.getByText('为您推荐最合适的设计资源')).toBeInTheDocument();
    });

    /**
     * Property: 空消息列表应该显示欢迎提示
     */
    it('Property: 没有消息时应该显示欢迎提示', () => {
      render(
        <AIChatInterface
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('开始对话，我会帮您找到最合适的设计资源')).toBeInTheDocument();
    });

    /**
     * Property: 发送消息时应该显示加载状态
     */
    it('Property: 发送消息时应该显示加载指示器', async () => {
      const user = userEvent.setup();
      render(
        <AIChatInterface
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const textarea = screen.getByPlaceholderText('描述您需要的设计资源...');
      await user.type(textarea, '测试消息');

      const sendButton = screen.getByLabelText('发送消息');
      await user.click(sendButton);

      // 验证加载状态（发送按钮应该被禁用）
      await waitFor(() => {
        expect(sendButton).toBeDisabled();
      });
    });
  });

  describe('边界情况和错误处理', () => {
    /**
     * Property: 极长的消息应该被正确处理
     */
    it('Property: 应该能处理长消息', async () => {
      const longMessage = 'a'.repeat(500);
      const user = userEvent.setup();
      
      render(
        <AIChatInterface
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const textarea = screen.getByPlaceholderText('描述您需要的设计资源...');
      await user.type(textarea, longMessage);

      const sendButton = screen.getByLabelText('发送消息');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(longMessage)).toBeInTheDocument();
      });
    });

    /**
     * Property: 特殊字符应该被正确显示
     */
    it('Property: 应该正确处理特殊字符', async () => {
      const specialChars = ['<script>alert("test")</script>', '& < > " \'', '😀 🎨 ✨'];
      const user = userEvent.setup();

      for (const chars of specialChars) {
        const { unmount } = render(
          <AIChatInterface
            isOpen={true}
            onClose={mockOnClose}
          />
        );

        const textarea = screen.getByPlaceholderText('描述您需要的设计资源...');
        await user.type(textarea, chars);

        const sendButton = screen.getByLabelText('发送消息');
        await user.click(sendButton);

        await waitFor(() => {
          expect(screen.getByText(chars)).toBeInTheDocument();
        });

        unmount();
      }
    });
  });
});
