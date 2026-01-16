'use client';

import * as React from 'react';
import { HelpCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface ClarificationMessageProps {
  questions: string[];
  onQuestionSelect: (question: string) => void;
  onCustomResponse: (response: string) => void;
  className?: string;
}

/**
 * ClarificationMessage 组件
 * 
 * 在聊天界面中显示AI的澄清问题
 * 用户可以：
 * - 点击预设问题快速回答
 * - 输入自定义回答
 */
export function ClarificationMessage({
  questions,
  onQuestionSelect,
  onCustomResponse,
  className,
}: ClarificationMessageProps) {
  const [showCustomInput, setShowCustomInput] = React.useState(false);
  const [customInput, setCustomInput] = React.useState('');

  const handleQuestionClick = (question: string) => {
    onQuestionSelect(question);
  };

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      onCustomResponse(customInput.trim());
      setCustomInput('');
      setShowCustomInput(false);
    }
  };

  if (questions.length === 0) {
    return null;
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* 标题 */}
      <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
        <HelpCircle className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">需要更多信息</span>
      </div>

      {/* 问题列表 */}
      <div className="space-y-2 p-4">
        <p className="text-sm text-muted-foreground mb-3">
          请选择或回答以下问题，帮助我更好地理解您的需求：
        </p>

        {/* 预设问题按钮 */}
        <div className="space-y-2">
          {questions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start text-left h-auto py-2.5 px-3 whitespace-normal"
              onClick={() => handleQuestionClick(question)}
            >
              <span className="text-sm">{question}</span>
            </Button>
          ))}
        </div>

        {/* 自定义回答区域 */}
        {!showCustomInput ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCustomInput(true)}
            className="w-full mt-2 gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm">自定义回答</span>
          </Button>
        ) : (
          <div className="mt-3 space-y-2">
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="输入您的回答..."
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCustomSubmit}
                disabled={!customInput.trim()}
                className="flex-1"
              >
                发送
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomInput('');
                }}
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
