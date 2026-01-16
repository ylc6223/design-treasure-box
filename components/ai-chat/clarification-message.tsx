'use client';

import { Button } from '@/components/ui/button';
import { MessageContent } from '@/components/prompt-kit/message';
import { cn } from '@/lib/utils';

export interface ClarificationQuestion {
  question: string;
  options: string[];
  aspect: 'category' | 'style' | 'audience' | 'purpose';
}

export interface ClarificationMessageProps {
  questions: ClarificationQuestion[];
  currentQuestionIndex: number;
  onAnswerSelect: (answer: string) => void;
  onSkip: () => void;
  className?: string;
}

/**
 * ClarificationMessage 组件
 * 
 * 步骤式引导提问组件
 * - 一次只显示一个问题
 * - 选项以陈述句形式呈现
 * - 用户点击后作为回答发送
 */
export function ClarificationMessage({
  questions,
  currentQuestionIndex,
  onAnswerSelect,
  onSkip,
  className,
}: ClarificationMessageProps) {
  if (questions.length === 0 || currentQuestionIndex >= questions.length) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      {/* AI 问题 */}
      <MessageContent
        className={cn(
          'text-foreground prose w-full min-w-0 flex-1 rounded-lg bg-secondary',
          'p-2.5 sm:p-3 text-sm sm:text-base'
        )}
      >
        {currentQuestion.question}
      </MessageContent>

      {/* 选项按钮 */}
      <div className="flex flex-col gap-2 pl-2">
        {currentQuestion.options.map((option, index) => (
          <Button
            key={index}
            variant="outline"
            className="justify-start text-left h-auto py-2.5 px-3 whitespace-normal hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => onAnswerSelect(option)}
          >
            <span className="text-sm">{option}</span>
          </Button>
        ))}

        {/* 跳过按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
          className="mt-1 text-muted-foreground hover:text-foreground"
        >
          {isLastQuestion ? '直接搜索' : '跳过这个问题'}
        </Button>
      </div>
    </div>
  );
}
