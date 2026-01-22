'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ExtendedChatMessage, ChatSession, ChatMessage } from '@/types/ai-chat';

const STORAGE_KEY = 'ai-chat-session';
const MAX_MESSAGES = 50;

export function useAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>('default');

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session: ChatSession = JSON.parse(stored);
        // 将ChatMessage转换为ExtendedChatMessage，添加sessionId
        // Note: clarificationQuestions types differ, so we omit it from the spread
        const extendedMessages: ExtendedChatMessage[] = session.messages.map((msg) => {
          const { clarificationQuestions: _, ...msgWithoutQuestions } = msg as any;
          return {
            ...msgWithoutQuestions,
            sessionId: session.id,
            timestamp: new Date(msg.timestamp), // 确保timestamp是Date对象
          };
        });
        setMessages(extendedMessages.slice(-MAX_MESSAGES));
        setSessionId(session.id);
      }
    } catch (error) {
      console.error('Failed to load chat session:', error);
    }
  }, []);

  // Save session to localStorage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        // 将ExtendedChatMessage转换为ChatMessage以符合ChatSession类型
        // Note: clarificationQuestions type differs, so we omit it
        const chatMessages: ChatMessage[] = messages.map((msg) => ({
          id: msg.id,
          type: msg.type,
          content: msg.content,
          timestamp: msg.timestamp,
          resources: msg.resources,
          // clarificationQuestions: msg.clarificationQuestions, // Type mismatch
          searchMetadata: msg.searchMetadata,
          isLoading: msg.isLoading,
        }));

        const session: ChatSession = {
          id: sessionId,
          messages: chatMessages.slice(-MAX_MESSAGES),
          createdAt: new Date(),
          updatedAt: new Date(),
          context: {},
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } catch (error) {
        console.error('Failed to save chat session:', error);
      }
    }
  }, [messages, sessionId]);

  const openChat = useCallback(
    (initialQuery?: string) => {
      setIsOpen(true);

      if (initialQuery && messages.length === 0) {
        const userMessage: ExtendedChatMessage = {
          id: `user-${Date.now()}`,
          sessionId,
          type: 'user',
          content: initialQuery,
          timestamp: new Date(),
        };
        setMessages([userMessage]);
      }
    },
    [messages.length, sessionId]
  );

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const addMessage = useCallback((message: ExtendedChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    isOpen,
    messages,
    sessionId,
    openChat,
    closeChat,
    addMessage,
    clearMessages,
  };
}
