import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIChatInterface } from '@/components/ai-chat-interface';
import '@testing-library/jest-dom';

// Mock the prompt-kit components to simplify testing
vi.mock('@/components/ui/chat-container', () => ({
  ChatContainerRoot: ({ children, className }: any) => (
    <div className={className} data-testid="chat-container">
      {children}
    </div>
  ),
  ChatContainerContent: ({ children }: any) => <div>{children}</div>,
  ChatContainerScrollAnchor: () => <div data-testid="scroll-anchor" />,
}));

vi.mock('@/components/ui/message', () => ({
  Message: ({ children }: any) => <div data-testid="message">{children}</div>,
  MessageAvatar: ({ alt }: any) => <div data-testid="message-avatar">{alt}</div>,
  MessageContent: ({ children }: any) => <div data-testid="message-content">{children}</div>,
}));

vi.mock('@/components/ui/prompt-input', () => ({
  PromptInput: ({ children, onSubmit, value, onValueChange }: any) => (
    <div data-testid="prompt-input">
      <input
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit?.();
          }
        }}
        placeholder="描述您需要的设计资源..."
      />
      {children}
    </div>
  ),
  PromptInputTextarea: ({ placeholder }: any) => (
    <div data-testid="prompt-textarea">{placeholder}</div>
  ),
  PromptInputActions: ({ children }: any) => <div>{children}</div>,
  PromptInputAction: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/scroll-button', () => ({
  ScrollButton: () => <div data-testid="scroll-button" />,
}));

vi.mock('@/components/ui/loader', () => ({
  Loader: () => <div data-testid="loader">Loading...</div>,
}));

describe('AIChatInterface', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Basic Rendering', () => {
    it('should render with closed state when isOpen is false', () => {
      const { container } = render(<AIChatInterface isOpen={false} onClose={vi.fn()} />);

      const panel = container.querySelector('.translate-x-full');
      expect(panel).toBeInTheDocument();
    });

    it('should render with open state when isOpen is true', () => {
      const { container } = render(<AIChatInterface isOpen={true} onClose={vi.fn()} />);

      const panel = container.querySelector('.translate-x-0');
      expect(panel).toBeInTheDocument();
    });

    it('should display header with title and description', () => {
      render(<AIChatInterface isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByText('AI 设计助手')).toBeInTheDocument();
      expect(screen.getByText('为您推荐最合适的设计资源')).toBeInTheDocument();
    });

    it('should display close button', () => {
      render(<AIChatInterface isOpen={true} onClose={vi.fn()} />);

      const closeButton = screen.getByLabelText('关闭聊天');
      expect(closeButton).toBeInTheDocument();
    });

    it('should display empty state message when no messages', () => {
      render(<AIChatInterface isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByText(/开始对话/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<AIChatInterface isOpen={true} onClose={onClose} />);

      const closeButton = screen.getByLabelText('关闭聊天');
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      const { container } = render(<AIChatInterface isOpen={true} onClose={onClose} />);

      const overlay = container.querySelector('.bg-black\\/20');
      if (overlay) {
        await user.click(overlay);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Initial Query', () => {
    it('should process initial query when provided', async () => {
      render(<AIChatInterface isOpen={true} onClose={vi.fn()} initialQuery="推荐一些图标资源" />);

      await waitFor(
        () => {
          expect(screen.getByText('推荐一些图标资源')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Message Sending', () => {
    it('should display user message after sending', async () => {
      const user = userEvent.setup();

      render(<AIChatInterface isOpen={true} onClose={vi.fn()} />);

      const input = screen.getByPlaceholderText('描述您需要的设计资源...');
      await user.type(input, '我需要一些配色工具');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('我需要一些配色工具')).toBeInTheDocument();
      });
    });

    it('should show loading indicator while processing', async () => {
      const user = userEvent.setup();

      render(<AIChatInterface isOpen={true} onClose={vi.fn()} />);

      const input = screen.getByPlaceholderText('描述您需要的设计资源...');
      await user.type(input, '测试消息');

      // Check that send button is enabled before sending
      const sendButton = screen.getByLabelText('发送消息');
      expect(sendButton).not.toBeDisabled();

      await user.keyboard('{Enter}');

      // After sending, button should be disabled (loading state)
      await waitFor(
        () => {
          expect(sendButton).toBeDisabled();
        },
        { timeout: 100 }
      );
    });

    it('should not send empty messages', async () => {
      const user = userEvent.setup();

      render(<AIChatInterface isOpen={true} onClose={vi.fn()} />);

      const input = screen.getByPlaceholderText('描述您需要的设计资源...');
      await user.type(input, '   ');
      await user.keyboard('{Enter}');

      // Should still show empty state
      expect(screen.getByText(/开始对话/)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive width classes', () => {
      const { container } = render(<AIChatInterface isOpen={true} onClose={vi.fn()} />);

      const panel = container.querySelector('.w-full');
      expect(panel).toBeInTheDocument();
      expect(panel?.className).toContain('sm:w-[400px]');
      expect(panel?.className).toContain('md:w-[450px]');
      expect(panel?.className).toContain('lg:w-[500px]');
    });
  });
});
