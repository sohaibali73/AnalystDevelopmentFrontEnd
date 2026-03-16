/**
 * @deprecated This hook is NOT used anywhere in the app. All chat pages use
 * `useChat` from `@ai-sdk/react` directly. This file can be safely deleted.
 *
 * useAIChatV6 - Simplified AI SDK v6 hook using direct Data Stream Protocol
 * 
 * Uses the new /api/chat/v6 endpoint that bypasses protocol translation
 * for cleaner, more maintainable AI SDK integration.
 */

'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseAIChatV6Options {
  conversationId?: string | null;
  onConversationCreated?: (id: string) => void;
  onError?: (error: Error) => void;
}

export interface UseAIChatV6Return {
  messages: any[];
  isLoading: boolean;
  isStreaming: boolean;
  error: Error | undefined;
  sendMessage: (content: string) => void;
  stopStreaming: () => void;
  clearMessages: () => void;
  conversationId: string | null;
  status: string;
  regenerate: () => void;
  stop: () => void;
}

export function useAIChatV6(options: UseAIChatV6Options = {}): UseAIChatV6Return {
  const { 
    conversationId: initialConversationId = null, 
    onConversationCreated,
    onError,
  } = options;

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(initialConversationId);
  const conversationIdRef = useRef(currentConversationId);

  // Keep ref in sync
  useEffect(() => {
    conversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  // Update conversation ID when prop changes
  useEffect(() => {
    if (initialConversationId !== undefined) {
      setCurrentConversationId(initialConversationId);
    }
  }, [initialConversationId]);

  // Get auth token
  const getAuthToken = useCallback(() => {
    try {
      return localStorage.getItem('auth_token') || '';
    } catch {
      return '';
    }
  }, []);

  // Initialize useChat with UI Message Stream endpoint
  const chatResult = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',  // UI Message Stream protocol (SSE with x-vercel-ai-ui-message-stream: v1)
      headers: () => ({
        'Authorization': `Bearer ${getAuthToken()}`,
      }),
      body: () => ({
        conversationId: conversationIdRef.current,
      }),
    }),
    
    onFinish: ({ message }) => {
      // Artifacts and tool outputs are now handled automatically by AI SDK
      console.log('Message finished:', message);
    },
    
    onError: (error) => {
      console.error('AI Chat streaming error:', error);
      onError?.(error);
    },
  });

  // Extract values from chatResult
  const messages = chatResult.messages || [];
  const status = chatResult.status;
  const error = chatResult.error;
  const setMessages = chatResult.setMessages;
  const chatSendMessage = chatResult.sendMessage;
  const stopFn = chatResult.stop;
  const regenerateFn = chatResult.regenerate;

  // Derive loading/streaming states
  const isLoading = status === 'submitted' || status === 'streaming';
  const isStreaming = status === 'streaming';

  // Send message using v6 sendMessage({ text })
  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;
    
    if (chatSendMessage) {
      chatSendMessage(
        { text: content },
        { body: { conversationId: conversationIdRef.current } }
      );
    }
  }, [chatSendMessage]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (stopFn) stopFn();
  }, [stopFn]);

  // Clear messages
  const clearMessages = useCallback(() => {
    if (setMessages) setMessages([]);
  }, [setMessages]);

  // Regenerate last message
  const regenerate = useCallback(() => {
    if (regenerateFn) regenerateFn();
  }, [regenerateFn]);

  // Stop alias
  const stop = useCallback(() => {
    if (stopFn) stopFn();
  }, [stopFn]);

  return {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
    conversationId: currentConversationId,
    status,
    regenerate,
    stop,
  };
}

export default useAIChatV6;