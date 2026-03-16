/**
 * @deprecated This hook is NOT used anywhere in the app. ChatPage, AFLGeneratorPage,
 * and ReverseEngineerPage all use `useChat` from `@ai-sdk/react` directly with
 * `DefaultChatTransport`. This file is kept for reference but can be safely deleted.
 * 
 * useAIChat - Vercel AI SDK v6 streaming chat hook for Potomac Analyst
 * 
 * Uses useChat from @ai-sdk/react with DefaultChatTransport for v6 compatibility.
 * Uses sendMessage() for reliable message sending per v6 docs.
 */

'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Artifact } from '@/types/api';

// Helper: extract text content from a UIMessage's parts array
function getMessageText(message: UIMessage): string {
  if (!message.parts) return '';
  return message.parts
    .filter((p: any) => p.type === 'text')
    .map((p: any) => p.text || '')
    .join('');
}

// Extract artifacts from message content (code blocks)
function extractArtifactsFromContent(content: string, messageId: string): Artifact[] {
  const artifacts: Artifact[] = [];
  if (!content || !content.includes('```')) return artifacts;

  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  let index = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || 'code';
    const code = match[2].trim();
    if (!code) continue;

    let type: Artifact['type'] = 'code';
    const langLower = language.toLowerCase();

    if (['jsx', 'tsx', 'react'].includes(langLower)) type = 'react';
    else if (['javascript', 'js'].includes(langLower)) type = 'react';
    else if (langLower === 'html') type = 'html';
    else if (langLower === 'svg') type = 'svg';
    else if (langLower === 'mermaid') type = 'mermaid';

    artifacts.push({
      id: `${messageId}-artifact-${index}`,
      type,
      language,
      code,
      title: `${language.toUpperCase()} Code`,
      complete: true,
    });
    index++;
  }
  return artifacts;
}

export interface UseAIChatOptions {
  conversationId?: string | null;
  onConversationCreated?: (id: string) => void;
  onArtifactsDetected?: (artifacts: Artifact[]) => void;
  onError?: (error: Error) => void;
}

export interface UseAIChatReturn {
  messages: UIMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error: Error | undefined;
  sendMessage: (content: string) => void;
  stopStreaming: () => void;
  clearMessages: () => void;
  artifacts: Artifact[];
  conversationId: string | null;
}

export function useAIChat(options: UseAIChatOptions = {}): UseAIChatReturn {
  const { 
    conversationId: initialConversationId = null, 
    onConversationCreated,
    onArtifactsDetected,
    onError,
  } = options;

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(initialConversationId);
  const [streamArtifacts, setStreamArtifacts] = useState<Artifact[]>([]);
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

  // Initialize useChat with v6 transport-based API
  const chatResult = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      headers: () => {
        const token = getAuthToken();
        return {
          'Authorization': token ? `Bearer ${token}` : '',
        };
      },
      body: () => ({
        conversationId: conversationIdRef.current,
      }),
    }),
    
    onFinish: ({ message }) => {
      // Extract text from parts for artifact detection
      const text = getMessageText(message);
      if (text) {
        const extracted = extractArtifactsFromContent(text, message.id);
        if (extracted.length > 0) {
          setStreamArtifacts(prev => {
            const merged = new Map(prev.map(a => [a.id, a]));
            extracted.forEach(a => merged.set(a.id, a));
            return Array.from(merged.values());
          });
          onArtifactsDetected?.(extracted);
        }
      }
    },
    
    onError: (error) => {
      console.error('AI Chat streaming error:', error);
      onError?.(error);
    },
  });

  // Extract values from chatResult using v6 API
  const messages = chatResult.messages || [];
  const status = chatResult.status;
  const error = chatResult.error;
  const setMessages = chatResult.setMessages;
  const chatSendMessage = chatResult.sendMessage;
  const stopFn = chatResult.stop;

  // Derive loading/streaming states from v6 status
  const isLoading = status === 'submitted' || status === 'streaming';
  const isStreaming = status === 'streaming';

  // Combined artifacts from stream + message history
  const artifacts = useMemo(() => {
    const allArtifacts = [...streamArtifacts];
    for (const msg of messages) {
      if (msg.role === 'assistant') {
        const text = getMessageText(msg);
        if (text) {
          const extracted = extractArtifactsFromContent(text, msg.id);
          for (const artifact of extracted) {
            if (!allArtifacts.some(a => a.id === artifact.id)) {
              allArtifacts.push(artifact);
            }
          }
        }
      }
    }
    return allArtifacts;
  }, [messages, streamArtifacts]);

  // Send message using v6 sendMessage({ text })
  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;
    
    setStreamArtifacts([]);
    
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
    setStreamArtifacts([]);
  }, [setMessages]);

  return {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
    artifacts,
    conversationId: currentConversationId,
  };
}

export default useAIChat;
