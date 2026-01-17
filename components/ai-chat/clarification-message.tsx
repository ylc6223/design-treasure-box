'use client';

import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ClarificationQuestion {
  question: string;
  options: string[];
  aspect: 'category' | 'style' | 'audience' | 'purpose';
}

export interface ClarificationMessageProps {
  questions: ClarificationQuestion[];
  onAnswerSelect: (answer: string) => void;
  className?: string;
}

/**
 * ClarificationMessage 组件（快速回复按钮版本）
 * 
 * 一次性显示所有澄清选项的快速回复按钮组
 * - 移除步骤式逻辑，一次显示所有问题和选项
 * - 圆角胶囊样式按钮（rounded-full）
 * - 依次出现动画（每个按钮延迟 0.05s）
 * - 用户可以点击任意选项或直接在输入框输入
 * 
 * @param questions - 澄清问题数组
 * @param onAnswerSelect - 选项选择回调
 * @param className - 额外的 CSS 类名
 */
export function ClarificationMessage({
  questions,
  onAnswerSelect,
  className,
}: ClarificationMessageProps) {
  if (questions.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex w-full flex-col gap-4', className)}>
      {questions.map((q, qIndex) => (
        <motion.div
          key={qIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: qIndex * 0.1, duration: 0.3 }}
          className="space-y-2"
        >
          {/* 问题文本 */}
          <p className="text-sm text-muted-foreground">{q.question}</p>

          {/* 快速回复按钮 */}
          <div className="flex flex-wrap gap-2">
            {q.options.map((option, optIndex) => (
              <motion.div
                key={optIndex}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: qIndex * 0.1 + optIndex * 0.05, duration: 0.2 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'rounded-full text-sm',
                    'hover:bg-primary hover:text-primary-foreground',
                    'transition-colors'
                  )}
                  onClick={() => onAnswerSelect(option)}
                >
                  {option}
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
