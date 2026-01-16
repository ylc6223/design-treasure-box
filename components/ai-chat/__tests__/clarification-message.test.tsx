/**
 * ClarificationMessage 组件测试
 * Feature: ai-chat-assistant, Property 4: 模糊查询的引导式提问
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClarificationMessage } from '../clarification-message';

describe('ClarificationMessage', () => {
  const mockQuestions = [
    '您需要什么类型的设计资源？（UI灵感、字体资源还是色彩搭配）',
    '您的目标受众是什么？（年轻群体还是商务专业）',
    '您的使用场景是什么？',
  ];

  const mockHandlers = {
    onQuestionSelect: vi.fn(),
    onCustomResponse: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('应该渲染标题', () => {
      render(
        <ClarificationMessage
          questions={mockQuestions}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('需要更多信息')).toBeInTheDocument();
    });

    it('应该渲染提示文本', () => {
      render(
        <ClarificationMessage
          questions={mockQuestions}
          {...mockHandlers}
        />
      );

      expect(screen.getByText(/请选择或回答以下问题/)).toBeInTheDocument();
    });

    it('应该渲染所有问题按钮', () => {
      render(
        <ClarificationMessage
          questions={mockQuestions}
          {...mockHandlers}
        />
      );

      mockQuestions.forEach((question) => {
        expect(screen.getByText(question)).toBeInTheDocument();
      });
    });

    it('应该显示自定义回答按钮', () => {
      render(
        <ClarificationMessage
          questions={mockQuestions}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('自定义回答')).toBeInTheDocument();
    });
  });

  describe('问题选择', () => {
    it('应该在点击问题时调用 onQuestionSelect', () => {
      render(
        <ClarificationMessage
          questions={mockQuestions}
          {...mockHandlers}
        />
      );

      const firstQuestion = screen.getByText(mockQuestions[0]);
      fireEvent.click(firstQuestion);

      expect(mockHandlers.onQuestionSelect).toHaveBeenCalledWith(mockQuestions[0]);
    });

    it('应该为每个问题调用正确的回调', () => {
      render(
        <ClarificationMessage
          questions={mockQuestions}
          {...mockHandlers}
        />
      );

      mockQuestions.forEach((question) => {
        const button = screen.getByText(question);
        fireEvent.click(button);
        expect(mockHandlers.onQuestionSelect).toHaveBeenCalledWith(question);
      });
    });
  });

  describe('自定义回答', () => {
    it('应该在点击自定义回答按钮时显示输入框', () => {
      render(
        <ClarificationMessage
          questions={mockQuestions}
          {...mockHandlers}
        />
      );

      const customButton = screen.getByText('自定义回答');
      fireEvent.click(customButton);

      expect(screen.getByPlaceholderText('输入您的回答...')).toBeInTheDocument();
    });

    it('应该允许输入自定义回答', () => {
      render(
        <ClarificationMessage
          questions={mockQuestions}
          {...mockHandlers}
        />
      );

      const customButton = screen.getByText('自定义回答');
      fireEvent.click(customButton);

      const textarea = screen.getByPlaceholderText('输入您的回答...');
      fireEvent.change(textarea, { target: { value: '我需要配色工具' } });

      expect(textarea).toHaveValue('我需要配色工具');
    });

    it('应该在点击发送时调用 onCustomResponse', () => {
      render(
        <ClarificationMessage
          questions={mockQuestions}
          {...mockHandlers}
        />
      );

      const customButton = screen.getByText('自定义回答');
      fireEvent.click(customButton);

      const textarea = screen.getByPlaceholderText('输入您的回答...');
      fireEvent.change(textarea, { target: { value: '我需要配色工具' } });

      const sendButton = screen.getByText('发送');
      fireEvent.click(sendButton);

      expect(mockHandlers.onCustomResponse).toHaveBeenCalledWith('我需要配色工具');
    });

    it('应该在发送后清空输入框', () => {
      render(
        <ClarificationMessage
          questions={mockQuestions}
          {...mockHandlers}
        />
      );

      const customButton = screen.getByText('自定义回答');
      fireEvent.click(customButton);

      const textarea = screen.getByPlaceholderText('输入您的回答...');
      fireEvent.change(textarea, { target: { value: '我需要配色工具' } });

      const sendButton = screen.getByText('发送');
      fireEvent.click(sendButton);

      expect(screen.queryByPlaceholderText('输入您的回答...')).not.toBeInTheDocument();
    });

    it('应该在输入为空时禁用发送按钮', () => {
      render(
        <ClarificationMessage
          questions={mockQuestions}
          {...mockHandlers}
        />
      );

      const customButton = screen.getByText('自定义回答');
      fireEvent.click(customButton);

      const sendButton = screen.getByText('发送');
      expect(sendButton).toBeDisabled();
    });

    it('应该在输入有内容时启用发送按钮', () => {
      render(
        <ClarificationMessage
          questions={mockQuestions}
          {...mockHandlers}
        />
      );

      const customButton = screen.getByText('自定义回答');
      fireEvent.click(customButton);

      const textarea = screen.getByPlaceholderText('输入您的回答...');
      fireEvent.change(textarea, { target: { value: '我需要配色工具' } });

      const sendButton = screen.getByText('发送');
      expect(sendButton).not.toBeDisabled();
    });

    it('应该在点击取消时隐藏输入框', () => {
      render(
        <ClarificationMessage
          questions={mockQuestions}
          {...mockHandlers}
        />
      );

      const customButton = screen.getByText('自定义回答');
      fireEvent.click(customButton);

      const textarea = screen.getByPlaceholderText('输入您的回答...');
      fireEvent.change(textarea, { target: { value: '我需要配色工具' } });

      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);

      expect(screen.queryByPlaceholderText('输入您的回答...')).not.toBeInTheDocument();
      expect(screen.getByText('自定义回答')).toBeInTheDocument();
    });
  });

  describe('空状态', () => {
    it('应该在没有问题时不渲染任何内容', () => {
      const { container } = render(
        <ClarificationMessage
          questions={[]}
          {...mockHandlers}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('边界情况', () => {
    it('应该处理只有一个问题的情况', () => {
      render(
        <ClarificationMessage
          questions={[mockQuestions[0]]}
          {...mockHandlers}
        />
      );

      expect(screen.getByText(mockQuestions[0])).toBeInTheDocument();
      expect(screen.queryByText(mockQuestions[1])).not.toBeInTheDocument();
    });

    it('应该处理空白输入', () => {
      render(
        <ClarificationMessage
          questions={mockQuestions}
          {...mockHandlers}
        />
      );

      const customButton = screen.getByText('自定义回答');
      fireEvent.click(customButton);

      const textarea = screen.getByPlaceholderText('输入您的回答...');
      fireEvent.change(textarea, { target: { value: '   ' } });

      const sendButton = screen.getByText('发送');
      fireEvent.click(sendButton);

      expect(mockHandlers.onCustomResponse).not.toHaveBeenCalled();
    });
  });
});
