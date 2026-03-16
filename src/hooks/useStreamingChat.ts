/**
 * @deprecated This hook is NOT used anywhere in the app. All chat pages use
 * `useChat` from `@ai-sdk/react` directly with `DefaultChatTransport`.
 * This lower-level hook uses `apiClient.sendMessageStream()` which bypasses
 * the AI SDK entirely. It can be safely deleted.
 */
import { useCallback, useRef, useState } from 'react';
import apiClient from '@/lib/api';

export interface Artifact {
  id: string;
  type: 'react' | 'html' | 'svg' | 'mermaid' | 'markdown' | 'code';
  language: string;
  code: string;
  start: number;
  end: number;
  complete: boolean;
}

export interface StreamingChatOptions {
  signal?: AbortSignal;
  onText?: (text: string) => void;
  onToolCall?: (toolCallId: string, toolName: string, args: any) => void;
  onToolResult?: (toolCallId: string, result: any) => void;
  onData?: (data: any) => void;
  onError?: (error: string) => void;
  onFinish?: (finishReason: string, usage: any) => void;
}

export function useStreamingChat() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [currentArtifacts, setCurrentArtifacts] = useState<Artifact[]>([]);

  const sendMessageStream = useCallback(async (
    message: string, 
    conversationId?: string, 
    options: StreamingChatOptions = {}
  ) => {
    // Reset artifacts for new message
    setCurrentArtifacts([]);
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    const { signal, onText, onToolCall, onToolResult, onData, onError, onFinish } = options;

    try {
      const response = await apiClient.sendMessageStream(message, conversationId, {
        signal: abortControllerRef.current.signal,
        onText,
        onToolCall,
        onToolResult,
        onData: (data: any) => {
          // Handle artifacts from backend's GenerativeUIStream
          if (data && typeof data === 'object') {
            // Check if data contains artifacts array
            if (Array.isArray(data.artifacts)) {
              setCurrentArtifacts(prev => {
                // Merge new artifacts, replacing duplicates by id
                const artifactMap = new Map(prev.map(a => [a.id, a]));
                data.artifacts.forEach((artifact: Artifact) => {
                  artifactMap.set(artifact.id, artifact);
                });
                return Array.from(artifactMap.values());
              });
            }
            // Or if data itself is an array of artifacts
            else if (Array.isArray(data)) {
              setCurrentArtifacts(prev => {
                const artifactMap = new Map(prev.map(a => [a.id, a]));
                data.forEach((artifact: Artifact) => {
                  artifactMap.set(artifact.id, artifact);
                });
                return Array.from(artifactMap.values());
              });
            }
          }
          
          // Call original onData handler
          options.onData?.(data);
        },
        onError,
        onFinish: (finishReason: string, usage: any) => {
          // Clear abort controller when finished
          abortControllerRef.current = null;
          
          // Call original onFinish handler
          onFinish?.(finishReason, usage);
        },
      });

      return response;
    } catch (error) {
      // Clear abort controller on error
      abortControllerRef.current = null;
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw error; // Re-throw abort errors
      }
      throw error;
    }
  }, []);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const isStreaming = useCallback(() => {
    return abortControllerRef.current !== null;
  }, []);

  const clearArtifacts = useCallback(() => {
    setCurrentArtifacts([]);
  }, []);

  const updateArtifact = useCallback((id: string, updates: Partial<Artifact>) => {
    setCurrentArtifacts(prev => 
      prev.map(artifact => 
        artifact.id === id ? { ...artifact, ...updates } : artifact
      )
    );
  }, []);

  const removeArtifact = useCallback((id: string) => {
    setCurrentArtifacts(prev => prev.filter(artifact => artifact.id !== id));
  }, []);

  return {
    sendMessageStream,
    stopStreaming,
    isStreaming,
    currentArtifacts,
    clearArtifacts,
    updateArtifact,
    removeArtifact,
  };
}