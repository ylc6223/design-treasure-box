'use client';

import { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatContainerRoot, ChatContainerContent } from '@/components/prompt-kit/chat-container';
import { Message, MessageContent } from '@/components/prompt-kit/message';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]); // 只依赖 initialQuery，避免无限循环

  // 处理澄清问题回答（简化版 - 直接发送选中的选项）
  const handleClarificationAnswer = (answer: string) => {
    // 将回答作为用户消息添加到对话中，并立即发送查询
    const userMessage: ExtendedChatMessage = {
      id: `user-${Date.now()}`,
      sessionId: 'default',
      type: 'user',
      content: answer,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // 直接发送选中的选项作为新查询
    handleSendMessage(answer, true);
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
          conversationHistory: messages.map((msg) => ({
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
              mass: 0.8,
            }}
            className={cn(
              'fixed top-0 right-0 h-full bg-background/95 backdrop-blur-xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] z-50',
              'flex flex-col border-l border-border/40',
              // Responsive layout
              'w-full',
              // Tablet & Desktop: fixed width
              'sm:w-[340px] lg:w-[380px] xl:w-[400px]'
            )}
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex items-center justify-between px-6 py-5 border-b border-border/40 shrink-0"
            >
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold tracking-tight">AI 设计助手</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <p className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wider">
                    在线交流中
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  'p-2 hover:bg-accent rounded-full transition-all duration-200 shrink-0 ml-2 group',
                  'hover:rotate-90'
                )}
                aria-label="关闭聊天"
              >
                <X className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
              </button>
            </motion.div>

            {/* Chat Container */}
            <div className="flex-1 overflow-hidden relative">
              <ChatContainerRoot className="h-full">
                <ChatContainerContent className={cn('space-y-8 py-8 px-6', 'scrollbar-hide')}>
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
                    const hasClarificationQuestions =
                      message.clarificationQuestions && message.clarificationQuestions.length > 0;

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: index * 0.05,
                          duration: 0.3,
                          ease: 'easeOut',
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
                              {/* 澄清问题 - 快速回复按钮（一次显示所有选项） */}
                              {hasClarificationQuestions ? (
                                <ClarificationMessage
                                  questions={message.clarificationQuestions!}
                                  onAnswerSelect={handleClarificationAnswer}
                                />
                              ) : (
                                <>
                                  {/* 文本内容 - 只在没有澄清问题时显示 */}
                                  {message.content && (
                                    <MessageContent
                                      className={cn(
                                        'text-foreground prose w-full min-w-0 flex-1 rounded-2xl bg-secondary/50 backdrop-blur-sm',
                                        'p-4 text-sm leading-relaxed border border-border/30'
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
                              <MessageContent
                                className={cn(
                                  'bg-primary text-primary-foreground rounded-2xl whitespace-pre-wrap font-medium',
                                  'max-w-[90%] sm:max-w-[85%] px-4 py-2.5 text-sm shadow-sm'
                                )}
                              >
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
              className="p-6 border-t border-border/40 shrink-0 bg-background/50"
            >
              <PromptInput
                isLoading={isLoading}
                value={input}
                onValueChange={setInput}
                onSubmit={handleSubmit}
                className="border-input bg-background relative w-full rounded-3xl border p-0 pt-1 shadow-sm transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
              >
                <div className="flex flex-col">
                  <PromptInputTextarea
                    placeholder="试着问问：找一些简约风格的配色网站..."
                    className="min-h-[44px] pt-3 px-4 leading-[1.5] text-sm placeholder:text-muted-foreground/50"
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
