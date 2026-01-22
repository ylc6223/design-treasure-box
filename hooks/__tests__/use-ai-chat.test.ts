import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIChat } from '@/hooks/use-ai-chat';
import type { ExtendedChatMessage } from '@/types/ai-chat';

describe('useAIChat', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should initialize with closed state', () => {
      const { result } = renderHook(() => useAIChat());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.messages).toEqual([]);
      expect(result.current.sessionId).toBe('default');
    });

    it('should load session from localStorage if available', () => {
      const mockSession = {
        id: 'test-session',
        messages: [
          {
            id: 'msg-1',
            sessionId: 'test-session',
            type: 'user' as const,
            content: 'Test message',
            timestamp: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        context: {},
      };

      localStorage.setItem('ai-chat-session', JSON.stringify(mockSession));

      const { result } = renderHook(() => useAIChat());

      expect(result.current.messages.length).toBe(1);
      expect(result.current.sessionId).toBe('test-session');
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('ai-chat-session', 'invalid json');

      const { result } = renderHook(() => useAIChat());

      expect(result.current.messages).toEqual([]);
      expect(result.current.sessionId).toBe('default');
    });
  });

  describe('Opening and Closing Chat', () => {
    it('should open chat when openChat is called', () => {
      const { result } = renderHook(() => useAIChat());

      act(() => {
        result.current.openChat();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should close chat when closeChat is called', () => {
      const { result } = renderHook(() => useAIChat());

      act(() => {
        result.current.openChat();
      });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.closeChat();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should add initial query message when opening with query', () => {
      const { result } = renderHook(() => useAIChat());

      act(() => {
        result.current.openChat('推荐一些图标资源');
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0].content).toBe('推荐一些图标资源');
      expect(result.current.messages[0].type).toBe('user');
    });

    it('should not add duplicate initial query if messages already exist', () => {
      const { result } = renderHook(() => useAIChat());

      // Add a message first
      act(() => {
        const message: ExtendedChatMessage = {
          id: 'msg-1',
          sessionId: 'default',
          type: 'user',
          content: 'Existing message',
          timestamp: new Date(),
        };
        result.current.addMessage(message);
      });

      // Try to open with initial query
      act(() => {
        result.current.openChat('New query');
      });

      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0].content).toBe('Existing message');
    });
  });

  describe('Message Management', () => {
    it('should add message to the list', () => {
      const { result } = renderHook(() => useAIChat());

      const message: ExtendedChatMessage = {
        id: 'msg-1',
        sessionId: 'default',
        type: 'user',
        content: 'Test message',
        timestamp: new Date(),
      };

      act(() => {
        result.current.addMessage(message);
      });

      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0]).toEqual(message);
    });

    it('should add multiple messages in order', () => {
      const { result } = renderHook(() => useAIChat());

      const message1: ExtendedChatMessage = {
        id: 'msg-1',
        sessionId: 'default',
        type: 'user',
        content: 'First message',
        timestamp: new Date(),
      };

      const message2: ExtendedChatMessage = {
        id: 'msg-2',
        sessionId: 'default',
        type: 'assistant',
        content: 'Second message',
        timestamp: new Date(),
      };

      act(() => {
        result.current.addMessage(message1);
        result.current.addMessage(message2);
      });

      expect(result.current.messages.length).toBe(2);
      expect(result.current.messages[0].content).toBe('First message');
      expect(result.current.messages[1].content).toBe('Second message');
    });

    it('should clear all messages', () => {
      const { result } = renderHook(() => useAIChat());

      const message: ExtendedChatMessage = {
        id: 'msg-1',
        sessionId: 'default',
        type: 'user',
        content: 'Test message',
        timestamp: new Date(),
      };

      act(() => {
        result.current.addMessage(message);
      });

      expect(result.current.messages.length).toBe(1);

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages.length).toBe(0);
      expect(localStorage.getItem('ai-chat-session')).toBeNull();
    });
  });

  describe('Session Persistence', () => {
    it('should save session to localStorage when messages are added', () => {
      const { result } = renderHook(() => useAIChat());

      const message: ExtendedChatMessage = {
        id: 'msg-1',
        sessionId: 'default',
        type: 'user',
        content: 'Test message',
        timestamp: new Date(),
      };

      act(() => {
        result.current.addMessage(message);
      });

      const stored = localStorage.getItem('ai-chat-session');
      expect(stored).not.toBeNull();

      if (stored) {
        const session = JSON.parse(stored);
        expect(session.messages.length).toBe(1);
        expect(session.messages[0].content).toBe('Test message');
      }
    });

    it('should limit stored messages to MAX_MESSAGES (50)', () => {
      const { result } = renderHook(() => useAIChat());

      // Add 60 messages
      act(() => {
        for (let i = 0; i < 60; i++) {
          const message: ExtendedChatMessage = {
            id: `msg-${i}`,
            sessionId: 'default',
            type: 'user',
            content: `Message ${i}`,
            timestamp: new Date(),
          };
          result.current.addMessage(message);
        }
      });

      const stored = localStorage.getItem('ai-chat-session');
      expect(stored).not.toBeNull();

      if (stored) {
        const session = JSON.parse(stored);
        expect(session.messages.length).toBe(50);
        // Should keep the most recent 50 messages
        expect(session.messages[0].content).toBe('Message 10');
        expect(session.messages[49].content).toBe('Message 59');
      }
    });

    it('should handle localStorage errors gracefully', () => {
      const { result } = renderHook(() => useAIChat());

      // Mock localStorage.setItem to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const message: ExtendedChatMessage = {
        id: 'msg-1',
        sessionId: 'default',
        type: 'user',
        content: 'Test message',
        timestamp: new Date(),
      };

      // Should not throw
      expect(() => {
        act(() => {
          result.current.addMessage(message);
        });
      }).not.toThrow();

      // Restore original
      localStorage.setItem = originalSetItem;
    });
  });
});
