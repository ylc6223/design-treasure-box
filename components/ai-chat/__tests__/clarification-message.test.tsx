/**
 * ClarificationMessage 组件测试（快速回复按钮版本）
 *
 * Feature: ai-chat-assistant, Property 4: 模糊查询的引导式提问
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClarificationMessage } from '../clarification-message';

describe('ClarificationMessage - 快速回复按钮版本', () => {
  const mockQuestions = [
    {
      question: '您需要什么类型的设计资源？',
      options: ['UI灵感', '字体资源', '色彩搭配'],
      aspect: 'category' as const,
    },
    {
      question: '您偏好什么风格？',
      options: ['现代简约', '复古经典', '未来科技'],
      aspect: 'style' as const,
    },
  ];

  const mockHandlers = {
    onAnswerSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('渲染', () => {
    it('应该一次性渲染所有问题', () => {
      render(<ClarificationMessage questions={mockQuestions} {...mockHandlers} />);

      // 应该显示所有问题文本
      expect(screen.getByText('您需要什么类型的设计资源？')).toBeInTheDocument();
      expect(screen.getByText('您偏好什么风格？')).toBeInTheDocument();
    });

    it('应该一次性渲染所有选项按钮', () => {
      render(<ClarificationMessage questions={mockQuestions} {...mockHandlers} />);

      // 第一个问题的选项
      expect(screen.getByRole('button', { name: 'UI灵感' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '字体资源' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '色彩搭配' })).toBeInTheDocument();

      // 第二个问题的选项
      expect(screen.getByRole('button', { name: '现代简约' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '复古经典' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '未来科技' })).toBeInTheDocument();
    });

    it('应该使用圆角胶囊样式', () => {
      render(<ClarificationMessage questions={mockQuestions} {...mockHandlers} />);

      const button = screen.getByRole('button', { name: 'UI灵感' });
      expect(button).toHaveClass('rounded-full');
    });
  });

  describe('交互', () => {
    it('应该在点击选项时调用 onAnswerSelect', () => {
      render(<ClarificationMessage questions={mockQuestions} {...mockHandlers} />);

      const button = screen.getByRole('button', { name: 'UI灵感' });
      fireEvent.click(button);

      expect(mockHandlers.onAnswerSelect).toHaveBeenCalledWith('UI灵感');
      expect(mockHandlers.onAnswerSelect).toHaveBeenCalledTimes(1);
    });

    it('应该为每个选项调用正确的回调', () => {
      render(<ClarificationMessage questions={mockQuestions} {...mockHandlers} />);

      // 点击第一个问题的选项
      fireEvent.click(screen.getByRole('button', { name: '字体资源' }));
      expect(mockHandlers.onAnswerSelect).toHaveBeenCalledWith('字体资源');

      // 点击第二个问题的选项
      fireEvent.click(screen.getByRole('button', { name: '现代简约' }));
      expect(mockHandlers.onAnswerSelect).toHaveBeenCalledWith('现代简约');
    });
  });

  describe('边界情况', () => {
    it('应该在没有问题时不渲染任何内容', () => {
      const { container } = render(<ClarificationMessage questions={[]} {...mockHandlers} />);

      expect(container.firstChild).toBeNull();
    });

    it('应该处理只有一个问题的情况', () => {
      render(<ClarificationMessage questions={[mockQuestions[0]]} {...mockHandlers} />);

      expect(screen.getByText('您需要什么类型的设计资源？')).toBeInTheDocument();
      expect(screen.queryByText('您偏好什么风格？')).not.toBeInTheDocument();
    });
  });
});
