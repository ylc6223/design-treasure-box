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
import type { ExtendedChatMessage } from '@/types/ai-chat';

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

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/20 transition-opacity duration-300 z-40',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Chat Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full bg-background border-l shadow-2xl transition-transform duration-300 ease-in-out z-50',
          'flex flex-col',
          // Responsive widths
          'w-full sm:w-[400px] md:w-[450px] lg:w-[500px]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div>
            <h2 className="text-lg font-semibold">AI 设计助手</h2>
            <p className="text-sm text-muted-foreground">为您推荐最合适的设计资源</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            aria-label="关闭聊天"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Container */}
        <div className="flex-1 overflow-hidden relative">
          <ChatContainerRoot className="h-full">
            <ChatContainerContent className="space-y-6 px-4 py-6">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <p>开始对话，我会帮您找到最合适的设计资源</p>
                </div>
              )}

              {messages.map((message, index) => {
                const isAssistant = message.type === 'assistant';
                const isLastMessage = index === messages.length - 1;

                return (
                  <Message
                    key={message.id}
                    className={cn(
                      'flex w-full flex-col gap-2',
                      isAssistant ? 'items-start' : 'items-end'
                    )}
                  >
                    {isAssistant ? (
                      <div className="group flex w-full flex-col gap-0">
                        <MessageContent
                          className="text-foreground prose w-full min-w-0 flex-1 rounded-lg bg-secondary p-3"
                          markdown
                        >
                          {message.content}
                        </MessageContent>
                      </div>
                    ) : (
                      <div className="group flex w-full flex-col items-end gap-1">
                        <MessageContent className="bg-primary text-primary-foreground max-w-[85%] rounded-3xl px-4 py-2.5 whitespace-pre-wrap">
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
        <div className="p-4 border-t shrink-0">
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
                className="min-h-[44px] pt-3 pl-4 text-base leading-[1.3]"
              />

              <PromptInputActions className="mt-2 flex w-full items-center justify-end gap-2 p-2">
                <Button
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  onClick={handleSubmit}
                  className="size-9 rounded-full"
                  aria-label="发送消息"
                >
                  {isLoading ? (
                    <span className="size-3 rounded-xs bg-white" />
                  ) : (
                    <Send size={18} />
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
