'use client';

import { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import {
  ChatContainerRoot,
  ChatContainerContent,
} from '@/components/prompt-kit/chat-container';
import {
  Message,
  MessageContent,
} from '@/components/prompt-kit/message';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
} from '@/components/prompt-kit/prompt-input';
import { DotsLoader } from '@/components/prompt-kit/loader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ExtendedChatMessage, ResourceRecommendation } from '@/types/ai-chat';
import type { Resource } from '@/types';
import { ResourceMessage } from '@/components/ai-chat/resource-message';
import { ClarificationMessage } from '@/components/ai-chat/clarification-message';

interface AIChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function AIChatInterface({ isOpen, onClose, initialQuery }: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with initial query if provided
  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ExtendedChatMessage = {
      id: `user-${Date.now()}`,
      sessionId: 'default',
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // TODO: Integrate with RAG engine
    // For now, just a placeholder response
    setTimeout(() => {
      const assistantMessage: ExtendedChatMessage = {
        id: `assistant-${Date.now()}`,
        sessionId: 'default',
        type: 'assistant',
        content: '正在处理您的请求...',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleSubmit = () => {
    if (input.trim()) {
      handleSendMessage(input);
    }
  };

  // 处理资源操作
  const handleResourceClick = (resource: Resource) => {
    // 跳转到资源详情页
    window.location.href = `/resource/${resource.id}`;
  };

  const handleFavorite = (resourceId: string) => {
    // TODO: 集成收藏功能
    console.log('Favorite resource:', resourceId);
  };

  const handleVisit = (resourceId: string) => {
    // TODO: 打开资源链接
    console.log('Visit resource:', resourceId);
  };

  // 处理澄清问题
  const handleQuestionSelect = (question: string) => {
    handleSendMessage(question);
  };

  const handleCustomResponse = (response: string) => {
    handleSendMessage(response);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 transition-opacity duration-300 z-40',
          // Mobile: darker overlay for full-screen mode
          'bg-black/40',
          // Desktop: lighter overlay
          'sm:bg-black/20',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-label="关闭聊天界面"
      />

      {/* Chat Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full bg-background shadow-2xl transition-transform duration-300 ease-in-out z-50',
          'flex flex-col',
          // Responsive layout
          // Mobile: full screen
          'w-full',
          // Tablet: adjusted width (768px-1199px)
          'sm:w-[90%] sm:max-w-[400px] sm:border-l',
          // Desktop: fixed width panel (≥1200px)
          'lg:w-[450px] lg:max-w-[450px]',
          // XL: larger fixed width (≥1440px)
          'xl:w-[500px] xl:max-w-[500px]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">AI 设计助手</h2>
            <p className="text-sm text-muted-foreground truncate">为您推荐最合适的设计资源</p>
          </div>
          <button
            onClick={onClose}
            className={cn(
              'p-2 hover:bg-accent rounded-lg transition-colors shrink-0 ml-2',
              // Mobile: more prominent close button
              'sm:p-2'
            )}
            aria-label="关闭聊天"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Container */}
        <div className="flex-1 overflow-hidden relative">
          <ChatContainerRoot className="h-full">
            <ChatContainerContent className={cn(
              'space-y-6 py-6',
              // Responsive padding
              'px-3 sm:px-4'
            )}>
              {messages.length === 0 && (
                <div className={cn(
                  'text-center text-muted-foreground py-8',
                  // Responsive text size
                  'text-sm sm:text-base'
                )}>
                  <p>开始对话，我会帮您找到最合适的设计资源</p>
                </div>
              )}

              {messages.map((message) => {
                const isAssistant = message.type === 'assistant';
                const hasResources = message.resources && message.resources.length > 0;
                const hasClarificationQuestions = message.clarificationQuestions && message.clarificationQuestions.length > 0;

                return (
                  <Message
                    key={message.id}
                    className={cn(
                      'flex w-full flex-col gap-2',
                      isAssistant ? 'items-start' : 'items-end'
                    )}
                  >
                    {isAssistant ? (
                      <div className="group flex w-full flex-col gap-3">
                        {/* 文本内容 */}
                        {message.content && (
                          <MessageContent
                            className={cn(
                              'text-foreground prose w-full min-w-0 flex-1 rounded-lg bg-secondary',
                              // Responsive padding and text size
                              'p-2.5 sm:p-3 text-sm sm:text-base'
                            )}
                            markdown
                          >
                            {message.content}
                          </MessageContent>
                        )}

                        {/* 资源推荐 */}
                        {hasResources && (
                          <ResourceMessage
                            resources={message.resources as ResourceRecommendation[]}
                            onResourceClick={handleResourceClick}
                            onFavorite={handleFavorite}
                            onVisit={handleVisit}
                          />
                        )}

                        {/* 澄清问题 */}
                        {hasClarificationQuestions && (
                          <ClarificationMessage
                            questions={message.clarificationQuestions!}
                            onQuestionSelect={handleQuestionSelect}
                            onCustomResponse={handleCustomResponse}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="group flex w-full flex-col items-end gap-1">
                        <MessageContent className={cn(
                          'bg-primary text-primary-foreground rounded-3xl whitespace-pre-wrap',
                          // Responsive sizing
                          'max-w-[90%] sm:max-w-[85%] px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base'
                        )}>
                          {message.content}
                        </MessageContent>
                      </div>
                    )}
                  </Message>
                );
              })}

              {isLoading && (
                <Message className="flex w-full flex-col items-start gap-2">
                  <div className="group flex w-full flex-col gap-0">
                    <div className="text-foreground prose w-full min-w-0 flex-1 rounded-lg bg-transparent p-0">
                      <DotsLoader />
                    </div>
                  </div>
                </Message>
              )}
            </ChatContainerContent>
          </ChatContainerRoot>
        </div>

        {/* Input Area */}
        <div className={cn(
          'p-4 border-t shrink-0',
          // Mobile: slightly smaller padding
          'sm:p-4'
        )}>
          <PromptInput
            isLoading={isLoading}
            value={input}
            onValueChange={setInput}
            onSubmit={handleSubmit}
            className="border-input bg-background relative w-full rounded-3xl border p-0 pt-1 shadow-sm"
          >
            <div className="flex flex-col">
              <PromptInputTextarea
                placeholder="描述您需要的设计资源..."
                className={cn(
                  'min-h-[44px] pt-3 pl-4 leading-[1.3]',
                  // Responsive text size
                  'text-sm sm:text-base'
                )}
              />

              <PromptInputActions className="mt-2 flex w-full items-center justify-end gap-2 p-2">
                <Button
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  onClick={handleSubmit}
                  className={cn(
                    'rounded-full',
                    // Responsive button size
                    'size-8 sm:size-9'
                  )}
                  aria-label="发送消息"
                >
                  {isLoading ? (
                    <span className="size-3 rounded-xs bg-white" />
                  ) : (
                    <Send size={16} className="sm:size-[18px]" />
                  )}
                </Button>
              </PromptInputActions>
            </div>
          </PromptInput>
        </div>
      </div>
    </>
  );
}
