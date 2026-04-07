'use client';

/**
 * useMessageCache — Manages in-memory + sessionStorage + localStorage caching
 * of chat messages and their rich parts (tool UI, artifacts, etc.).
 *
 * Extracted from ChatPage.tsx to encapsulate the complex caching strategy:
 * 1. In-memory cache (Map) — instant switching between conversations
 * 2. sessionStorage — tab-level persistence for page navigations
 * 3. localStorage (parts only) — survives full page reloads for rich tool UI
 */

import { useRef, useCallback } from 'react';

export interface CachedMessage {
  id: string;
  role: string;
  content: string;
  parts: any[];
  createdAt?: Date | string;
}

export function useMessageCache() {
  const memoryCache = useRef<Record<string, CachedMessage[]>>({});

  /**
   * Save messages to all cache layers for a conversation.
   */
  const saveToCache = useCallback((conversationId: string, messages: any[]) => {
    if (!conversationId || messages.length === 0) return;

    const normalized: CachedMessage[] = messages.map((m: any) => ({
      id: m.id,
      role: m.role,
      content: m.content || '',
      parts: m.parts || [{ type: 'text', text: m.content || '' }],
      createdAt: m.createdAt,
    }));

    // Layer 1: In-memory
    memoryCache.current[conversationId] = normalized;

    // Layer 2: sessionStorage (full messages)
    try {
      sessionStorage.setItem(`chat_msgs_${conversationId}`, JSON.stringify(normalized));
    } catch {
      /* storage full, ignore */
    }

    // Layer 3: localStorage (all parts — for tool UI survival on full reload)
    try {
      const partsCache: Record<string, any[]> = {};
      messages.forEach((m: any) => {
        if (m.id && m.parts?.length > 0) {
          partsCache[m.id] = m.parts;
        }
      });

      if (Object.keys(partsCache).length > 0) {
        try {
          const existing = JSON.parse(localStorage.getItem(`chat_parts_${conversationId}`) || '{}');
          localStorage.setItem(
            `chat_parts_${conversationId}`,
            JSON.stringify({ ...existing, ...partsCache }),
          );
        } catch {
          localStorage.setItem(`chat_parts_${conversationId}`, JSON.stringify(partsCache));
        }
      }
    } catch {
      /* localStorage error, ignore */
    }
  }, []);

  /**
   * Load messages from cache (memory → sessionStorage fallback).
   * Returns null if no cache exists.
   */
  const loadFromCache = useCallback((conversationId: string): CachedMessage[] | null => {
    // Try in-memory first
    const memCached = memoryCache.current[conversationId];
    if (memCached && memCached.length > 0) return memCached;

    // Try sessionStorage
    try {
      const raw = sessionStorage.getItem(`chat_msgs_${conversationId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.length > 0) {
          memoryCache.current[conversationId] = parsed;
          return parsed;
        }
      }
    } catch {
      /* ignore */
    }

    return null;
  }, []);

  /**
   * Load cached rich parts from localStorage for a conversation.
   * Used to restore tool UI parts when loading messages from the backend.
   */
  const loadPartsCache = useCallback((conversationId: string): Record<string, any[]> => {
    try {
      const raw = localStorage.getItem(`chat_parts_${conversationId}`);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    return {};
  }, []);

  /**
   * Save only the parts cache (used during onFinish to persist streamed parts).
   * Saves ALL messages that have any parts — including pure text ones — so that
   * tool-invocation parts (type='tool-invocation', state='output-available') are
   * captured and survive a full page reload.
   */
  const savePartsToCache = useCallback((conversationId: string, messages: any[]) => {
    try {
      const partsCache: Record<string, any[]> = {};
      messages.forEach((m: any) => {
        if (m.id && m.parts?.length > 0) {
          // Save parts for any message that has tool, reasoning, or source parts.
          // Also save if it has ANY part — the overhead is negligible and ensures
          // nothing is lost on reload.
          partsCache[m.id] = m.parts;
        }
      });
      if (Object.keys(partsCache).length > 0) {
        try {
          const existing = JSON.parse(localStorage.getItem(`chat_parts_${conversationId}`) || '{}');
          localStorage.setItem(
            `chat_parts_${conversationId}`,
            JSON.stringify({ ...existing, ...partsCache }),
          );
        } catch {
          // Quota exceeded — try storing just the most recent N messages
          try {
            const recent = Object.fromEntries(Object.entries(partsCache).slice(-20));
            localStorage.setItem(`chat_parts_${conversationId}`, JSON.stringify(recent));
          } catch {
            /* give up gracefully */
          }
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  /**
   * Check if a conversation has cached messages.
   */
  const hasCachedMessages = useCallback((conversationId: string): boolean => {
    return (memoryCache.current[conversationId]?.length ?? 0) > 0;
  }, []);

  return {
    saveToCache,
    loadFromCache,
    loadPartsCache,
    savePartsToCache,
    hasCachedMessages,
  };
}
