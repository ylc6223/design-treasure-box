'use client';

import { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  const [currentClarificationIndex, setCurrentClarificationIndex] = useState(0);
  const [clarificationAnswers, setClarificationAnswers] = useState<string[]>([]);

  // Initialize with initial query if provided
  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      handleSendMessage(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]); // 只依赖 initialQuery，避免无限循环

  // 处理澄清问题回答
  const handleClarificationAnswer = (answer: string) => {
    // 将回答作为用户消息添加到对话中
    const userMessage: ExtendedChatMessage = {
      id: `user-${Date.now()}`,
      sessionId: 'default',
      type: 'user',
      content: answer,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    
    // 保存回答
    const newAnswers = [...clarificationAnswers, answer];
    setClarificationAnswers(newAnswers);

    // 获取当前消息中的澄清问题
    const lastAssistantMessage = messages.filter(m => m.type === 'assistant').pop();
    const clarificationQuestions = lastAssistantMessage?.clarificationQuestions || [];

    // 检查是否还有更多问题
    if (currentClarificationIndex + 1 < clarificationQuestions.length) {
      // 移动到下一个问题
      setCurrentClarificationIndex(currentClarificationIndex + 1);
    } else {
      // 所有问题都回答完毕，发送完整的查询
      const originalQuery = messages.find(m => m.type === 'user')?.content || '';
      const fullQuery = `${originalQuery} ${newAnswers.join(' ')}`.trim();
      
      // 重置状态
      setCurrentClarificationIndex(0);
      setClarificationAnswers([]);
      
      // 发送完整查询
      handleSendMessage(fullQuery, true);
    }
  };

  // 处理跳过澄清问题
  const handleSkipClarification = () => {
    const lastAssistantMessage = messages.filter(m => m.type === 'assistant').pop();
    const clarificationQuestions = lastAssistantMessage?.clarificationQuestions || [];

    // 检查是否还有更多问题
    if (currentClarificationIndex + 1 < clarificationQuestions.length) {
      // 移动到下一个问题
      setCurrentClarificationIndex(currentClarificationIndex + 1);
    } else {
      // 直接搜索，使用已有的回答
      const originalQuery = messages.find(m => m.type === 'user')?.content || '';
      const fullQuery = clarificationAnswers.length > 0 
        ? `${originalQuery} ${clarificationAnswers.join(' ')}`.trim()
        : originalQuery;
      
      // 重置状态
      setCurrentClarificationIndex(0);
      setClarificationAnswers([]);
      
      // 发送查询
      handleSendMessage(fullQuery, true);
    }
  };

  const handleSendMessage = async (content: string, skipClarification = false) => {
    if (!content.trim()) return;

    // 如果不是跳过澄清的情况，添加用户消息
    if (!skipClarification) {
      const userMessage: ExtendedChatMessage = {
        id: `user-${Date.now()}`,
        sessionId: 'default',
        type: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
    }
    
    setIsLoading(true);

    try {
      // 调用后端 API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: content.trim(),
          filters: {
            maxResults: 5,
          },
          conversationHistory: messages.map(msg => ({
            type: msg.type,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Unknown error occurred');
      }

      // 构建助手消息
      const assistantMessage: ExtendedChatMessage = {
        id: `assistant-${Date.now()}`,
        sessionId: 'default',
        type: 'assistant',
        content: data.data.content,
        timestamp: new Date(),
        resources: data.data.searchResults?.map((result: any) => ({
          resource: result.resource,
          relevanceScore: result.similarity,
          matchReason: result.matchReason,
          matchedAspects: [],
          confidence: result.similarity,
        })),
        clarificationQuestions: data.data.clarificationQuestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // 显示错误消息
      const errorMessage: ExtendedChatMessage = {
        id: `error-${Date.now()}`,
        sessionId: 'default',
        type: 'assistant',
        content: `抱歉，处理您的请求时出现错误：${error instanceof Error ? error.message : '未知错误'}。请稍后重试。`,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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



  return (
    <>
      {/* Overlay with fade animation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'fixed inset-0 z-40',
              // Mobile: darker overlay for full-screen mode
              'bg-black/40',
              // Desktop: lighter overlay
              'sm:bg-black/20'
            )}
            onClick={onClose}
            aria-label="关闭聊天界面"
          />
        )}
      </AnimatePresence>

      {/* Chat Panel with slide animation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ 
              type: 'spring',
              damping: 30,
              stiffness: 300,
              mass: 0.8
            }}
            className={cn(
              'fixed top-0 right-0 h-full bg-background shadow-2xl z-50',
              'flex flex-col',
              // Responsive layout
              // Mobile: full screen
              'w-full',
              // Tablet: adjusted width (768px-1199px)
              'sm:w-[90%] sm:max-w-[400px] sm:border-l',
              // Desktop: fixed width panel (≥1200px)
              'lg:w-[450px] lg:max-w-[450px]',
              // XL: larger fixed width (≥1440px)
              'xl:w-[500px] xl:max-w-[500px]'
            )}
          >
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex items-center justify-between p-4 border-b shrink-0"
        >
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
        </motion.div>

        {/* Chat Container */}
        <div className="flex-1 overflow-hidden relative">
          <ChatContainerRoot className="h-full">
            <ChatContainerContent className={cn(
              'space-y-6 py-6',
              // Responsive padding
              'px-3 sm:px-4'
            )}>
              {messages.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className={cn(
                    'text-center text-muted-foreground py-8',
                    // Responsive text size
                    'text-sm sm:text-base'
                  )}
                >
                  <p>开始对话，我会帮您找到最合适的设计资源</p>
                </motion.div>
              )}

              {messages.map((message, index) => {
                const isAssistant = message.type === 'assistant';
                const hasResources = message.resources && message.resources.length > 0;
                const hasClarificationQuestions = message.clarificationQuestions && message.clarificationQuestions.length > 0;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: index * 0.05,
                      duration: 0.3,
                      ease: 'easeOut'
                    }}
                  >
                    <Message
                      className={cn(
                        'flex w-full flex-col gap-2',
                        isAssistant ? 'items-start' : 'items-end'
                      )}
                    >
                    {isAssistant ? (
                      <div className="group flex w-full flex-col gap-3">
                        {/* 澄清问题 - 步骤式显示 */}
                        {hasClarificationQuestions ? (
                          <ClarificationMessage
                            questions={message.clarificationQuestions!}
                            currentQuestionIndex={currentClarificationIndex}
                            onAnswerSelect={handleClarificationAnswer}
                            onSkip={handleSkipClarification}
                          />
                        ) : (
                          <>
                            {/* 文本内容 - 只在没有澄清问题时显示 */}
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
                          </>
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
                  </motion.div>
                );
              })}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Message className="flex w-full flex-col items-start gap-2">
                    <div className="group flex w-full flex-col gap-0">
                      <div className="text-foreground prose w-full min-w-0 flex-1 rounded-lg bg-transparent p-0">
                        <DotsLoader />
                      </div>
                    </div>
                  </Message>
                </motion.div>
              )}
            </ChatContainerContent>
          </ChatContainerRoot>
        </div>

        {/* Input Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className={cn(
            'p-4 border-t shrink-0',
            // Mobile: slightly smaller padding
            'sm:p-4'
          )}
        >
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
        </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
